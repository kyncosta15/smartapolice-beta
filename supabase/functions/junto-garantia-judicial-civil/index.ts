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
  console.log(`[junto-judicial-civil] Token renovado para ${environment}, expira em ${expiresIn}s`);
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
    console.log("[junto-judicial-civil] 401, forçando refresh...");
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
    const action = body.action;
    const baseUrl = BASE_URLS[environment];

    // ── ACTION: createQuote (POST /judicial-civil) ──
    if (action === "createQuote") {
      const payload = body.payload;
      if (!payload) {
        return new Response(JSON.stringify({ success: false, error: "payload é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/judicial-civil`;
      console.log(`[junto-judicial-civil] Criar Cotação: POST ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`[junto-judicial-civil] createQuote status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-judicial-civil] Erro createQuote: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao criar cotação (${response.status})`,
          details: responseText.slice(0, 1000),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      return new Response(JSON.stringify({ success: true, data, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: updateQuote (PUT /judicial-civil) ──
    if (action === "updateQuote") {
      const payload = body.payload;
      if (!payload) {
        return new Response(JSON.stringify({ success: false, error: "payload é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/judicial-civil`;
      console.log(`[junto-judicial-civil] Atualizar Cotação: PUT ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`[junto-judicial-civil] updateQuote status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-judicial-civil] Erro updateQuote: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao atualizar cotação (${response.status})`,
          details: responseText.slice(0, 1000),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      return new Response(JSON.stringify({ success: true, data, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: getQuote (GET /judicial-civil/{quoteId}) ──
    if (action === "getQuote") {
      const quoteId = body.quoteId;
      if (!quoteId) {
        return new Response(JSON.stringify({ success: false, error: "quoteId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/judicial-civil/${quoteId}`;
      console.log(`[junto-judicial-civil] Consultar: GET ${url}`);

      const response = await juntoFetch(url, environment);
      const responseText = await response.text();
      console.log(`[junto-judicial-civil] getQuote status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-judicial-civil] Erro getQuote: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao consultar (${response.status})`,
          details: responseText.slice(0, 1000),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = JSON.parse(responseText);
      return new Response(JSON.stringify({ success: true, data, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: upsertMinuta (PUT /judicial-civil/{quoteId}/draft) ──
    if (action === "upsertMinuta") {
      const quoteId = body.quoteId;
      const payload = body.payload;
      if (!quoteId) {
        return new Response(JSON.stringify({ success: false, error: "quoteId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/judicial-civil/${quoteId}/draft`;
      console.log(`[junto-judicial-civil] Minuta: PUT ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "PUT",
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const responseText = await response.text();
      console.log(`[junto-judicial-civil] upsertMinuta status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-judicial-civil] Erro upsertMinuta: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao criar/atualizar minuta (${response.status})`,
          details: responseText.slice(0, 1000),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let data = null;
      try { data = JSON.parse(responseText); } catch { data = responseText; }
      return new Response(JSON.stringify({ success: true, data, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: requestEmission (POST /judicial-civil/{quoteId}/emission) ──
    if (action === "requestEmission") {
      const quoteId = body.quoteId;
      if (!quoteId) {
        return new Response(JSON.stringify({ success: false, error: "quoteId é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/judicial-civil/${quoteId}/emission`;
      console.log(`[junto-judicial-civil] Emissão: POST ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        body: body.payload ? JSON.stringify(body.payload) : undefined,
      });

      const responseText = await response.text();
      console.log(`[junto-judicial-civil] requestEmission status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-judicial-civil] Erro requestEmission: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao solicitar emissão (${response.status})`,
          details: responseText.slice(0, 1000),
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let data = null;
      try { data = JSON.parse(responseText); } catch { data = responseText; }
      return new Response(JSON.stringify({ success: true, data, environment }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Ação inválida. Use: createQuote, updateQuote, getQuote, upsertMinuta, requestEmission" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-judicial-civil] Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
