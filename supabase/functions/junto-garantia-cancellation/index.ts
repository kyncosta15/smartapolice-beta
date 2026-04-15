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
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    Authorization: token,
    Accept: "application/json",
  };
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    tokenCache[env] = null;
    const freshToken = await authenticate(env);
    headers.Authorization = freshToken;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user) return jsonResponse({ error: "Token inválido" }, 401);

    const body = await req.json();
    const { action, environment = "sandbox" } = body;
    const env = (environment === "production" ? "production" : "sandbox") as Environment;
    const baseUrl = BASE_URLS[env];

    // ─── reasons: GET /cancellation/reasons?policyNumber=...
    if (action === "reasons") {
      const { policyNumber } = body;
      if (!policyNumber) return jsonResponse({ error: "policyNumber é obrigatório" }, 400);

      const url = `${baseUrl}/cancellation/reasons?policyNumber=${encodeURIComponent(policyNumber)}`;
      console.log(`[cancellation] GET ${url}`);
      const response = await juntoFetch(url, env);
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    // ─── create: POST /cancellation
    if (action === "create") {
      const { policyNumber, referenceCancellationDate, reason, additionalInformation, reemitPolicy, replacePolicyNumber } = body;
      if (!policyNumber || !referenceCancellationDate || !reason) {
        return jsonResponse({ error: "policyNumber, referenceCancellationDate e reason são obrigatórios" }, 400);
      }

      const payload: Record<string, unknown> = {
        policyNumber,
        referenceCancellationDate,
        reason,
      };
      if (additionalInformation) payload.additionalInformation = additionalInformation;
      if (reemitPolicy !== undefined) payload.reemitPolicy = reemitPolicy;
      if (replacePolicyNumber) payload.replacePolicyNumber = replacePolicyNumber;

      const url = `${baseUrl}/cancellation`;
      console.log(`[cancellation] POST ${url}`);
      const response = await juntoFetch(url, env, { method: "POST", body: JSON.stringify(payload) });
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    // ─── update: PUT /cancellation/{id}
    if (action === "update") {
      const { id, referenceCancellationDate, additionalInformation, reemitPolicy } = body;
      if (!id || !referenceCancellationDate) {
        return jsonResponse({ error: "id e referenceCancellationDate são obrigatórios" }, 400);
      }

      const payload: Record<string, unknown> = { referenceCancellationDate };
      if (additionalInformation) payload.additionalInformation = additionalInformation;
      if (reemitPolicy !== undefined) payload.reemitPolicy = reemitPolicy;

      const url = `${baseUrl}/cancellation/${id}`;
      console.log(`[cancellation] PUT ${url}`);
      const response = await juntoFetch(url, env, { method: "PUT", body: JSON.stringify(payload) });
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    // ─── details: GET /cancellation/{id}
    if (action === "details") {
      const { id } = body;
      if (!id) return jsonResponse({ error: "id é obrigatório" }, 400);

      const url = `${baseUrl}/cancellation/${id}`;
      console.log(`[cancellation] GET ${url}`);
      const response = await juntoFetch(url, env);
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    // ─── issue: POST /cancellation/{id}/issue
    if (action === "issue") {
      const { id } = body;
      if (!id) return jsonResponse({ error: "id é obrigatório" }, 400);

      const url = `${baseUrl}/cancellation/${id}/issue`;
      console.log(`[cancellation] POST ${url}`);
      const response = await juntoFetch(url, env, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    // ─── allProcess: POST /policies/{policyNumber}/cancellationallproccess
    if (action === "allProcess") {
      const { policyNumber, referenceCancellationDate, reason, additionalInformation, reemitPolicy } = body;
      if (!policyNumber || !referenceCancellationDate || !reason) {
        return jsonResponse({ error: "policyNumber, referenceCancellationDate e reason são obrigatórios" }, 400);
      }

      const payload: Record<string, unknown> = { referenceCancellationDate, reason };
      if (additionalInformation) payload.additionalInformation = additionalInformation;
      if (reemitPolicy !== undefined) payload.reemitPolicy = reemitPolicy;

      const url = `${baseUrl}/policies/${encodeURIComponent(policyNumber)}/cancellationallproccess`;
      console.log(`[cancellation] POST ${url}`);
      const response = await juntoFetch(url, env, { method: "POST", body: JSON.stringify(payload) });
      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ success: false, error: `API ${response.status}`, details: data }, response.status);
      }
      return jsonResponse({ success: true, data });
    }

    return jsonResponse({ error: `Ação '${action}' não suportada` }, 400);

  } catch (err) {
    console.error("[cancellation] Erro:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
});
