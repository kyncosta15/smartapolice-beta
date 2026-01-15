import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
