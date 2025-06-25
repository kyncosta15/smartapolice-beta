
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Shield, AlertTriangle, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const { dashboardData, isRefreshing, lastUpdate, refreshDashboard } = useDashboardData(policies);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header com informações de sincronização */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dashboard Dinâmico</h2>
              <p className="text-sm text-gray-600">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')} | 
                {policies.length} apólice(s) processada(s)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Apólices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">Apólices ativas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">Todas as apólices</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Segurado</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.totalInsuredValue)}
            </div>
            <p className="text-xs text-muted-foreground">Cobertura total</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.expiringPolicies}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos dinâmicos */}
      {policies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Seguradora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Distribuição por Seguradora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.insurerDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.insurerDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Custo Mensal']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Custo Mensal']} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma apólice processada</h3>
            <p className="text-gray-500">Faça upload de PDFs para ver os gráficos e análises</p>
          </CardContent>
        </Card>
      )}

      {/* Evolução Mensal */}
      {policies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Evolução de Custos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Custo']} />
                  <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Inteligentes */}
      {viewMode === 'admin' && dashboardData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Insights Inteligentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                      {insight.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento por Apólice */}
      {policies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Apólice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{policy.name}</h4>
                      <p className="text-sm text-gray-600">{policy.insurer}</p>
                    </div>
                    <Badge variant={policy.status === 'active' ? 'default' : 
                                   policy.status === 'expiring' ? 'destructive' : 'secondary'}>
                      {policy.status === 'active' ? 'Ativa' :
                       policy.status === 'expiring' ? 'Vencendo' : 'Vencida'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{policy.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Mensal:</span>
                      <p className="font-medium">{formatCurrency(policy.monthlyAmount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cobertura:</span>
                      <p className="font-medium">{policy.totalCoverage ? formatCurrency(policy.totalCoverage) : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Franquia:</span>
                      <p className="font-medium">{policy.deductible ? formatCurrency(policy.deductible) : 'N/A'}</p>
                    </div>
                  </div>

                  {policy.installments && policy.installments.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-2">Parcelas:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {policy.installments.slice(0, 4).map((installment, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            <p className="font-medium">{formatCurrency(installment.valor)}</p>
                            <p className="text-gray-600">{new Date(installment.data).toLocaleDateString('pt-BR')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
