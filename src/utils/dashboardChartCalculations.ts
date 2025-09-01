import { ParsedPolicyData } from './policyDataParser';
import { extractFieldValue, extractNumericValue } from './extractFieldValue';

export interface DashboardData {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  totalInstallments: number;
  insurerDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  typeDistribution: Array<{
    name: string;
    value: number;
  }>;
  monthlyEvolution: Array<{
    month: string;
    cost: number;
  }>;
  insights: Array<{
    type: 'info' | 'warning' | 'success';
    category: string;
    message: string;
  }>;
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
}

export const calculateDashboardData = (policies: ParsedPolicyData[]): DashboardData => {
  console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');

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
      personTypeDistribution: { pessoaFisica: 0, pessoaJuridica: 0 }
    };
  }

  // Calcular totais usando extractNumericValue para garantir valores numéricos
  const totalPolicies = policies.length;
  const totalMonthlyCost = policies.reduce((sum, policy) => {
    const monthlyAmount = extractNumericValue(policy.monthlyAmount) || 0;
    return sum + monthlyAmount;
  }, 0);
  
  const totalInsuredValue = policies.reduce((sum, policy) => {
    const premium = extractNumericValue(policy.premium) || 0;
    return sum + premium;
  }, 0);

  // Calcular apólices vencendo (próximos 30 dias)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringPolicies = policies.filter(policy => {
    const endDateStr = extractFieldValue(policy.endDate) || extractFieldValue(policy.expirationDate);
    if (!endDateStr) return false;
    
    try {
      const endDate = new Date(endDateStr);
      return endDate <= thirtyDaysFromNow && endDate >= now;
    } catch {
      return false;
    }
  }).length;

  // Calcular total de parcelas
  const totalInstallments = policies.reduce((sum, policy) => {
    if (policy.installments && Array.isArray(policy.installments)) {
      return sum + policy.installments.length;
    }
    return sum;
  }, 0);

  // Distribuição por seguradora usando extractFieldValue
  const insurerCounts: Record<string, number> = {};
  policies.forEach(policy => {
    const insurerName = extractFieldValue(policy.insurer) || 'Não Identificada';
    const monthlyAmount = extractNumericValue(policy.monthlyAmount) || 0;
    
    if (!insurerCounts[insurerName]) {
      insurerCounts[insurerName] = 0;
    }
    insurerCounts[insurerName] += monthlyAmount;
  });

  const insurerDistribution = Object.entries(insurerCounts)
    .map(([name, value]) => ({
      name: extractFieldValue(name) || 'Não Identificada', // Garantir que é string
      value: Math.round(value),
      percentage: Math.round((value / totalMonthlyCost) * 100)
    }))
    .sort((a, b) => b.value - a.value);

  // Distribuição por tipo usando extractFieldValue
  const typeCounts: Record<string, number> = {};
  policies.forEach(policy => {
    const typeName = extractFieldValue(policy.type) || extractFieldValue(policy.category) || 'Não Especificado';
    const monthlyAmount = extractNumericValue(policy.monthlyAmount) || 0;
    
    const normalizedType = normalizeInsuranceType(typeName);
    
    if (!typeCounts[normalizedType]) {
      typeCounts[normalizedType] = 0;
    }
    typeCounts[normalizedType] += monthlyAmount;
  });

  const typeDistribution = Object.entries(typeCounts)
    .map(([name, value]) => ({
      name: extractFieldValue(name) || 'Não Especificado', // Garantir que é string
      value: Math.round(value)
    }))
    .sort((a, b) => b.value - a.value);

  // Classificação pessoa física/jurídica usando extractFieldValue
  const personTypeDistribution = classifyPersonTypes(policies);

  // Evolução mensal (projeção dinâmica)
  const monthlyEvolution = generateMonthlyProjection(totalMonthlyCost);

  // Insights
  const insights = generateInsights(policies, totalMonthlyCost, totalInstallments);

  const result = {
    totalPolicies,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    totalInsuredValue: Math.round(totalInsuredValue * 100) / 100,
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
};

export const calculateStatusChartData = (policies: ParsedPolicyData[]) => {
  if (!policies || policies.length === 0) {
    return [];
  }

  const statusCounts = policies.reduce((acc, policy) => {
    const status = extractFieldValue(policy.status) || 'vigente';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: (count / policies.length) * 100
  }));
};

