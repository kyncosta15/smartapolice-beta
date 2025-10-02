import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const FIPE_BASE_URL = "http://veiculos.fipe.org.br/api/veiculos";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { path, body } = await req.json();

    if (!path) {
      throw new Error("Path parameter is required");
    }

    console.log(`[FIPE Proxy] Calling: ${path}`);

    // Make request to FIPE API
    const response = await fetch(`${FIPE_BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        "Host": "veiculos.fipe.org.br",
        "Referer": "http://veiculos.fipe.org.br",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body || {}),
    });

    if (!response.ok) {
      console.error(`[FIPE Proxy] Error ${response.status}: ${await response.text()}`);
      throw new Error(`FIPE API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[FIPE Proxy] Success for ${path}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[FIPE Proxy] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erro ao consultar API FIPE" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
