import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Tentar obter IP de vários headers (em ordem de prioridade)
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const xRealIp = req.headers.get('x-real-ip');
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xClientIp = req.headers.get('x-client-ip');
    
    let clientIp = 'unknown';
    
    if (cfConnectingIp) {
      clientIp = cfConnectingIp;
    } else if (xRealIp) {
      clientIp = xRealIp;
    } else if (xForwardedFor) {
      // x-forwarded-for pode ter múltiplos IPs, pegar o primeiro
      clientIp = xForwardedFor.split(',')[0].trim();
    } else if (xClientIp) {
      clientIp = xClientIp;
    }

    console.log('Client IP detected:', clientIp);

    return new Response(
      JSON.stringify({ ip: clientIp }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error getting client IP:', error);
    return new Response(
      JSON.stringify({ ip: 'unknown', error: error.message }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
