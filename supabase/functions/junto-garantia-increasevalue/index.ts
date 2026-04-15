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
  const r = await fetch(AUTH_URLS[env], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }) });
  if (!r.ok) throw new Error(`Auth falhou (${r.status}): ${await r.text()}`);
  const d = await r.json();
  const token = d.accessToken || d.access_token;
  if (!token) throw new Error("Token não retornado");
  const bearer = `${d.tokenType || d.token_type || "Bearer"} ${token}`;
  tokenCache[env] = { bearer, expiresAt: Date.now() + (d.expiresIn || d.expires_in || 3600) * 1000 };
  return bearer;
}

async function getToken(env: Environment) {
  const c = tokenCache[env];
  if (c && c.expiresAt - TOKEN_MARGIN_MS > Date.now()) return c.bearer;
  return authenticate(env);
}

async function juntoFetch(url: string, env: Environment, opts: RequestInit = {}) {
  const hdrs: Record<string, string> = { ...(opts.headers as Record<string, string> || {}), Authorization: await getToken(env), Accept: "application/json" };
  if (opts.body && typeof opts.body === "string") hdrs["Content-Type"] = "application/json";
  let r = await fetch(url, { ...opts, headers: hdrs });
  if (r.status === 401) { tokenCache[env] = null; hdrs.Authorization = await authenticate(env); r = await fetch(url, { ...opts, headers: hdrs }); }
  return r;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Não autorizado" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: ae } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (ae || !user) return json({ error: "Token inválido" }, 401);

    const body = await req.json();
    const { action, environment = "sandbox", policyNumber, id } = body;
    const env = (environment === "production" ? "production" : "sandbox") as Environment;
    const base = BASE_URLS[env];

    // ─── create: POST /policies/{pn}/increasevalue
    if (action === "create") {
      if (!policyNumber) return json({ error: "policyNumber obrigatório" }, 400);
      const { increaseInsuredAmount, durationStart, dueDateFirstInstallment, additionalInformation } = body;
      if (!increaseInsuredAmount || !durationStart) return json({ error: "increaseInsuredAmount e durationStart obrigatórios" }, 400);
      const payload: Record<string, unknown> = { increaseInsuredAmount, durationStart };
      if (dueDateFirstInstallment) payload.dueDateFirstInstallment = dueDateFirstInstallment;
      if (additionalInformation) payload.additionalInformation = additionalInformation;
      const url = `${base}/policies/${encodeURIComponent(policyNumber)}/increasevalue`;
      console.log(`[increasevalue] POST ${url}`);
      const r = await juntoFetch(url, env, { method: "POST", body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) return json({ success: false, error: `API ${r.status}`, details: d }, r.status);
      return json({ success: true, data: d });
    }

    // ─── update: PUT /policies/{pn}/increasevalue/{id}
    if (action === "update") {
      if (!policyNumber || !id) return json({ error: "policyNumber e id obrigatórios" }, 400);
      const { increaseInsuredAmount, durationStart, dueDateFirstInstallment, installmentNumber, additionalInformation } = body;
      if (!increaseInsuredAmount || !durationStart || !dueDateFirstInstallment || !installmentNumber)
        return json({ error: "increaseInsuredAmount, durationStart, dueDateFirstInstallment e installmentNumber obrigatórios" }, 400);
      const payload: Record<string, unknown> = { increaseInsuredAmount, durationStart, dueDateFirstInstallment, installmentNumber };
      if (additionalInformation) payload.additionalInformation = additionalInformation;
      const url = `${base}/policies/${encodeURIComponent(policyNumber)}/increasevalue/${id}`;
      console.log(`[increasevalue] PUT ${url}`);
      const r = await juntoFetch(url, env, { method: "PUT", body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) return json({ success: false, error: `API ${r.status}`, details: d }, r.status);
      return json({ success: true, data: d });
    }

    // ─── details: GET /policies/{pn}/increasevalue/{id}
    if (action === "details") {
      if (!policyNumber || !id) return json({ error: "policyNumber e id obrigatórios" }, 400);
      const url = `${base}/policies/${encodeURIComponent(policyNumber)}/increasevalue/${id}`;
      console.log(`[increasevalue] GET ${url}`);
      const r = await juntoFetch(url, env);
      const d = await r.json();
      if (!r.ok) return json({ success: false, error: `API ${r.status}`, details: d }, r.status);
      return json({ success: true, data: d });
    }

    // ─── draft: PUT /policies/{pn}/increasevalue/{id}/draft
    if (action === "draft") {
      if (!policyNumber || !id) return json({ error: "policyNumber e id obrigatórios" }, 400);
      const { documentObjectTypes } = body;
      const payload: Record<string, unknown> = {};
      if (documentObjectTypes) payload.documentObjectTypes = documentObjectTypes;
      const url = `${base}/policies/${encodeURIComponent(policyNumber)}/increasevalue/${id}/draft`;
      console.log(`[increasevalue] PUT ${url}`);
      const r = await juntoFetch(url, env, { method: "PUT", body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) return json({ success: false, error: `API ${r.status}`, details: d }, r.status);
      return json({ success: true, data: d });
    }

    // ─── issue: POST /policies/{pn}/increasevalue/{id}/issue
    if (action === "issue") {
      if (!policyNumber || !id) return json({ error: "policyNumber e id obrigatórios" }, 400);
      const url = `${base}/policies/${encodeURIComponent(policyNumber)}/increasevalue/${id}/issue`;
      console.log(`[increasevalue] POST ${url}`);
      const r = await juntoFetch(url, env, { method: "POST" });
      const d = await r.json();
      if (!r.ok) return json({ success: false, error: `API ${r.status}`, details: d }, r.status);
      return json({ success: true, data: d });
    }

    return json({ error: `Ação '${action}' não suportada` }, 400);
  } catch (err) {
    console.error("[increasevalue] Erro:", err);
    return json({ success: false, error: err.message }, 500);
  }
});
