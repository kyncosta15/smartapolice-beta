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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth falhou (${response.status}): ${text}`);
  }

  const data = await response.json();
  const token = data.accessToken || data.access_token;
  if (!token) throw new Error("Token não retornado pela API");

  const tokenType = data.tokenType || data.token_type || "Bearer";
  const expiresIn = data.expiresIn || data.expires_in || 3600;
  const bearer = `${tokenType} ${token}`;

  tokenCache[environment] = { bearer, expiresAt: Date.now() + expiresIn * 1000 };
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action = "list", environment = "sandbox", name, page = 1, pageSize = 50 } = body;
    const env = (environment === "production" ? "production" : "sandbox") as Environment;
    const baseUrl = BASE_URLS[env];

    if (action === "list") {
      // GET /economicGroup?name=...&page=...&pageSize=...
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));

      const url = `${baseUrl}/economicGroup?${params.toString()}`;
      console.log(`[economic-group] GET ${url}`);

      const response = await juntoFetch(url, env);
      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: `API retornou ${response.status}`,
          details: JSON.stringify(data),
        }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: data,
        page,
        pageSize,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Ação '${action}' não suportada` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[economic-group] Erro:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
