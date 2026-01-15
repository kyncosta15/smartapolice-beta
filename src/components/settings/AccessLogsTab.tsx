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

// Função para verificar se está online (acessou nos últimos 5 minutos)
const isRecentAccess = (createdAt: string): boolean => {
  const accessTime = new Date(createdAt).getTime();
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  return (now - accessTime) < FIVE_MINUTES;
};

export function AccessLogsTab() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLogs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!showHidden) {
        query = query.eq('hidden', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
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
    fetchLogs();
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
            onClick={fetchLogs}
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
            {logs.map((log) => {
              const DeviceIcon = getDeviceIcon(log.user_agent);
              const { date, time } = formatDateTime(log.created_at);
              const online = isRecentAccess(log.created_at);
              
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
