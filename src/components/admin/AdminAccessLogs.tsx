import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  RefreshCw,
  Globe,
  Clock,
  Calendar,
  Users,
  Activity,
  Search,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminAccessStats } from './AdminAccessStats';

interface AccessLog {
  id: string;
  user_id: string;
  ip_address: string;
  device_name: string | null;
  user_agent: string | null;
  created_at: string;
  hidden: boolean;
  user_profile?: {
    display_name: string | null;
  };
}

export function AdminAccessLogs() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Buscar logs de acesso
      const { data: logsData, error: logsError } = await supabase
        .from('user_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Buscar perfis dos usuários
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Mapear perfis por ID
      const profilesMap: Record<string, { display_name: string | null }> = {};
      profiles?.forEach(p => {
        profilesMap[p.id] = { display_name: p.display_name };
      });

      // Combinar logs com perfis
      const logsWithProfiles = logsData?.map(log => ({
        ...log,
        user_profile: profilesMap[log.user_id] || { display_name: null }
      })) || [];

      setLogs(logsWithProfiles);
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
  }, []);

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

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return 'Desconhecido';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "dd/MM/yyyy", { locale: ptBR }),
      time: format(date, 'HH:mm:ss'),
    };
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm) ||
      log.user_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPending = filterPending ? !log.device_name : true;
    
    return matchesSearch && matchesPending;
  });

  const pendingCount = logs.filter(log => !log.device_name).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Monitoramento de Acessos
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualize todos os acessos dos usuários ao sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Logs de Acesso
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por usuário, IP ou dispositivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterPending ? "default" : "outline"}
                    onClick={() => setFilterPending(!filterPending)}
                    className="gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Pendentes ({pendingCount})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchLogs}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Acessos Recentes
                </span>
                <Badge variant="secondary">{filteredLogs.length} registros</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando acessos...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum acesso encontrado
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map((log) => {
                    const DeviceIcon = getDeviceIcon(log.user_agent);
                    const deviceType = getDeviceType(log.user_agent);
                    const { date, time } = formatDateTime(log.created_at);
                    const isPending = !log.device_name;
                    
                    return (
                      <div
                        key={log.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          isPending 
                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900' 
                            : 'bg-card'
                        }`}
                      >
                        <div className={`rounded-full p-2.5 flex-shrink-0 ${
                          isPending ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary/10'
                        }`}>
                          <DeviceIcon className={`h-5 w-5 ${
                            isPending ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">
                              {log.user_profile?.display_name || 'Usuário desconhecido'}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {deviceType}
                            </Badge>
                            {isPending && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Pendente
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="font-medium">
                              {log.device_name || 'Aguardando identificação'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span className="font-mono">{log.ip_address}</span>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <AdminAccessStats logs={logs} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
