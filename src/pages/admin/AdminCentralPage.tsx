import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Radio,
  Globe,
  Building2,
  Users,
  FileText,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { AdminPresenceDashboard } from '@/components/admin/AdminPresenceDashboard';
import { AdminAccessLogs } from '@/components/admin/AdminAccessLogs';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function VisaoGeralTab() {
  const { metrics, companies, loading } = useAdminMetrics();

  const totalEmpresas = companies.length;
  const totalUsuarios = useMemo(
    () => companies.reduce((acc, c) => acc + (c.usuarios || 0), 0),
    [companies],
  );
  const empresasAtivas7d = useMemo(() => {
    const now = Date.now();
    return companies.filter((c) => {
      if (!c.ultima_atividade) return false;
      const diff = now - new Date(c.ultima_atividade).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;
  }, [companies]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Empresas"
          value={totalEmpresas}
          icon={Building2}
          hint={`${empresasAtivas7d} ativas nos últimos 7 dias`}
        />
        <StatCard title="Usuários totais" value={totalUsuarios} icon={Users} />
        <StatCard
          title="Apólices"
          value={metrics?.apolices_total ?? 0}
          icon={FileText}
        />
        <StatCard
          title="Sinistros"
          value={metrics?.sinistros_total ?? 0}
          icon={Activity}
          hint={`Média 30d: ${metrics?.medias_30?.sinistros ?? 0}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Top empresas por veículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Veículos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(metrics?.veiculos_por_empresa || []).slice(0, 10).map((v) => (
                <TableRow key={v.empresa_id}>
                  <TableCell className="font-medium">{v.empresa_nome}</TableCell>
                  <TableCell className="text-right">{v.total_veiculos}</TableCell>
                </TableRow>
              ))}
              {(!metrics?.veiculos_por_empresa || metrics.veiculos_por_empresa.length === 0) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UsoPorClienteTab() {
  const { companies, loading } = useAdminMetrics();

  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      const ta = a.ultima_atividade ? new Date(a.ultima_atividade).getTime() : 0;
      const tb = b.ultima_atividade ? new Date(b.ultima_atividade).getTime() : 0;
      return tb - ta;
    });
  }, [companies]);

  const statusBadge = (iso: string | null) => {
    if (!iso) return <Badge variant="outline">Sem atividade</Badge>;
    const diff = Date.now() - new Date(iso).getTime();
    const days = diff / (24 * 60 * 60 * 1000);
    if (days <= 1) return <Badge className="bg-success text-success-foreground">Ativa hoje</Badge>;
    if (days <= 7) return <Badge variant="secondary">Ativa 7d</Badge>;
    if (days <= 30) return <Badge variant="outline">Ativa 30d</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Inativa</Badge>;
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ranking de uso por cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead className="text-right">Veículos</TableHead>
              <TableHead className="text-right">Apólices</TableHead>
              <TableHead>Última atividade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={c.empresa_id}>
                <TableCell className="font-medium">{c.empresa_nome}</TableCell>
                <TableCell className="text-right">{c.usuarios}</TableCell>
                <TableCell className="text-right">{c.veiculos}</TableCell>
                <TableCell className="text-right">{c.apolices}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.ultima_atividade
                    ? formatDistanceToNow(new Date(c.ultima_atividade), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : '—'}
                </TableCell>
                <TableCell>{statusBadge(c.ultima_atividade)}</TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhuma empresa cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminCentralPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Administração</h1>
          <p className="text-muted-foreground">
            Visão consolidada de uso, sessões ativas e métricas dos clientes.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão geral</span>
            </TabsTrigger>
            <TabsTrigger value="presence" className="gap-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Sessões ativas</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Logs de acesso</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Uso por cliente</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <VisaoGeralTab />
          </TabsContent>
          <TabsContent value="presence">
            <AdminPresenceDashboard />
          </TabsContent>
          <TabsContent value="logs">
            <AdminAccessLogs />
          </TabsContent>
          <TabsContent value="usage">
            <UsoPorClienteTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
