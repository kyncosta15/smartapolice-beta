const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const JUNTO_TOKEN_URL = "https://ms-gateway.juntoseguros.com/auth/api/Token";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
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
        error: "Credenciais da Junto não configuradas" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Request body from Junto
    const body = JSON.parse(req.body ? await new Response(req.body).text() : "{}");
    const environment = body.environment || "production";
    
    const tokenUrl = environment === "sandbox" 
      ? "https://ms-gateway-box.juntoseguros.com/auth/api/Token"
      : JUNTO_TOKEN_URL;

    console.log(`[junto-garantia-auth] Tentando autenticação em: ${tokenUrl}`);

    // OAuth2 Client Credentials
    const authResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const responseText = await authResponse.text();
    console.log(`[junto-garantia-auth] Status: ${authResponse.status}`);

    if (!authResponse.ok) {
      console.error(`[junto-garantia-auth] Erro: ${responseText}`);
      
      // Log the attempt
      await supabase.from("guarantee_integration_logs").insert({
        user_id: user.id,
        action: "auth_token",
        endpoint: tokenUrl,
        method: "POST",
        status_code: authResponse.status,
        error_message: responseText.substring(0, 500),
        duration_ms: 0,
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: `Falha na autenticação (${authResponse.status})`,
        details: responseText.substring(0, 200),
      }), {
        status: 200, // Return 200 so frontend can handle gracefully
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Resposta inválida da API Junto" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[junto-garantia-auth] Autenticação bem-sucedida! Token type: ${tokenData.token_type || 'bearer'}`);

    // Save session info
    await supabase.from("guarantee_auth_sessions").insert({
      user_id: user.id,
      status: "active",
      token_type: tokenData.token_type || "bearer",
      expires_at: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
    });

    // Log success
    await supabase.from("guarantee_integration_logs").insert({
      user_id: user.id,
      action: "auth_token",
      endpoint: tokenUrl,
      method: "POST",
      status_code: 200,
      response_summary: { token_type: tokenData.token_type, expires_in: tokenData.expires_in },
      duration_ms: 0,
    });

    // Update settings
    await supabase.from("guarantee_settings").upsert({
      user_id: user.id,
      environment,
      status: "connected",
      last_connection_test: new Date().toISOString(),
      last_error: null,
      client_id: clientId.substring(0, 8) + "...",
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Autenticação realizada com sucesso!",
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      environment,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-garantia-auth] Erro interno:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
