
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Shield, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const dashboardData = useMemo(() => {
    if (!policies || policies.length === 0) {
      return {
        totalPolicies: 0,
        totalMonthlyCost: 0,
        totalInsuredValue: 0,
        expiringPolicies: 0,
        insurerDistribution: [],
        typeDistribution: [],
        monthlyEvolution: [],
        insights: []
      };
    }

    const totalPolicies = policies.length;
    const totalMonthlyCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0);
    const totalInsuredValue = policies.reduce((sum, p) => sum + (p.totalCoverage || p.premium), 0);
    const expiringPolicies = policies.filter(p => p.status === 'expiring').length;

    // Distribuição por seguradora
    const insurerCounts = policies.reduce((acc, policy) => {
      acc[policy.insurer] = (acc[policy.insurer] || 0) + policy.monthlyAmount;
      return acc;
    }, {} as Record<string, number>);

    const insurerDistribution = Object.entries(insurerCounts).map(([name, value]) => ({
      name,
      value: Math.round(value),
      percentage: Math.round((value / totalMonthlyCost) * 100)
    }));

    // Distribuição por tipo
    const typeCounts = policies.reduce((acc, policy) => {
      const typeName = policy.type === 'auto' ? 'Seguro Auto' :
                       policy.type === 'vida' ? 'Seguro de Vida' :
                       policy.type === 'saude' ? 'Seguro Saúde' :
                       policy.type === 'patrimonial' ? 'Patrimonial' :
                       policy.type === 'empresarial' ? 'Empresarial' : policy.type;
      acc[typeName] = (acc[typeName] || 0) + policy.monthlyAmount;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    // Evolução mensal (últimos 12 meses)
    const monthlyEvolution = generateMonthlyEvolution(policies);

    // Insights inteligentes
    const insights = generateInsights(policies);

    return {
      totalPolicies,
      totalMonthlyCost,
      totalInsuredValue,
      expiringPolicies,
      insurerDistribution,
      typeDistribution,
      monthlyEvolution,
      insights
    };
  }, [policies]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Apólices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">Apólices ativas</p>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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

        <Card>
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

      {/* Gráficos */}
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

      {/* Evolução Mensal */}
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
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Apólice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
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
    </div>
  );
}

function generateMonthlyEvolution(policies: ParsedPolicyData[]) {
  const monthlyMap: { [key: string]: number } = {};
  const now = new Date();
  
  // Inicializa últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyMap[key] = 0;
  }

  // Processa cada apólice
  policies.forEach(policy => {
    const startDate = new Date(policy.startDate);
    const endDate = new Date(policy.endDate);
    
    // Distribui custos pelos meses ativos
    const current = new Date(Math.max(startDate.getTime(), new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime()));
    const endLimit = new Date(Math.min(endDate.getTime(), now.getTime()));
    
    while (current <= endLimit) {
      const key = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += policy.monthlyAmount;
      }
      
      current.setMonth(current.getMonth() + 1);
    }
  });

  return Object.entries(monthlyMap).map(([month, cost]) => ({
    month,
    cost: Math.round(cost)
  }));
}

function generateInsights(policies: ParsedPolicyData[]) {
  const insights: Array<{
    type: 'info' | 'warning' | 'success';
    category: string;
    message: string;
  }> = [];

  // Detectar coberturas duplicadas
  const typeGroups = policies.reduce((acc, policy) => {
    acc[policy.type] = (acc[policy.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(typeGroups).forEach(([type, count]) => {
    if (count > 1) {
      insights.push({
        type: 'warning',
        category: 'Duplicação',
        message: `Identificadas ${count} apólices do tipo ${type}. Verifique se não há coberturas duplicadas.`
      });
    }
  });

  // Identificar seguros com baixa utilização (baixa sinistralidade)
  const lowUtilization = policies.filter(p => p.claimRate && p.claimRate < 5);
  if (lowUtilization.length > 0) {
    insights.push({
      type: 'info',
      category: 'Otimização',
      message: `${lowUtilization.length} apólice(s) com baixa sinistralidade (<5%). Considere renegociar os termos.`
    });
  }

  // Identificar oportunidades de renegociação por alto custo
  const avgMonthlyCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
  const highCostPolicies = policies.filter(p => p.monthlyAmount > avgMonthlyCost * 1.5);
  if (highCostPolicies.length > 0) {
    insights.push({
      type: 'warning',
      category: 'Alto Custo',
      message: `${highCostPolicies.length} apólice(s) com custo acima da média. Considere renegociar.`
    });
  }

  // Detectar gaps de cobertura patrimonial
  const hasPatrimonial = policies.some(p => p.type === 'patrimonial');
  if (!hasPatrimonial && policies.length > 0) {
    insights.push({
      type: 'info',
      category: 'Gap de Cobertura',
      message: 'Não foram identificadas apólices patrimoniais. Considere incluir proteção para imóveis.'
    });
  }

  return insights;
}
