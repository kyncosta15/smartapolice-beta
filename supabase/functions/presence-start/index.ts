import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Função para calcular hash SHA-256 do IP com salt
async function hashIP(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para extrair IP do request
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
    const ipHashSalt = Deno.env.get('IP_HASH_SALT') || 'default-salt-change-me';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extrair dados do body
    const { user_id, device_id, user_agent, current_path } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter e hashear o IP
    const clientIP = getClientIP(req);
    const ipHash = await hashIP(clientIP, ipHashSalt);
    
    console.log('Presence start - User:', user_id, 'IP Hash:', ipHash.substring(0, 16) + '...');
    
    // Usar user_id como tenant_id (cada usuário é seu próprio tenant)
    const tenantId = user_id;
    
    // Verificar/atualizar registro de IP no tenant_ip_registry
    const { data: existingRegistry, error: registryError } = await supabase
      .from('tenant_ip_registry')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ip_hash', ipHash)
      .eq('device_id', device_id || '')
      .maybeSingle();
    
    if (registryError) {
      console.error('Error checking registry:', registryError);
    }
    
    let needsName = false;
    let currentName: string | null = null;
    
    if (existingRegistry) {
      // IP já conhecido - atualizar last_seen_at e incrementar times_seen
      currentName = existingRegistry.display_name;
      needsName = !existingRegistry.display_name;
      
      await supabase
        .from('tenant_ip_registry')
        .update({
          last_seen_at: new Date().toISOString(),
          times_seen: existingRegistry.times_seen + 1
        })
        .eq('id', existingRegistry.id);
        
    } else {
      // Novo IP - criar registro
      needsName = true;
      
      const { error: insertError } = await supabase
        .from('tenant_ip_registry')
        .insert({
          tenant_id: tenantId,
          ip_hash: ipHash,
          device_id: device_id || '',
          display_name: null,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          times_seen: 1
        });
        
      if (insertError) {
        console.error('Error inserting registry:', insertError);
      }
    }
    
    // Registrar acesso real (histórico) com IP capturado no backend
    // (usado por telas que leem user_access_logs)
    const { error: accessLogError } = await supabase
      .from('user_access_logs')
      .insert({
        user_id,
        ip_address: clientIP,
        device_name: currentName,
        user_agent: user_agent || null,
      });

    if (accessLogError) {
      console.error('Error inserting user_access_logs:', accessLogError);
    }

    // Criar nova sessão de presença
    const { data: session, error: sessionError } = await supabase
      .from('presence_sessions')
      .insert({
        tenant_id: tenantId,
        user_id: user_id,
        ip_hash: ipHash,
        device_id: device_id || null,
        display_name: currentName,
        started_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
        user_agent: user_agent || null,
        current_path: current_path || null
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }
    
    console.log('Session created:', session.id);
    
    return new Response(
      JSON.stringify({
        session_id: session.id,
        needs_name: needsName,
        current_name: currentName,
        ip_hash: ipHash // Para debug/referência
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Presence start error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
