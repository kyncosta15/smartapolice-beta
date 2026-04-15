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
  console.log(`[junto-judicial-fiscal] Token renovado para ${environment}, expira em ${expiresIn}s`);
  return bearer;
}

async function getValidToken(env: Environment): Promise<string> {
  const cached = tokenCache[env];
  if (cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cached.bearer;
  return authenticate(env);
}

async function juntoFetch(url: string, env: Environment, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken(env);
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    Authorization: token,
    Accept: "application/json",
  };
  if (options.body) headers["Content-Type"] = "application/json";

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.log("[junto-judicial-fiscal] 401, forçando refresh...");
    tokenCache[env] = null;
    const freshToken = await authenticate(env);
    headers.Authorization = freshToken;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Token inválido" }, 401);

    const body = await req.json().catch(() => ({}));
    const environment: Environment = body.environment === "sandbox" ? "sandbox" : "production";
    const action = body.action;
    const baseUrl = BASE_URLS[environment];

    // ── createQuote (POST /judicial-fiscal) ──
    if (action === "createQuote") {
      const payload = body.payload;
      if (!payload) return jsonResponse({ success: false, error: "payload é obrigatório" });

      const url = `${baseUrl}/judicial-fiscal`;
      console.log(`[junto-judicial-fiscal] POST ${url}`);

      const response = await juntoFetch(url, environment, { method: "POST", body: JSON.stringify(payload) });
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[junto-judicial-fiscal] Erro createQuote: ${responseText}`);
        return jsonResponse({ success: false, error: `Erro ao criar cotação (${response.status})`, details: responseText.slice(0, 1000) });
      }

      return jsonResponse({ success: true, data: JSON.parse(responseText), environment });
    }

    // ── updateQuote (PUT /judicial-fiscal) ──
    if (action === "updateQuote") {
      const payload = body.payload;
      if (!payload) return jsonResponse({ success: false, error: "payload é obrigatório" });

      const url = `${baseUrl}/judicial-fiscal`;
      console.log(`[junto-judicial-fiscal] PUT ${url}`);

      const response = await juntoFetch(url, environment, { method: "PUT", body: JSON.stringify(payload) });
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[junto-judicial-fiscal] Erro updateQuote: ${responseText}`);
        return jsonResponse({ success: false, error: `Erro ao atualizar cotação (${response.status})`, details: responseText.slice(0, 1000) });
      }

      return jsonResponse({ success: true, data: JSON.parse(responseText), environment });
    }

    // ── getQuote (GET /judicial-fiscal/{quoteId}) ──
    if (action === "getQuote") {
      const quoteId = body.quoteId;
      if (!quoteId) return jsonResponse({ success: false, error: "quoteId é obrigatório" });

      const url = `${baseUrl}/judicial-fiscal/${quoteId}`;
      console.log(`[junto-judicial-fiscal] GET ${url}`);

      const response = await juntoFetch(url, environment);
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[junto-judicial-fiscal] Erro getQuote: ${responseText}`);
        return jsonResponse({ success: false, error: `Erro ao consultar (${response.status})`, details: responseText.slice(0, 1000) });
      }

      return jsonResponse({ success: true, data: JSON.parse(responseText), environment });
    }

    // ── upsertMinuta (PUT /judicial-fiscal/{quoteId}/draft) ──
    if (action === "upsertMinuta") {
      const quoteId = body.quoteId;
      if (!quoteId) return jsonResponse({ success: false, error: "quoteId é obrigatório" });

      const url = `${baseUrl}/judicial-fiscal/${quoteId}/draft`;
      console.log(`[junto-judicial-fiscal] PUT ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "PUT",
        body: body.payload ? JSON.stringify(body.payload) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[junto-judicial-fiscal] Erro upsertMinuta: ${responseText}`);
        return jsonResponse({ success: false, error: `Erro ao criar/atualizar minuta (${response.status})`, details: responseText.slice(0, 1000) });
      }

      let data = null;
      try { data = JSON.parse(responseText); } catch { data = responseText; }
      return jsonResponse({ success: true, data, environment });
    }

    // ── requestEmission (POST /judicial-fiscal/{quoteId}/emission) ──
    if (action === "requestEmission") {
      const quoteId = body.quoteId;
      if (!quoteId) return jsonResponse({ success: false, error: "quoteId é obrigatório" });

      const url = `${baseUrl}/judicial-fiscal/${quoteId}/emission`;
      console.log(`[junto-judicial-fiscal] POST ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        body: body.payload ? JSON.stringify(body.payload) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[junto-judicial-fiscal] Erro requestEmission: ${responseText}`);
        return jsonResponse({ success: false, error: `Erro ao solicitar emissão (${response.status})`, details: responseText.slice(0, 1000) });
      }

      let data = null;
      try { data = JSON.parse(responseText); } catch { data = responseText; }
      return jsonResponse({ success: true, data, environment });
    }

    return jsonResponse({ success: false, error: "Ação inválida. Use: createQuote, updateQuote, getQuote, upsertMinuta, requestEmission" });

  } catch (error) {
    console.error("[junto-judicial-fiscal] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});
