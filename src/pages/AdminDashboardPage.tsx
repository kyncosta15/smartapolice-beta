import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CompanySidePanel } from '@/components/admin/CompanySidePanel';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, TrendingUp, Building2, Search, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CompanySummary } from '@/types/admin';

type Period = '30' | '60';

export default function AdminDashboardPage() {
  const { metrics, companies, loading } = useAdminMetrics();
  const [period, setPeriod] = useState<Period>('30');
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar empresas e veículos por termo de busca - antes dos early returns
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(c => 
      c.empresa_nome.toLowerCase().includes(term) ||
      c.empresa_id.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  // Filtrar veículos por empresas filtradas - antes dos early returns
  const filteredVehicles = useMemo(() => {
    if (!metrics) return [];
    if (!searchTerm.trim()) return metrics.veiculos_por_empresa;
    
    const filteredIds = filteredCompanies.map(c => c.empresa_id);
    return metrics.veiculos_por_empresa.filter(v => filteredIds.includes(v.empresa_id));
  }, [metrics, searchTerm, filteredCompanies]);

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
        <div>
          <h1 className="text-3xl font-bold mb-1">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Visão geral de todas as contas do sistema</p>
        </div>

        {/* Filtro de Busca */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome da empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCompanies.length}</div>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'Filtradas' : 'No sistema'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Apólices</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.apolices_total}</div>
              <p className="text-xs text-muted-foreground">
                No sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredVehicles.reduce((sum, v) => sum + v.total_veiculos, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Em todas as contas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sinistros Abertos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sinistros_total}</div>
              <p className="text-xs text-muted-foreground">
                Total no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assistências Abertas</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.assistencias_total}</div>
              <p className="text-xs text-muted-foreground">
                Total no sistema
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <AdminCharts metrics={metrics} />

        {/* Tabela de Todas as Contas */}
        <Card>
          <CardHeader>
            <CardTitle>
              Todas as Contas
              {searchTerm && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {filteredCompanies.length} resultados
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-4 text-left text-sm font-semibold text-foreground">Empresa</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <span>Usuários</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <span>Apólices</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <span>Veículos</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <span>Sinistros</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col items-center gap-1">
                          <span>Assistências</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="h-12 w-12 text-muted-foreground/50" />
                            <p className="font-medium">Nenhuma empresa encontrada</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company) => (
                        <tr 
                          key={company.empresa_id}
                          className="border-b hover:bg-accent/50 cursor-pointer transition-colors group"
                          onClick={() => setSelectedCompany(company)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {company.empresa_nome}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {company.empresa_id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-sm">
                              {company.usuarios}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold text-sm">
                              {company.apolices}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-sm">
                              {company.veiculos}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full font-semibold text-sm ${
                              company.sinistros_abertos > 0 
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400' 
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            }`}>
                              {company.sinistros_abertos}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full font-semibold text-sm ${
                              company.assistencias_abertas > 0 
                                ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400' 
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            }`}>
                              {company.assistencias_abertas}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-sm text-muted-foreground">
                              {new Date(company.ultima_atividade).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredCompanies.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                Clique em uma linha para ver detalhes da empresa
              </p>
            )}
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
