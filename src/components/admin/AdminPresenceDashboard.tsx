import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Activity, 
  Globe, 
  RefreshCw,
  Wifi,
  Clock,
  Monitor,
  Smartphone,
  Laptop,
  MapPin,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineSession {
  id: string;
  tenant_id: string;
  user_id: string;
  ip_hash: string;
  device_id: string | null;
  display_name: string | null;
  started_at: string;
  last_heartbeat_at: string;
  user_agent: string | null;
  current_path: string | null;
  user_email: string | null;
  user_display_name: string | null;
}

interface PresenceStats {
  online_users: number;
  online_sessions: number;
  total_ips: number;
  new_ips_24h: number;
  recurring_ips: number;
  ips_per_tenant: Record<string, number>;
  top_tenants_by_ips: { tenant_id: string; ip_count: number; email: string }[];
}

interface PresenceData {
  sessions_online: OnlineSession[];
  stats: PresenceStats;
  threshold_seconds: number;
  server_time: string;
}

const POLLING_INTERVAL_MS = 5000; // 5 segundos

export function AdminPresenceDashboard() {
  const [data, setData] = useState<PresenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [useRealtime, setUseRealtime] = useState(true);
  const { toast } = useToast();

  const fetchPresenceData = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data: responseData, error } = await supabase.functions.invoke('admin-presence', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      });

      if (error) throw error;
      
      setData(responseData);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching presence data:', error);
      if (!data) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, toast]);

  // Polling fallback
  useEffect(() => {
    fetchPresenceData();
    
    const interval = setInterval(() => {
      if (!useRealtime) {
        fetchPresenceData();
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchPresenceData, useRealtime]);

  // Realtime subscription
  useEffect(() => {
    if (!useRealtime) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      channel = supabase
        .channel('presence-sessions-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'presence_sessions' },
          () => {
            // Atualizar dados quando houver mudanças
            fetchPresenceData();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Realtime connected for presence');
          } else if (status === 'CHANNEL_ERROR') {
            console.log('Realtime error, falling back to polling');
            setUseRealtime(false);
          }
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [useRealtime, fetchPresenceData]);

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return Laptop;
    }
    return Monitor;
  };

  const formatLastSeen = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  };

  const getBrowserInfo = (userAgent: string | null): string => {
    if (!userAgent) return 'Desconhecido';
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Outro';
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Monitoramento de Presença
          </h2>
          <p className="text-muted-foreground mt-1">
            Usuários online em tempo real • Atualizado {lastUpdate ? formatLastSeen(lastUpdate.toISOString()) : 'nunca'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={useRealtime ? "default" : "secondary"} className="gap-1">
            {useRealtime ? (
              <>
                <Wifi className="h-3 w-3" />
                Realtime
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Polling 5s
              </>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPresenceData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Online</p>
                <p className="text-2xl font-bold text-green-600">{data?.stats.online_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{data?.stats.online_sessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total IPs</p>
                <p className="text-2xl font-bold text-purple-600">{data?.stats.total_ips || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-3">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos IPs (24h)</p>
                <p className="text-2xl font-bold text-amber-600">{data?.stats.new_ips_24h || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3">
                <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPs Recorrentes</p>
                <p className="text-2xl font-bold">{data?.stats.recurring_ips || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            Online Agora
            <Badge variant="default" className="bg-green-500 ml-2">
              {data?.sessions_online.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.sessions_online.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário online no momento
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Página Atual</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead>IP Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sessions_online.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.user_agent);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-medium">
                            {session.user_email || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {session.display_name || session.user_display_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getBrowserInfo(session.user_agent)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {session.current_path || '/'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatLastSeen(session.last_heartbeat_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {session.ip_hash.substring(0, 12)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Tenants by IPs */}
      {data?.stats.top_tenants_by_ips && data.stats.top_tenants_by_ips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Usuários por Quantidade de IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>IPs Únicos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stats.top_tenants_by_ips.map((tenant, index) => (
                  <TableRow key={tenant.tenant_id}>
                    <TableCell>
                      <Badge variant="outline">{index + 1}</Badge>
                    </TableCell>
                    <TableCell>
                      {tenant.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tenant.ip_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
