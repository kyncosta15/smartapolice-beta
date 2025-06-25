
import { useState, useEffect, useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface DashboardMetrics {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  insurerDistribution: Array<{ name: string; value: number; percentage: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; cost: number }>;
  insights: Array<{ type: string; category: string; message: string }>;
}

export function useDashboardData(policies: ParsedPolicyData[]) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const dashboardData = useMemo((): DashboardMetrics => {
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

    console.log('Recalculando métricas do dashboard para', policies.length, 'apólices');

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

    // Evolução mensal simplificada
    const monthlyEvolution = generateMonthlyEvolution(policies);

    // Insights básicos
    const insights = generateBasicInsights(policies);

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

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    console.log('Atualizando dashboard...');
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLastUpdate(new Date());
    setIsRefreshing(false);
    console.log('Dashboard atualizado:', new Date().toLocaleTimeString());
  };

  useEffect(() => {
    if (policies.length > 0) {
      setLastUpdate(new Date());
    }
  }, [policies.length]);

  return {
    dashboardData,
    isRefreshing,
    lastUpdate,
    refreshDashboard
  };
}

function generateMonthlyEvolution(policies: ParsedPolicyData[]) {
  const monthlyMap: { [key: string]: number } = {};
  const now = new Date();
  
  // Últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('pt-BR', { month: 'short' });
    monthlyMap[key] = 0;
  }

  // Distribui custos
  policies.forEach(policy => {
    Object.keys(monthlyMap).forEach(month => {
      monthlyMap[month] += policy.monthlyAmount / 6; // Distribuição simples
    });
  });

  return Object.entries(monthlyMap).map(([month, cost]) => ({
    month,
    cost: Math.round(cost)
  }));
}

function generateBasicInsights(policies: ParsedPolicyData[]) {
  const insights: Array<{ type: string; category: string; message: string }> = [];

  const avgCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
  const highCostPolicies = policies.filter(p => p.monthlyAmount > avgCost * 1.5);

  if (highCostPolicies.length > 0) {
    insights.push({
      type: 'warning',
      category: 'Alto Custo',
      message: `${highCostPolicies.length} apólice(s) com custo acima da média. Considere renegociar.`
    });
  }

  if (policies.length > 3) {
    insights.push({
      type: 'info',
      category: 'Portfolio',
      message: `Portfolio bem diversificado com ${policies.length} apólices ativas.`
    });
  }

  return insights;
}
