import { useState, useEffect, useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface DashboardMetrics {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  totalInstallments: number;
  insurerDistribution: Array<{ name: string; value: number; percentage: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; cost: number }>;
  insights: Array<{ type: string; category: string; message: string }>;
  // Novas métricas para pessoa física/jurídica
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
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
        totalInstallments: 0,
        insurerDistribution: [],
        typeDistribution: [],
        monthlyEvolution: [],
        insights: [],
        personTypeDistribution: {
          pessoaFisica: 0,
          pessoaJuridica: 0
        }
      };
    }

    console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');

    const totalPolicies = policies.length;
    const totalMonthlyCost = policies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0);
    const totalInsuredValue = policies.reduce((sum, p) => sum + (p.totalCoverage || p.premium || 0), 0);
    
    // Calcular apólices vencendo nos próximos 30 dias
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPolicies = policies.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate <= thirtyDaysFromNow && endDate >= new Date();
    }).length;

    // Calcular total de parcelas - corrigindo o erro TypeScript
    const totalInstallments = policies.reduce((sum, p) => {
      const installmentCount = Array.isArray(p.installments) 
        ? p.installments.length 
        : (typeof p.installments === 'number' ? p.installments : 12);
      return sum + installmentCount;
    }, 0);

    // Distribuição por seguradora
    const insurerCounts = policies.reduce((acc, policy) => {
      const insurerName = policy.insurer || 'Não informado';
      acc[insurerName] = (acc[insurerName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const insurerDistribution = Object.entries(insurerCounts).map(([name, value]) => ({
      name,
      value: Math.round(value),
      percentage: totalMonthlyCost > 0 ? Math.round((value / totalMonthlyCost) * 100) : 0
    }));

    // Distribuição por tipo
    const typeCounts = policies.reduce((acc, policy) => {
      const typeName = policy.type === 'auto' ? 'Seguro Auto' :
                       policy.type === 'vida' ? 'Seguro de Vida' :
                       policy.type === 'saude' ? 'Seguro Saúde' :
                       policy.type === 'patrimonial' ? 'Patrimonial' :
                       policy.type === 'empresarial' ? 'Empresarial' : 
                       policy.type || 'Outros';
      acc[typeName] = (acc[typeName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    // 🚨 LÓGICA CORRIGIDA - Distribuição pessoa física/jurídica
    console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
    
    const personTypeDistribution = policies.reduce((acc, policy) => {
      console.log('📋 Analisando política:', {
        id: policy.id,
        name: policy.name,
        documento_tipo: policy.documento_tipo,
        documento: policy.documento
      });

      // Verificar se temos o campo documento_tipo do N8N
      if (policy.documento_tipo) {
        const tipoDocumento = policy.documento_tipo.toString().toUpperCase().trim();
        console.log(`📄 Política "${policy.name}": documento_tipo = "${tipoDocumento}"`);
        
        // ✅ LÓGICA CORRIGIDA: CPF = Pessoa Física, CNPJ = Pessoa Jurídica
        if (tipoDocumento === 'CPF') {
          acc.pessoaFisica++;
          console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
        } else if (tipoDocumento === 'CNPJ') {
          acc.pessoaJuridica++;
          console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
        } else {
          console.log('⚠️ Tipo de documento não reconhecido:', tipoDocumento);
          console.log('⚠️ Valores aceitos: "CPF" ou "CNPJ"');
        }
      } else {
        console.log(`⚠️ Política "${policy.name}": campo documento_tipo não encontrado ou vazio`);
        console.log('⚠️ Dados disponíveis:', Object.keys(policy));
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da classificação:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Evolução mensal
    const monthlyEvolution = generateMonthlyEvolution(policies);

    // Insights
    const insights = generateBasicInsights(policies);

    const result = {
      totalPolicies,
      totalMonthlyCost,
      totalInsuredValue,
      expiringPolicies,
      totalInstallments,
      insurerDistribution,
      typeDistribution,
      monthlyEvolution,
      insights,
      personTypeDistribution
    };

    console.log('📊 Dashboard data final:', result);
    return result;
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
      monthlyMap[month] += (policy.monthlyAmount || 0) / 6; // Distribuição simples
    });
  });

  return Object.entries(monthlyMap).map(([month, cost]) => ({
    month,
    cost: Math.round(cost)
  }));
}

function generateBasicInsights(policies: ParsedPolicyData[]) {
  const insights: Array<{ type: string; category: string; message: string }> = [];

  if (policies.length === 0) {
    insights.push({
      type: 'info',
      category: 'Início',
      message: 'Faça upload de PDFs de apólices para começar a análise.'
    });
    return insights;
  }

  const avgCost = policies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0) / policies.length;
  const highCostPolicies = policies.filter(p => (p.monthlyAmount || 0) > avgCost * 1.5);

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

  // Insight sobre parcelas - corrigindo o erro TypeScript
  const totalInstallments = policies.reduce((sum, p) => {
    const installmentCount = Array.isArray(p.installments) 
      ? p.installments.length 
      : (typeof p.installments === 'number' ? p.installments : 12);
    return sum + installmentCount;
  }, 0);
  
  insights.push({
    type: 'info',
    category: 'Parcelas',
    message: `Total de ${totalInstallments} parcelas distribuídas em suas apólices.`
  });

  return insights;
}
