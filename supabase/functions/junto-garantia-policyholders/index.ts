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
  console.log(`[junto-policyholders] Token renovado para ${environment}, expira em ${expiresIn}s`);
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
    console.log("[junto-policyholders] 401, forçando refresh...");
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
      const params = new URLSearchParams();
      if (body.federalId) params.set("FederalId", body.federalId);
      if (body.name) params.set("Name", body.name);
      if (body.pageNumber) params.set("PageNumber", String(body.pageNumber));
      params.set("PageSize", String(body.pageSize || 50));

      const url = `${baseUrl}/policyholders?${params.toString()}`;
      console.log(`[junto-policyholders] Buscando tomadores: ${url}`);

      const response = await juntoFetch(url, environment);
      const responseText = await response.text();
      console.log(`[junto-policyholders] Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-policyholders] Erro: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar tomadores (${response.status})`,
          details: responseText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      const policyholders = Array.isArray(data) ? data : (data.data || data.items || []);

      // Sync to guarantee_policyholders table
      if (policyholders.length > 0) {
        const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
          auth: { persistSession: false },
        });

        for (const p of policyholders) {
          const federalId = p.federalId || p.document || p.cpfCnpj || null;
          if (!federalId) continue;

          const record = {
            user_id: user.id,
            external_id: p.id || p.policyholderCode || null,
            federal_id: federalId,
            name: p.name || p.companyName || p.razaoSocial || null,
            trade_name: p.tradeName || p.nomeFantasia || null,
            economic_group: p.economicGroup?.name || p.economicGroupName || null,
            credit_limit: p.creditLimit || p.limite || null,
            credit_limit_available: p.creditLimitAvailable || p.limiteDisponivel || null,
            risk_rating: p.riskRating || p.rating || null,
            status: p.status || "Ativo",
            registration_date: p.registrationDate || p.createdAt || null,
            address_city: p.address?.city || p.city || null,
            address_state: p.address?.state || p.state || null,
            segment: p.segment || p.activityBranch || null,
            raw_data: p,
            synced_at: new Date().toISOString(),
          };

          await adminClient
            .from("guarantee_policyholders")
            .upsert(record, { onConflict: "federal_id,user_id", ignoreDuplicates: false })
            .select();
        }
        console.log(`[junto-policyholders] ${policyholders.length} tomadores sincronizados`);
      }

      return new Response(JSON.stringify({
        success: true,
        policyholders,
        count: policyholders.length,
        environment,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "details") {
      const federalId = body.federalId;
      if (!federalId) {
        return new Response(JSON.stringify({ success: false, error: "federalId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policyholders/${federalId}`;
      console.log(`[junto-policyholders] Detalhes: ${url}`);

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
      return new Response(JSON.stringify({ success: true, policyholder: details, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "modalities") {
      // GET /policyholders/{federalId}/modalities — Modalidades do tomador
      const federalId = body.federalId;
      if (!federalId) {
        return new Response(JSON.stringify({ success: false, error: "federalId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policyholders/${federalId}/modalities`;
      console.log(`[junto-policyholders] Modalidades: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar modalidades (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const modalities = await response.json();
      return new Response(JSON.stringify({ success: true, modalities, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "limits") {
      // GET /policyholders/{federalId}/limits — Limites do tomador
      const federalId = body.federalId;
      if (!federalId) {
        return new Response(JSON.stringify({ success: false, error: "federalId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policyholders/${federalId}/limits`;
      console.log(`[junto-policyholders] Limites: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar limites (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const limits = await response.json();
      return new Response(JSON.stringify({ success: true, limits, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "rates") {
      // GET /policyholders/{federalId}/modalities/{modalityId}/rates
      const federalId = body.federalId;
      const modalityId = body.modalityId;
      if (!federalId || !modalityId) {
        return new Response(JSON.stringify({ success: false, error: "federalId e modalityId são obrigatórios" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policyholders/${federalId}/modalities/${modalityId}/rates`;
      console.log(`[junto-policyholders] Rates: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar taxas (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rates = await response.json();
      return new Response(JSON.stringify({ success: true, rates, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "register") {
      // POST /policyholders — Cadastro de tomador
      const federalId = body.federalId;
      if (!federalId) {
        return new Response(JSON.stringify({ success: false, error: "federalId (CNPJ) é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/policyholders`;
      console.log(`[junto-policyholders] Register: ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        headers: { "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify({ federalId }),
      });

      if (!response.ok && response.status !== 202) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao cadastrar tomador (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Cadastro de tomador iniciado. Aguarde processamento (8-10s) e consulte novamente.",
        environment,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "expiring") {
      // GET /policyholders — Tomadores com cadastro a vencer
      const params = new URLSearchParams();
      if (body.expirationStart) params.set("ExpirationStart", body.expirationStart);
      if (body.expirationEnd) params.set("ExpirationEnd", body.expirationEnd);
      if (body.pageNumber) params.set("PageNumber", String(body.pageNumber));
      if (body.rowsOfPage) params.set("RowsOfPage", String(body.rowsOfPage));

      const url = `${baseUrl}/policyholders?${params.toString()}`;
      console.log(`[junto-policyholders] Expiring: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar tomadores a vencer (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const policyholders = data.data || [];
      return new Response(JSON.stringify({
        success: true,
        policyholders,
        pagination: {
          pageNumber: data.pageNumber,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        },
        environment,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Ação inválida" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-policyholders] Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