export const calculateInsurerChartData = (policies: ParsedPolicyData[]) => {
  if (!policies || policies.length === 0) {
    return [];
  }

  const insurerCounts = policies.reduce((acc, policy) => {
    const insurer = extractFieldValue(policy.insurer) || 'Não informado';
    acc[insurer] = (acc[insurer] || 0) + extractNumericValue(policy.monthlyAmount);
    return acc;
  }, {} as Record<string, number>);

  const totalValue = Object.values(insurerCounts).reduce((sum, value) => sum + value, 0);

  return Object.entries(insurerCounts).map(([insurer, value]) => ({
    name: insurer,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
  }));
};

const normalizeInsuranceType = (type: string): string => {
  const typeStr = extractFieldValue(type) || '';
  const lowerType = typeStr.toLowerCase();
  
  if (lowerType.includes('auto') || lowerType.includes('veicular') || lowerType.includes('carro')) {
    return 'Seguro Auto';
  }
  if (lowerType.includes('empresarial') || lowerType.includes('commercial')) {
    return 'Empresarial';
  }
  if (lowerType.includes('residencial') || lowerType.includes('casa')) {
    return 'Residencial';
  }
  if (lowerType.includes('vida') || lowerType.includes('life')) {
    return 'Seguro de Vida';
  }
  
  return typeStr || 'Outros';
};

const classifyPersonTypes = (policies: ParsedPolicyData[]) => {
  console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
  
  let pessoaFisica = 0;
  let pessoaJuridica = 0;

  policies.forEach(policy => {
    console.log('📋 Analisando política:', {
      id: policy.id,
      name: extractFieldValue(policy.name),
      documento_tipo: policy.documento_tipo,
      documento: policy.documento
    });

    const documentoTipo = extractFieldValue(policy.documento_tipo);
    
    if (!documentoTipo || documentoTipo === 'undefined' || documentoTipo === '') {
      console.log(`⚠️ Política "${extractFieldValue(policy.name)}": campo documento_tipo não encontrado, vazio ou undefined`);
      console.log('⚠️ Dados disponíveis:', Object.keys(policy));
      console.log('⚠️ Valor do campo documento_tipo:', policy.documento_tipo);
      return; // Pular esta política
    }

    console.log(`📄 Política "${extractFieldValue(policy.name)}": documento_tipo = "${documentoTipo}"`);

    if (documentoTipo === 'CPF') {
      pessoaFisica++;
      console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
    } else if (documentoTipo === 'CNPJ') {
      pessoaJuridica++;
      console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
    } else {
      console.log(`⚠️ Tipo de documento desconhecido: "${documentoTipo}"`);
    }
  });

  const result = { pessoaFisica, pessoaJuridica };
  console.log('🎯 RESULTADO FINAL da classificação:', {
    ...result,
    total: pessoaFisica + pessoaJuridica
  });
  
  return result;
};

const generateMonthlyProjection = (monthlyCost: number): Array<{ month: string; cost: number }> => {
  const now = new Date();
  const projection = [];
  
  console.log('📅 Gerando projeção dinâmica de 12 meses a partir de:', now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));

  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    console.log(`📆 Mês ${i + 1}: ${monthName}`);
    
    projection.push({
      month: monthName,
      cost: Math.round(monthlyCost)
    });
  }

  console.log('📊 Projeção mensal dinâmica gerada:', projection);
  return projection;
};

const generateInsights = (policies: ParsedPolicyData[], totalMonthlyCost: number, totalInstallments: number) => {
  const insights = [];
  
  // Insight sobre custos altos
  const highCostPolicies = policies.filter(policy => {
    const monthlyAmount = extractNumericValue(policy.monthlyAmount) || 0;
    const avgCost = totalMonthlyCost / policies.length;
    return monthlyAmount > avgCost * 1.5;
  }).length;

  if (highCostPolicies > 0) {
    insights.push({
      type: 'warning' as const,
      category: 'Alto Custo',
      message: `${highCostPolicies} apólice(s) com custo acima da média. Considere renegociar.`
    });
  }

  // Insight sobre portfolio
  insights.push({
    type: 'info' as const,
    category: 'Portfolio',
    message: `Portfolio bem diversificado com ${policies.length} apólices ativas.`
  });

  // Insight sobre parcelas
  insights.push({
    type: 'info' as const,
    category: 'Parcelas',
    message: `Total de ${totalInstallments} parcelas distribuídas em suas apólices.`
  });

  return insights;
};
