import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Users, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Globe,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

interface AdminAccessStatsProps {
  logs: AccessLog[];
  isLoading: boolean;
}

const COLORS = ['#0078D4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function AdminAccessStats({ logs, isLoading }: AdminAccessStatsProps) {
  const stats = useMemo(() => {
    if (logs.length === 0) return null;

    // Usuários únicos
    const uniqueUsers = new Set(logs.map(log => log.user_id));
    
    // IPs únicos
    const uniqueIPs = new Set(logs.map(log => log.ip_address));
    
    // Dispositivos por tipo
    const deviceTypes: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    logs.forEach(log => {
      const ua = log.user_agent?.toLowerCase() || '';
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceTypes.Mobile++;
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceTypes.Tablet++;
      } else {
        deviceTypes.Desktop++;
      }
    });

    // Dispositivos por usuário
    const devicesPerUser: Record<string, Set<string>> = {};
    logs.forEach(log => {
      if (!devicesPerUser[log.user_id]) {
        devicesPerUser[log.user_id] = new Set();
      }
      devicesPerUser[log.user_id].add(log.ip_address);
    });

    // Acessos por usuário
    const accessesPerUser: Record<string, { name: string; count: number }> = {};
    logs.forEach(log => {
      const userId = log.user_id;
      if (!accessesPerUser[userId]) {
        accessesPerUser[userId] = {
          name: log.user_profile?.display_name || 'Desconhecido',
          count: 0
        };
      }
      accessesPerUser[userId].count++;
    });

    // Top 10 usuários por acessos
    const topUsers = Object.values(accessesPerUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Média de dispositivos por usuário
    const avgDevicesPerUser = Object.values(devicesPerUser).reduce((acc, ips) => acc + ips.size, 0) / uniqueUsers.size;

    // Acessos pendentes (sem nome de dispositivo)
    const pendingAccesses = logs.filter(log => !log.device_name).length;

    // Dados para o gráfico de tipos de dispositivo
    const deviceChartData = Object.entries(deviceTypes).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / logs.length) * 100).toFixed(1)
    }));

    return {
      totalUsers: uniqueUsers.size,
      totalIPs: uniqueIPs.size,
      totalAccesses: logs.length,
      avgDevicesPerUser: avgDevicesPerUser.toFixed(1),
      pendingAccesses,
      deviceTypes: deviceChartData,
      topUsers,
      devicesPerUser: Object.entries(devicesPerUser).map(([userId, ips]) => ({
        userId,
        name: accessesPerUser[userId]?.name || 'Desconhecido',
        devices: ips.size
      })).sort((a, b) => b.devices - a.devices).slice(0, 10)
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum dado de acesso disponível para estatísticas
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPs Únicos</p>
                <p className="text-2xl font-bold">{stats.totalIPs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Acessos</p>
                <p className="text-2xl font-bold">{stats.totalAccesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Dispositivos/Usuário</p>
                <p className="text-2xl font-bold">{stats.avgDevicesPerUser}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Dispositivo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Tipos de Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.deviceTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }: { name: string; value: number }) => `${name}: ${((value / stats.totalAccesses) * 100).toFixed(1)}%`}
                >
                  {stats.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Usuários por Acessos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top 10 Usuários por Acessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#0078D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dispositivos por Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Dispositivos por Usuário (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.devicesPerUser} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="devices" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumo de Pendências */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Acessos Pendentes de Identificação</span>
                <span className="font-bold text-yellow-600">{stats.pendingAccesses}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Acessos Identificados</span>
                <span className="font-bold text-green-600">{stats.totalAccesses - stats.pendingAccesses}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Taxa de Identificação</span>
                <span className="font-bold">
                  {((stats.totalAccesses - stats.pendingAccesses) / stats.totalAccesses * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Desktop</span>
                <span className="font-bold">{stats.deviceTypes.find(d => d.name === 'Desktop')?.value || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Mobile</span>
                <span className="font-bold">{stats.deviceTypes.find(d => d.name === 'Mobile')?.value || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Tablet</span>
                <span className="font-bold">{stats.deviceTypes.find(d => d.name === 'Tablet')?.value || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
