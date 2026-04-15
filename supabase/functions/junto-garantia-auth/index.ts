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

const VALIDATION_URLS = {
  production: "https://ms-gateway.juntoseguros.com/guarantee/api/v2/billings?PageNumber=1&RowsOfPage=1",
  sandbox: "https://ms-gateway-box.juntoseguros.com/guarantee/api/v2/billings?PageNumber=1&RowsOfPage=1",
} as const;

type Environment = keyof typeof AUTH_URLS;

const truncate = (value: string, max = 200) => value.slice(0, max);

const parseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractErrorMessage = (raw: string) => {
  const parsed = parseJson(raw);

  if (Array.isArray(parsed) && parsed[0]?.message) {
    return String(parsed[0].message);
  }

  if (parsed && typeof parsed === "object") {
    if ("message" in parsed && typeof parsed.message === "string") {
      return parsed.message;
    }

    if ("error" in parsed && typeof parsed.error === "string") {
      return parsed.error;
    }
  }

  return truncate(raw || "Erro sem detalhes retornados pela API.");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração do Supabase ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("JUNTO_CLIENT_ID");
    const clientSecret = Deno.env.get("JUNTO_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: "Credenciais da Junto não configuradas",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const environment: Environment = body.environment === "sandbox" ? "sandbox" : "production";
    const authUrl = AUTH_URLS[environment];
    const validationUrl = VALIDATION_URLS[environment];
    const maskedClientId = `${clientId.slice(0, 8)}...`;

    const logIntegration = async (payload: {
      action: string;
      endpoint: string;
      method: string;
      status_code: number;
      error_message?: string | null;
      response_summary?: Record<string, unknown> | null;
    }) => {
      try {
        await adminClient.from("guarantee_integration_logs").insert({
          user_id: user.id,
          action: payload.action,
          endpoint: payload.endpoint,
          method: payload.method,
          status_code: payload.status_code,
          error_message: payload.error_message ?? null,
          response_summary: payload.response_summary ?? null,
          duration_ms: 0,
        });
      } catch (logError) {
        console.error("[junto-garantia-auth] Falha ao salvar log:", logError);
      }
    };

    const persistSettings = async (status: string, lastError: string | null) => {
      try {
        const { data: existingSettings } = await adminClient
          .from("guarantee_settings")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        const payload = {
          user_id: user.id,
          environment,
          status,
          last_connection_test: new Date().toISOString(),
          last_error: lastError,
          client_id: maskedClientId,
        };

        const existingId = existingSettings?.[0]?.id;

        if (existingId) {
          await adminClient.from("guarantee_settings").update(payload).eq("id", existingId);
          return;
        }

        await adminClient.from("guarantee_settings").insert(payload);
      } catch (settingsError) {
        console.error("[junto-garantia-auth] Falha ao salvar settings:", settingsError);
      }
    };

    console.log(`[junto-garantia-auth] Tentando autenticação em: ${authUrl}`);

    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    const authText = await authResponse.text();
    console.log(`[junto-garantia-auth] Status auth: ${authResponse.status}`);

    if (!authResponse.ok) {
      const authError = extractErrorMessage(authText);
      console.error(`[junto-garantia-auth] Erro auth: ${authError}`);

      await logIntegration({
        action: "auth_token",
        endpoint: authUrl,
        method: "POST",
        status_code: authResponse.status,
        error_message: truncate(authText, 500),
      });

      await persistSettings("error", `Falha na autenticação (${authResponse.status})`);

      return new Response(JSON.stringify({
        success: false,
        error: `Falha na autenticação (${authResponse.status})`,
        details: authError,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = parseJson(authText);
    const accessToken = typeof tokenData?.accessToken === "string"
      ? tokenData.accessToken
      : typeof tokenData?.access_token === "string"
        ? tokenData.access_token
        : null;

    const expiresIn = typeof tokenData?.expiresIn === "number"
      ? tokenData.expiresIn
      : typeof tokenData?.expires_in === "number"
        ? tokenData.expires_in
        : null;

    const tokenType = typeof tokenData?.tokenType === "string" && tokenData.tokenType.trim().length > 0
      ? tokenData.tokenType.trim()
      : typeof tokenData?.token_type === "string" && tokenData.token_type.trim().length > 0
        ? tokenData.token_type.trim()
        : "Bearer";

    if (!accessToken) {
      await persistSettings("error", "Resposta sem accessToken");

      return new Response(JSON.stringify({
        success: false,
        error: "A Junto retornou sucesso, mas sem accessToken.",
        details: truncate(authText),
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bearerAuthorization = `${tokenType} ${accessToken}`;
    console.log(`[junto-garantia-auth] AccessToken recebido. Validando Bearer em: ${validationUrl}`);

    const validationResponse = await fetch(validationUrl, {
      method: "GET",
      headers: {
        Authorization: bearerAuthorization,
        Accept: "application/json",
      },
    });

    const validationText = await validationResponse.text();
    console.log(`[junto-garantia-auth] Status bearer: ${validationResponse.status}`);

    const bearerRejected = validationResponse.status === 401;

    if (bearerRejected) {
      const bearerError = extractErrorMessage(validationText);
      console.error(`[junto-garantia-auth] Erro bearer: ${bearerError}`);

      await logIntegration({
        action: "auth_bearer_validation",
        endpoint: validationUrl,
        method: "GET",
        status_code: validationResponse.status,
        error_message: truncate(validationText, 500),
      });

      await persistSettings("error", `Bearer inválido (${validationResponse.status})`);

      return new Response(JSON.stringify({
        success: false,
        error: `AccessToken gerado, mas o Bearer falhou (${validationResponse.status})`,
        details: bearerError,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminClient.from("guarantee_auth_sessions").insert({
      user_id: user.id,
      status: "active",
      token_type: tokenType,
      expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
    });

    await logIntegration({
      action: "auth_token",
      endpoint: authUrl,
      method: "POST",
      status_code: 200,
      response_summary: {
        token_type: tokenType,
        expires_in: expiresIn,
        bearer_validation_status: validationResponse.status,
      },
    });

    if (!validationResponse.ok) {
      await logIntegration({
        action: "auth_bearer_validation",
        endpoint: validationUrl,
        method: "GET",
        status_code: validationResponse.status,
        error_message: truncate(validationText, 500),
      });
    }

    await persistSettings("connected", null);

    const successMessage = validationResponse.ok
      ? "AccessToken gerado e Bearer validado com sucesso!"
      : `AccessToken gerado e enviado no Bearer. Endpoint de validação respondeu ${validationResponse.status}.`;

    return new Response(JSON.stringify({
      success: true,
      message: successMessage,
      token_type: tokenType,
      expires_in: expiresIn,
      environment,
      bearer_validated: validationResponse.ok,
      validation_status: validationResponse.status,
      validation_details: validationResponse.ok ? null : extractErrorMessage(validationText),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[junto-garantia-auth] Erro interno:", error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno desconhecido",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});