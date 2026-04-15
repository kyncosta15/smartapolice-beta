import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AUTH_URLS = {
  production: "https://ms-gateway.juntoseguros.com/guarantee/api/v2/authentication",
  sandbox: "https://ms-gateway-box.juntoseguros.com/guarantee/api/v2/authentication",
} as const;

const BASE_URLS = {
  production: "https://ms-gateway.juntoseguros.com/guarantee/api/v2",
  sandbox: "https://ms-gateway-box.juntoseguros.com/guarantee/api/v2",
} as const;

type Environment = keyof typeof AUTH_URLS;

// ── In-memory token cache ──
interface CachedToken { bearer: string; expiresAt: number; }
const tokenCache: Record<Environment, CachedToken | null> = { production: null, sandbox: null };
const TOKEN_MARGIN_MS = 60_000;

async function authenticate(environment: Environment): Promise<string> {
  const clientId = Deno.env.get("JUNTO_CLIENT_ID");
  const clientSecret = Deno.env.get("JUNTO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais da Junto não configuradas");

  const response = await fetch(AUTH_URLS[environment], {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json", Accept: "*/*" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na autenticação (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data.accessToken || data.access_token;
  if (!token) throw new Error("Token não retornado pela API");

  const tokenType = data.tokenType || data.token_type || "Bearer";
  const expiresIn = data.expiresIn || data.expires_in || 3600;
  const bearer = `${tokenType} ${token}`;

  tokenCache[environment] = { bearer, expiresAt: Date.now() + expiresIn * 1000 };
  console.log(`[junto-policies] Token renovado para ${environment}, expira em ${expiresIn}s`);
  return bearer;
}

async function getValidToken(env: Environment): Promise<string> {
  const cached = tokenCache[env];
  if (cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cached.bearer;
  return authenticate(env);
}

async function juntoFetch(url: string, env: Environment, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken(env);
  const headers = { ...options.headers as Record<string, string>, Authorization: token, Accept: "application/json" };
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.log("[junto-policies] 401, forçando refresh...");
    tokenCache[env] = null;
    const freshToken = await authenticate(env);
    headers.Authorization = freshToken;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const environment: Environment = body.environment === "sandbox" ? "sandbox" : "production";
    const action = body.action || "list";
    const baseUrl = BASE_URLS[environment];

    if (action === "list") {
      // Policies API requires DateStart & DateEnd (max 30 days)
      const dateEnd = body.dateEnd || new Date().toISOString();
      const dateStart = body.dateStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const params = new URLSearchParams();
      params.set("DateStart", dateStart);
      params.set("DateEnd", dateEnd);
      if (body.pageNumber) params.set("PageNumber", String(body.pageNumber));
      if (body.pageSize) params.set("PageSize", String(body.pageSize || 50));
      if (body.federalId) params.set("FederalId", body.federalId);
      if (body.isPolicyRenewal !== undefined) params.set("IsPolicyRenewal", String(body.isPolicyRenewal));

      const url = `${baseUrl}/policies?${params.toString()}`;
      console.log(`[junto-policies] Buscando apólices: ${url}`);

      const response = await juntoFetch(url, environment);
      const responseText = await response.text();
      console.log(`[junto-policies] Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-policies] Erro: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar apólices (${response.status})`,
          details: responseText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      const policies = Array.isArray(data) ? data : (data.data || data.items || []);

      // Sync to guarantee_policies table
      if (policies.length > 0) {
        const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
          auth: { persistSession: false },
        });

        const records = policies.map((p: any) => {
          const cancellationDate = p.cancellationAt || p.cancellationDate || null;
          const terminationDate = p.terminationDate || null;
          let status = "Ativa";
          if (cancellationDate) status = "Cancelada";
          else if (terminationDate) status = "Baixada";

          return {
            user_id: user.id,
            external_id: p.documentNumber || p.quoteId || 0,
            document_number: p.documentNumber || null,
            policy_number: p.policyNumber || null,
            policyholder_document: p.policyholderFederalId || null,
            policyholder_name: p.policyholderName || null,
            insured_document: p.insuredFederalId || null,
            insured_name: p.insuredName || null,
            modality: p.modalityDescription || null,
            issue_date: p.issueAt || null,
            duration_start: p.durationStart || null,
            duration_end: p.durationEnd || null,
            insured_amount: p.insuredAmount || null,
            total_premium: p.totalPremium || null,
            commission_value: p.commissionValue || null,
            cancellation_date: cancellationDate,
            is_renewal: p.isPolicyRenewal || false,
            junto_policy_number: p.juntoPolicyNumber || null,
            economic_group: p.economicGroup?.name || null,
            status,
            raw_data: p,
            synced_at: new Date().toISOString(),
          };
        });

        for (const record of records) {
          await adminClient
            .from("guarantee_policies")
            .upsert(record, { onConflict: "external_id,user_id", ignoreDuplicates: false })
            .select();
        }
        console.log(`[junto-policies] ${records.length} apólices sincronizadas`);
      }

      // The policies endpoint returns an array (no pagination wrapper)
      return new Response(JSON.stringify({
        success: true,
        policies,
        count: policies.length,
        environment,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "details") {
      const policyNumber = body.policyNumber;
      if (!policyNumber) {
        return new Response(JSON.stringify({ success: false, error: "policyNumber é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policies/${policyNumber}`;
      console.log(`[junto-policies] Detalhes: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar detalhes (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const details = await response.json();
      return new Response(JSON.stringify({ success: true, policy: details, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "hangs") {
      // GET /policies/{id}/hangs — Pendências de internalização
      const documentId = body.documentId;
      if (!documentId) {
        return new Response(JSON.stringify({ success: false, error: "documentId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policies/${documentId}/hangs`;
      console.log(`[junto-policies] Hangs: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar pendências (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const hangs = await response.json();
      return new Response(JSON.stringify({ success: true, hangs, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Ação inválida" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-policies] Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
