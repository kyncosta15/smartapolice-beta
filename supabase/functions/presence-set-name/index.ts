import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Função para extrair IP do request (mesma lógica do presence-start)
function getClientIP(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const xRealIp = req.headers.get('x-real-ip');
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xClientIp = req.headers.get('x-client-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (xRealIp) return xRealIp;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xClientIp) return xClientIp;

  return 'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { session_id, display_name } = await req.json();
    
    if (!session_id || !display_name) {
      return new Response(
        JSON.stringify({ error: 'session_id and display_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar a sessão para obter tenant_id e ip_hash
    const { data: session, error: sessionError } = await supabase
      .from('presence_sessions')
      .select('*')
      .eq('id', session_id)
      .single();
    
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Atualizar display_name na sessão
    const { error: updateSessionError } = await supabase
      .from('presence_sessions')
      .update({ display_name })
      .eq('id', session_id);
    
    if (updateSessionError) {
      console.error('Error updating session:', updateSessionError);
    }
    
    // Atualizar display_name no registro de IP
    const { error: updateRegistryError } = await supabase
      .from('tenant_ip_registry')
      .update({ display_name })
      .eq('tenant_id', session.tenant_id)
      .eq('ip_hash', session.ip_hash)
      .eq('device_id', session.device_id || '');

    if (updateRegistryError) {
      console.error('Error updating registry:', updateRegistryError);
    }

    // Atualizar também o log de acesso mais recente desse IP (para aparecer com nome no Histórico de Acessos)
    const clientIP = getClientIP(req);

    const { data: latestLog, error: latestLogError } = await supabase
      .from('user_access_logs')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('ip_address', clientIP)
      .is('device_name', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestLogError) {
      console.error('Error fetching latest user_access_logs:', latestLogError);
    } else if (latestLog?.id) {
      const { error: updateLogError } = await supabase
        .from('user_access_logs')
        .update({ device_name: display_name })
        .eq('id', latestLog.id);

      if (updateLogError) {
        console.error('Error updating user_access_logs device_name:', updateLogError);
      }
    }

    console.log('Name set for session:', session_id, 'Name:', display_name);

    return new Response(
      JSON.stringify({ success: true, display_name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Set name error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
