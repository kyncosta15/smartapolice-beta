import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Sessão é online se heartbeat foi nos últimos 60 segundos
const ONLINE_THRESHOLD_SECONDS = 60;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar autenticação e permissão de admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - ONLINE_THRESHOLD_SECONDS * 1000);
    
    // Buscar todas as sessões ativas (heartbeat recente e não encerradas)
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('presence_sessions')
      .select('*')
      .is('ended_at', null)
      .gte('last_heartbeat_at', thresholdTime.toISOString())
      .order('last_heartbeat_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }
    
    // Buscar dados dos usuários para as sessões
    const userIds = [...new Set(activeSessions?.map(s => s.user_id).filter(Boolean))];
    
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', userIds);
    
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);
    
    const profilesMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || []);
    const usersMap = Object.fromEntries(users?.map(u => [u.id, u]) || []);
    
    // Enriquecer sessões com dados do usuário
    const enrichedSessions = activeSessions?.map(session => ({
      ...session,
      user_email: usersMap[session.user_id]?.email || null,
      user_display_name: profilesMap[session.user_id]?.display_name || session.display_name
    })) || [];
    
    // Estatísticas de IPs por tenant
    const { data: ipStats, error: ipError } = await supabase
      .from('tenant_ip_registry')
      .select('tenant_id, ip_hash, times_seen');
    
    // Calcular estatísticas
    const uniqueUsersOnline = new Set(activeSessions?.map(s => s.user_id)).size;
    const totalSessions = activeSessions?.length || 0;
    
    // IPs por tenant
    const ipsPerTenant: Record<string, number> = {};
    ipStats?.forEach(ip => {
      const tenantId = ip.tenant_id;
      ipsPerTenant[tenantId] = (ipsPerTenant[tenantId] || 0) + 1;
    });
    
    // Top tenants por número de IPs
    const topTenantsByIPs = Object.entries(ipsPerTenant)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tenantId, count]) => ({
        tenant_id: tenantId,
        ip_count: count,
        email: usersMap[tenantId]?.email || 'N/A'
      }));
    
    // Buscar IPs novos (first_seen_at nas últimas 24h)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: newIPs, error: newIPsError } = await supabase
      .from('tenant_ip_registry')
      .select('id')
      .gte('first_seen_at', last24h.toISOString());
    
    const { data: recurringIPs, error: recurringError } = await supabase
      .from('tenant_ip_registry')
      .select('id')
      .lt('first_seen_at', last24h.toISOString());
    
    return new Response(
      JSON.stringify({
        sessions_online: enrichedSessions,
        stats: {
          online_users: uniqueUsersOnline,
          online_sessions: totalSessions,
          total_ips: ipStats?.length || 0,
          new_ips_24h: newIPs?.length || 0,
          recurring_ips: recurringIPs?.length || 0,
          ips_per_tenant: ipsPerTenant,
          top_tenants_by_ips: topTenantsByIPs
        },
        threshold_seconds: ONLINE_THRESHOLD_SECONDS,
        server_time: now.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Admin presence error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
