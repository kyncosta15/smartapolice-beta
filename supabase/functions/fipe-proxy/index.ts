import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIPE_BASE_URL = "http://veiculos.fipe.org.br/api/veiculos";

serve(async (req) => {
  console.log(`[FIPE Proxy] Request received: ${req.method}`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log(`[FIPE Proxy] Request body:`, JSON.stringify(requestBody));
    
    const { path, body } = requestBody;

    if (!path) {
      throw new Error("Path parameter is required");
    }

    console.log(`[FIPE Proxy] Calling FIPE: ${path}`);

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

    console.log(`[FIPE Proxy] FIPE response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FIPE Proxy] Error ${response.status}: ${errorText}`);
      throw new Error(`FIPE API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[FIPE Proxy] Success for ${path}`, JSON.stringify(data).substring(0, 200));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[FIPE Proxy] Error:", error.message);
    console.error("[FIPE Proxy] Stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erro ao consultar API FIPE",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
