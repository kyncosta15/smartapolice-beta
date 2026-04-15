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

async function authenticate(env: Environment): Promise<string> {
  const clientId = Deno.env.get("JUNTO_CLIENT_ID");
  const clientSecret = Deno.env.get("JUNTO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais da Junto não configuradas");

  const res = await fetch(AUTH_URLS[env], {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json", Accept: "*/*" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!res.ok) throw new Error(`Auth falhou (${res.status}): ${await res.text()}`);

  const data = await res.json();
  const token = data.accessToken || data.access_token;
  if (!token) throw new Error("Token não retornado");

  const tokenType = data.tokenType || data.token_type || "Bearer";
  const expiresIn = data.expiresIn || data.expires_in || 3600;
  const bearer = `${tokenType} ${token}`;
  tokenCache[env] = { bearer, expiresAt: Date.now() + expiresIn * 1000 };
  return bearer;
}

async function getValidToken(env: Environment): Promise<string> {
  const cached = tokenCache[env];
  if (cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cached.bearer;
  return authenticate(env);
}

async function juntoFetch(url: string, env: Environment, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken(env);
  const headers: Record<string, string> = { ...options.headers as Record<string, string>, Authorization: token, Accept: "application/json" };
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    tokenCache[env] = null;
    const fresh = await authenticate(env);
    headers.Authorization = fresh;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

function jsonResponse(body: unknown, status = 200) {
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
    const action = body.action || "list";
    const baseUrl = BASE_URLS[environment];

    // GET /insured — Listar segurados
    if (action === "list") {
      const params = new URLSearchParams();
      if (body.federalId) params.set("FederalId", body.federalId);
      if (body.name) params.set("Name", body.name);
      if (body.pageNumber) params.set("PageNumber", String(body.pageNumber));
      params.set("PageSize", String(body.pageSize || 50));

      const url = `${baseUrl}/insured?${params.toString()}`;
      console.log(`[junto-insured] List: ${url}`);

      const response = await juntoFetch(url, environment);
      const text = await response.text();

      if (!response.ok) {
        console.error(`[junto-insured] Erro ${response.status}: ${text}`);
        return jsonResponse({ success: false, error: `Erro ao buscar segurados (${response.status})`, details: text.slice(0, 500) });
      }

      const data = JSON.parse(text);
      const insuredList = Array.isArray(data) ? data : (data.data || data.items || []);

      return jsonResponse({
        success: true,
        insured: insuredList,
        count: insuredList.length,
        pagination: data.pageNumber ? {
          pageNumber: data.pageNumber,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        } : null,
        environment,
      });
    }

    // GET /insured/{federalId} — Detalhes do segurado
    if (action === "details") {
      const federalId = body.federalId;
      if (!federalId) return jsonResponse({ success: false, error: "federalId é obrigatório" });

      const url = `${baseUrl}/insured/${federalId}`;
      console.log(`[junto-insured] Details: ${url}`);

      const response = await juntoFetch(url, environment);
      if (!response.ok) {
        const errText = await response.text();
        return jsonResponse({ success: false, error: `Erro ao buscar detalhes (${response.status})`, details: errText.slice(0, 500) });
      }

      const details = await response.json();
      return jsonResponse({ success: true, insured: details, environment });
    }

    // POST /insured — Cadastrar segurado
    if (action === "register") {
      const { federalId, name } = body;
      if (!federalId) return jsonResponse({ success: false, error: "federalId (CNPJ/CPF) é obrigatório" });

      const payload: Record<string, string> = { federalId };
      if (name) payload.name = name;

      const url = `${baseUrl}/insured`;
      console.log(`[junto-insured] Register: ${url}`);

      const response = await juntoFetch(url, environment, {
        method: "POST",
        headers: { "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.status !== 202) {
        const errText = await response.text();
        return jsonResponse({ success: false, error: `Erro ao cadastrar segurado (${response.status})`, details: errText.slice(0, 500) });
      }

      const result = await response.json().catch(() => null);
      return jsonResponse({
        success: true,
        message: "Cadastro de segurado realizado com sucesso.",
        insured: result,
        environment,
      });
    }

    return jsonResponse({ success: false, error: "Ação inválida. Use: list, details, register" });

  } catch (error) {
    console.error("[junto-insured] Erro:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});
