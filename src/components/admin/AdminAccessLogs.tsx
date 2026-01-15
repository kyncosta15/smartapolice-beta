import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronDown,
  ChevronRight,
  Mail,
  Wifi,
  WifiOff,
  BarChart3,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
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
}

interface UserProfile {
  id: string;
  display_name: string | null;
}

interface UserWithEmail {
  id: string;
  email: string;
}

interface UserAccessData {
  userId: string;
  email: string;
  displayName: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  totalAccesses: number;
  uniqueIPs: string[];
  devices: { ip: string; name: string | null; type: string; lastAccess: string; userAgent: string | null }[];
  logs: AccessLog[];
}

export function AdminAccessLogs() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [usersWithEmail, setUsersWithEmail] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const { toast } = useToast();

  // Considerar online se acessou nos últimos 15 minutos
  const ONLINE_THRESHOLD_MS = 15 * 60 * 1000;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar logs de acesso
      const { data: logsData, error: logsError } = await supabase
        .from('user_access_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Buscar perfis dos usuários
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Buscar emails dos usuários da tabela users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      // Mapear perfis e emails
      const profilesMap: Record<string, UserProfile> = {};
      profilesData?.forEach(p => {
        profilesMap[p.id] = p;
      });

      const emailsMap: Record<string, string> = {};
      usersData?.forEach(u => {
        emailsMap[u.id] = u.email || '';
      });

      setLogs(logsData || []);
      setProfiles(profilesMap);
      setUsersWithEmail(emailsMap);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Agrupar dados por usuário
  const usersData = useMemo((): UserAccessData[] => {
    const userMap: Record<string, UserAccessData> = {};

    logs.forEach(log => {
      if (!userMap[log.user_id]) {
        const lastAccess = logs
          .filter(l => l.user_id === log.user_id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const lastSeenDate = lastAccess ? new Date(lastAccess.created_at) : null;
        const isOnline = lastSeenDate 
          ? (Date.now() - lastSeenDate.getTime()) < ONLINE_THRESHOLD_MS 
          : false;

        userMap[log.user_id] = {
          userId: log.user_id,
          email: usersWithEmail[log.user_id] || 'Email não disponível',
          displayName: profiles[log.user_id]?.display_name || null,
          isOnline,
          lastSeen: lastAccess?.created_at || null,
          totalAccesses: 0,
          uniqueIPs: [],
          devices: [],
          logs: []
        };
      }

      userMap[log.user_id].totalAccesses++;
      userMap[log.user_id].logs.push(log);

      if (!userMap[log.user_id].uniqueIPs.includes(log.ip_address)) {
        userMap[log.user_id].uniqueIPs.push(log.ip_address);
        
        const deviceType = getDeviceType(log.user_agent);
        userMap[log.user_id].devices.push({
          ip: log.ip_address,
          name: log.device_name,
          type: deviceType,
          lastAccess: log.created_at,
          userAgent: log.user_agent
        });
      }
    });

    return Object.values(userMap).sort((a, b) => {
      // Online primeiro
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      // Depois por último acesso
      const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      return bTime - aTime;
    });
  }, [logs, profiles, usersWithEmail]);

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return 'Desconhecido';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Mobile': return Smartphone;
      case 'Tablet': return Laptop;
      default: return Monitor;
    }
  };

  const toggleExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uniqueIPs.some(ip => ip.includes(searchTerm));
    
    const matchesFilter = 
      filterOnline === 'all' ||
      (filterOnline === 'online' && user.isOnline) ||
      (filterOnline === 'offline' && !user.isOnline);
    
    return matchesSearch && matchesFilter;
  });

  const onlineCount = usersData.filter(u => u.isOnline).length;
  const offlineCount = usersData.filter(u => !u.isOnline).length;

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Monitoramento de Acessos
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualize contas, status online e dispositivos conectados
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Contas ({usersData.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                    <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Online Agora</p>
                    <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3">
                    <WifiOff className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Offline</p>
                    <p className="text-2xl font-bold">{offlineCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Acessos</p>
                    <p className="text-2xl font-bold">{logs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email, nome ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterOnline === 'all' ? "default" : "outline"}
                    onClick={() => setFilterOnline('all')}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterOnline === 'online' ? "default" : "outline"}
                    onClick={() => setFilterOnline('online')}
                    size="sm"
                    className="gap-1"
                  >
                    <Wifi className="h-3 w-3" />
                    Online
                  </Button>
                  <Button
                    variant={filterOnline === 'offline' ? "default" : "outline"}
                    onClick={() => setFilterOnline('offline')}
                    size="sm"
                    className="gap-1"
                  >
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchData}
                    disabled={isLoading}
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contas de Usuário
                </span>
                <Badge variant="secondary">{filteredUsers.length} contas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando dados...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conta encontrada
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <Collapsible
                      key={user.userId}
                      open={expandedUsers.has(user.userId)}
                      onOpenChange={() => toggleExpanded(user.userId)}
                    >
                      <div className={`border rounded-lg ${user.isOnline ? 'border-green-200 dark:border-green-900' : ''}`}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            {/* Status indicator */}
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              user.isOnline 
                                ? 'bg-green-500 animate-pulse' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">
                                  {user.email}
                                </p>
                                {user.isOnline && (
                                  <Badge variant="default" className="bg-green-500 text-xs">
                                    Online
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {user.displayName && (
                                  <span>{user.displayName}</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatLastSeen(user.lastSeen)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-bold">{user.uniqueIPs.length}</p>
                                <p className="text-xs text-muted-foreground">IPs</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold">{user.totalAccesses}</p>
                                <p className="text-xs text-muted-foreground">Acessos</p>
                              </div>
                              <Button variant="ghost" size="icon">
                                {expandedUsers.has(user.userId) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t p-4 bg-muted/30">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Dispositivos e IPs ({user.devices.length})
                            </h4>
                            <div className="space-y-2">
                              {user.devices.map((device, idx) => {
                                const DeviceIcon = getDeviceIcon(device.type);
                                return (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-3 p-3 bg-card rounded-lg border"
                                  >
                                    <div className="bg-primary/10 rounded-full p-2">
                                      <DeviceIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {device.name || 'Dispositivo não identificado'}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {device.type}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="font-mono">{device.ip}</span>
                                        <span>
                                          Último acesso: {format(new Date(device.lastAccess), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <AdminAccessStats 
            logs={logs.map(log => ({
              ...log,
              user_profile: profiles[log.user_id] ? { display_name: profiles[log.user_id].display_name } : undefined
            }))} 
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
