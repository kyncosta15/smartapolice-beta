import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CompanySidePanel } from '@/components/admin/CompanySidePanel';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, AlertCircle, TrendingUp, Building2, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CompanySummary } from '@/types/admin';

type Period = '30' | '60';

export default function AdminDashboardPage() {
  const { metrics, companies, loading } = useAdminMetrics();
  const [period, setPeriod] = useState<Period>('30');
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [filterCompanyId, setFilterCompanyId] = useState<string>('all');

  // Filtrar empresas para o select - antes dos early returns
  const filteredCompanies = useMemo(() => {
    if (filterCompanyId === 'all') return companies;
    return companies.filter(c => c.empresa_id === filterCompanyId);
  }, [companies, filterCompanyId]);

  // Filtrar veículos por empresa - antes dos early returns
  const filteredVehicles = useMemo(() => {
    if (!metrics) return [];
    if (filterCompanyId === 'all') return metrics.veiculos_por_empresa;
    return metrics.veiculos_por_empresa.filter(v => v.empresa_id === filterCompanyId);
  }, [metrics, filterCompanyId]);

  if (loading) {
    return (
      <AdminLayout activeSection="overview">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) return null;

  const averages = period === '30' ? metrics.medias_30 : metrics.medias_60;

  return (
    <AdminLayout activeSection="overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-bold">Visão Geral do Sistema</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro por Empresa */}
            <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.empresa_id} value={company.empresa_id}>
                    {company.empresa_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="30">30 dias</TabsTrigger>
                <TabsTrigger value="60">60 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apólices Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.apolices_total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sinistros Total</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sinistros_total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assistências Total</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assistencias_total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.veiculos_por_empresa.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Médias Diárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Média Diária - Sinistros ({period}d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averages.sinistros.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sinistros por dia nos últimos {period} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Média Diária - Assistências ({period}d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averages.assistencias.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assistências por dia nos últimos {period} dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Apólices por Seguradora */}
        <Card>
          <CardHeader>
            <CardTitle>Apólices por Seguradora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.apolices_por_seguradora} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="seguradora" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} apólices`,
                    props.payload.seguradora
                  ]}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Veículos por Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>
              Veículos por Conta
              {filterCompanyId !== 'all' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Filtrado)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={filteredVehicles.slice(0, 10)}
                layout="vertical"
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const empresaId = data.activePayload[0].payload.empresa_id;
                    const company = companies.find(c => c.empresa_id === empresaId);
                    if (company) setSelectedCompany(company);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="empresa_nome" 
                  type="category" 
                  width={200}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} veículos`,
                    props.payload.empresa_nome
                  ]}
                />
                <Bar 
                  dataKey="total_veiculos" 
                  fill="hsl(var(--primary))" 
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em uma barra para ver detalhes da empresa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <CompanySidePanel
        open={!!selectedCompany}
        onOpenChange={(open) => !open && setSelectedCompany(null)}
        company={selectedCompany}
      />
    </AdminLayout>
  );
}
