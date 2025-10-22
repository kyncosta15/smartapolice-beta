
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, Building2, TrendingUp, BarChart3, PieChart, Activity, UserCheck, RefreshCw, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { renderValueAsString } from '@/utils/renderValue';
import { Button } from '@/components/ui/button';

interface AdminDashboardNewProps {
  policies: ParsedPolicyData[];
  allUsers: any[];
}

export function AdminDashboardNew({ policies, allUsers }: AdminDashboardNewProps) {
  const { metrics, isLoading, error, refetch } = useAdminDashboardData();
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  // Dados para gráficos baseados nos dados reais
  const personTypeChartData = [
    { name: 'Pessoa Física', value: metrics.personTypeDistribution.pessoaFisica, color: '#3B82F6' },
    { name: 'Pessoa Jurídica', value: metrics.personTypeDistribution.pessoaJuridica, color: '#10B981' }
  ];

  const clientStatusData = [
    { name: 'Ativos', value: metrics.activeUsers, color: '#10B981' },
    { name: 'Inativos', value: metrics.totalUsers - metrics.activeUsers, color: '#EF4444' }
  ];

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-destructive">Erro ao carregar dados: {error}</p>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Dados sincronizados em tempo real com o banco de dados</p>
        </div>
        <Button onClick={refetch} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards Resumo - Usando dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total de Apólices</CardTitle>
            <FileText className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-background/20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.totalPolicies}</div>
            )}
            <p className="text-xs opacity-80 mt-1">Apólices no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total de Usuários</CardTitle>
            <Users className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-background/20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.totalUsers}</div>
            )}
            <p className="text-xs opacity-80 mt-1">Usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Seguradoras</CardTitle>
            <Building2 className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-background/20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.totalInsurers}</div>
            )}
            <p className="text-xs opacity-80 mt-1">Seguradoras parceiras</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Novas Apólices</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-background/20" />
            ) : (
              <div className="text-3xl font-bold">{metrics.newPoliciesLast30Days}</div>
            )}
            <p className="text-xs opacity-80 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(metrics.financialMetrics.totalMonthlyPremium)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total dos prêmios mensais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(metrics.financialMetrics.averagePolicyValue)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Por apólice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(metrics.financialMetrics.totalAnnualValue)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Base atual x 12 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Apólices por Seguradora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Apólices por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.insurerDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Pizza - PF vs PJ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pessoa Física vs Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={personTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {personTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Crescimento de Apólices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Crescimento de Apólices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="policies" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Doughnut - Clientes Ativos vs Inativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Status dos Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={clientStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {clientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Apólices Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Apólices Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : metrics.recentPolicies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma apólice recente encontrada</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{policy.segurado}</p>
                    <p className="text-sm text-muted-foreground">{renderValueAsString(policy.seguradora)} • {policy.tipo_seguro}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(policy.custo_mensal)}/mês
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(policy.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
