import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Globe,
  Clock,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccessLog {
  id: string;
  ip_address: string;
  device_name: string | null;
  user_agent: string | null;
  created_at: string;
  hidden: boolean;
}

interface PresenceSession {
  ip_hash: string;
  last_heartbeat_at: string;
  display_name: string | null;
}

// Agrupar logs por IP e retornar apenas o mais recente de cada
const groupLogsByIP = (logs: AccessLog[]): AccessLog[] => {
  const ipMap = new Map<string, AccessLog>();
  
  logs.forEach(log => {
    const existing = ipMap.get(log.ip_address);
    if (!existing || new Date(log.created_at) > new Date(existing.created_at)) {
      ipMap.set(log.ip_address, log);
    }
  });
  
  return Array.from(ipMap.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Verificar se há sessão ativa para um IP (heartbeat nos últimos 60s)
const isOnlineByPresence = (ipAddress: string, activeSessions: PresenceSession[]): boolean => {
  const now = Date.now();
  const SIXTY_SECONDS = 60 * 1000;
  
  return activeSessions.some(session => {
    // Comparar últimos caracteres do hash com o IP (simplificado)
    // Na prática, o backend usa hash do IP, então precisamos verificar por last_heartbeat_at
    const heartbeatTime = new Date(session.last_heartbeat_at).getTime();
    return (now - heartbeatTime) < SIXTY_SECONDS;
  });
};

export function AccessLogsTab() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<PresenceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Buscar logs de acesso
      let logsQuery = supabase
        .from('user_access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!showHidden) {
        logsQuery = logsQuery.eq('hidden', false);
      }

      // Buscar sessões de presença ativas (heartbeat nos últimos 60s)
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const sessionsQuery = supabase
        .from('presence_sessions')
        .select('ip_hash, last_heartbeat_at, display_name')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .gte('last_heartbeat_at', sixtySecondsAgo);

      const [logsResult, sessionsResult] = await Promise.all([logsQuery, sessionsQuery]);

      if (logsResult.error) throw logsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      setLogs(logsResult.data || []);
      setActiveSessions(sessionsResult.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro ao carregar acessos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Atualizar a cada 30s para refletir status online
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, showHidden]);

  const toggleHidden = async (logId: string, currentHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('user_access_logs')
        .update({ hidden: !currentHidden })
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.map(log => 
        log.id === logId ? { ...log, hidden: !currentHidden } : log
      ));

      toast({
        title: currentHidden ? "Acesso visível" : "Acesso oculto",
        description: currentHidden 
          ? "Este acesso agora está visível na lista" 
          : "Este acesso foi ocultado da lista principal",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar log:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      time: format(date, 'HH:mm:ss'),
    };
  };

  return (
    <Card className="dark:bg-card dark:border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base flex items-center gap-2 dark:text-foreground">
          <Globe className="w-4 h-4" />
          Histórico de Acessos
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Ver ocultos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando acessos...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum acesso registrado
          </div>
        ) : (
          <div className="space-y-3">
            {groupLogsByIP(logs).map((log) => {
              const DeviceIcon = getDeviceIcon(log.user_agent);
              const { date, time } = formatDateTime(log.created_at);
              // Online = tem sessão ativa com heartbeat nos últimos 60s
              const online = activeSessions.length > 0;
              
              return (
                <div
                  key={log.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    log.hidden 
                      ? 'bg-muted/30 border-dashed opacity-60' 
                      : 'bg-card'
                  }`}
                >
                  <div className="bg-primary/10 rounded-full p-2.5 flex-shrink-0 relative">
                    <DeviceIcon className="h-5 w-5 text-primary" />
                    {online && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {log.device_name || 'Dispositivo desconhecido'}
                      </p>
                      {online && (
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                          Online
                        </Badge>
                      )}
                      {log.hidden && (
                        <Badge variant="secondary" className="text-xs">
                          Oculto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{log.ip_address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleHidden(log.id, log.hidden)}
                    title={log.hidden ? 'Mostrar acesso' : 'Ocultar acesso'}
                  >
                    {log.hidden ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
