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
    
    const { session_id, current_path } = await req.json();
    
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const now = new Date().toISOString();
    
    // Atualizar heartbeat da sessão
    const { data: session, error: updateError } = await supabase
      .from('presence_sessions')
      .update({ 
        last_heartbeat_at: now,
        current_path: current_path || undefined
      })
      .eq('id', session_id)
      .eq('ended_at', null) // Só atualizar sessões ativas
      .select()
      .single();
    
    if (updateError) {
      console.error('Heartbeat update error:', updateError);
      
      // Se a sessão não existe ou foi encerrada, retornar erro específico
      return new Response(
        JSON.stringify({ 
          error: 'Session not found or expired',
          should_restart: true 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Também atualizar last_seen_at no tenant_ip_registry
    if (session) {
      await supabase
        .from('tenant_ip_registry')
        .update({ last_seen_at: now })
        .eq('tenant_id', session.tenant_id)
        .eq('ip_hash', session.ip_hash);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        last_heartbeat_at: now 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
