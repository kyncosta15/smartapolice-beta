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
  console.log(`[junto-endorsements] Token renovado para ${environment}, expira em ${expiresIn}s`);
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
    console.log("[junto-endorsements] 401, forçando refresh...");
    tokenCache[env] = null;
    const freshToken = await authenticate(env);
    headers.Authorization = freshToken;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

const DOCUMENT_TYPES: Record<number, string> = {
  2: "Aumento IS",
  3: "Aumento Prazo",
  4: "Aumento Prazo e IS",
  5: "Redução IS",
  6: "Neutro",
  7: "Cancelamento",
  8: "Baixa",
  10: "Redução Prazo",
  11: "Redução Prazo e IS",
};

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
      const dateEnd = body.endDate || new Date().toISOString();
      const dateStart = body.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const params = new URLSearchParams();
      params.set("StartDate", dateStart);
      params.set("EndDate", dateEnd);
      if (body.pageNumber) params.set("PageNumber", String(body.pageNumber));
      params.set("RowsOfPage", String(body.rowsOfPage || 50));
      if (body.documentType) params.set("DocumentType", String(body.documentType));

      const url = `${baseUrl}/endorsements?${params.toString()}`;
      console.log(`[junto-endorsements] Buscando endossos: ${url}`);

      const response = await juntoFetch(url, environment);
      const responseText = await response.text();
      console.log(`[junto-endorsements] Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-endorsements] Erro: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar endossos (${response.status})`,
          details: responseText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      const endorsements = data.data || [];

      // Sync to guarantee_endorsements table
      if (endorsements.length > 0) {
        const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
          auth: { persistSession: false },
        });

        const records = endorsements.map((e: any) => ({
          user_id: user.id,
          external_id: e.documentNumber,
          document_number: e.documentNumber,
          main_document_number: e.mainDocumentNumber || null,
          main_policy_number: e.mainPolicyNumber || null,
          policyholder_name: e.policyholderName || null,
          policyholder_document: e.policyholderFederalId || null,
          insured_name: e.insuredName || null,
          insured_document: e.insuredFederalId || null,
          modality: e.modalityDescription || null,
          submodality: e.subModalityDescription || null,
          document_type: e.documentType?.description || DOCUMENT_TYPES[e.documentType?.id] || null,
          document_type_id: e.documentType?.id || null,
          duration_start: e.durationStart || null,
          duration_end: e.durationEnd || null,
          duration_days: e.durationInDays || null,
          premium_value: e.premiumValue || null,
          endorsement_secured_amount: e.endorsementSecuredAmount || null,
          broker_name: e.brokerName || null,
          additional_info: e.additionalInfo || null,
          status: "Emitido",
          raw_data: e,
          synced_at: new Date().toISOString(),
        }));

        for (const record of records) {
          await adminClient
            .from("guarantee_endorsements")
            .upsert(record, { onConflict: "external_id,user_id", ignoreDuplicates: false })
            .select();
        }
        console.log(`[junto-endorsements] ${records.length} endossos sincronizados`);
      }

      return new Response(JSON.stringify({
        success: true,
        pagination: {
          pageNumber: data.pageNumber,
          totalPages: data.totalPages,
          pageSize: data.pageSize,
          totalCount: data.totalCount,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        },
        endorsements,
        environment,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "hangs") {
      // GET /endorsements/{id}/hangs — Pendências de internalização do endosso
      const endorsementId = body.endorsementId;
      if (!endorsementId) {
        return new Response(JSON.stringify({ success: false, error: "endorsementId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/endorsements/${endorsementId}/hangs`;
      console.log(`[junto-endorsements] Hangs: ${url}`);

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

    } else if (action === "files") {
      // POST /endorsements/{id}/files — Enviar arquivos ao endosso (multipart)
      const endorsementId = body.endorsementId;
      if (!endorsementId) {
        return new Response(JSON.stringify({ success: false, error: "endorsementId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Files should be sent as base64 encoded in the body
      const files = body.files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "files (array de {name, base64, mimeType}) é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getValidToken(environment);
      const formData = new FormData();
      for (const file of files) {
        const binary = Uint8Array.from(atob(file.base64), c => c.charCodeAt(0));
        const blob = new Blob([binary], { type: file.mimeType || "application/octet-stream" });
        formData.append("Files", blob, file.name);
      }

      const url = `${baseUrl}/endorsements/${endorsementId}/files`;
      console.log(`[junto-endorsements] Upload files: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: token, Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao enviar arquivos (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await response.json();
      return new Response(JSON.stringify({ success: true, files: result, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "refunds") {
      // POST /endorsements/{id}/refunds — Solicitar restituição
      const endorsementId = body.endorsementId;
      if (!endorsementId) {
        return new Response(JSON.stringify({ success: false, error: "endorsementId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refundType = body.refundType;
      if (!refundType) {
        return new Response(JSON.stringify({ success: false, error: "refundType (1=Restituir valor, 2=Transferir crédito) é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refundBody: Record<string, any> = { refundType };
      if (body.referencePolicyNumberToTransfer) {
        refundBody.referencePolicyNumberToTransfer = body.referencePolicyNumberToTransfer;
      }

      const url = `${baseUrl}/endorsements/${endorsementId}/refunds`;
      console.log(`[junto-endorsements] Refund: ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        headers: { "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify(refundBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao solicitar restituição (${response.status})`,
          details: errorText.slice(0, 500),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await response.json();
      return new Response(JSON.stringify({ success: true, refund: result, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Ação inválida" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-endorsements] Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
