
import { ParsedPolicyData } from './policyDataParser';
import { extractFieldValue } from './extractFieldValue';

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
    type: 'warning' | 'info' | 'success';
    category: string;
    message: string;
  }>;
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
}

export function calculateDashboardMetrics(policies: ParsedPolicyData[]): DashboardData {
  console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');

  // Calcular métricas básicas
  const totalPolicies = policies.length;
  const totalMonthlyCost = policies.reduce((sum, policy) => {
    const monthlyCost = policy.monthlyAmount || (policy.premium || 0) / 12;
    return sum + monthlyCost;
  }, 0);
  
  const totalInsuredValue = policies.reduce((sum, policy) => {
    return sum + (policy.premium || 0);
  }, 0);

  // Calcular apólices vencendo (próximos 30 dias)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringPolicies = policies.filter(policy => {
    const expirationDate = new Date(policy.expirationDate || policy.endDate);
    return expirationDate >= now && expirationDate <= thirtyDaysFromNow;
  }).length;

  // Calcular total de parcelas
  const totalInstallments = policies.reduce((sum, policy) => {
    return sum + (policy.installments?.length || 0);
  }, 0);

  // Distribuição por seguradora com tratamento seguro de objetos
  const insurerMap = new Map<string, number>();
  
  policies.forEach(policy => {
    // Usar extractFieldValue para extrair o nome da seguradora de forma segura
    const insurerName = extractFieldValue(policy.insurer) || 'Não informado';
    const monthlyCost = policy.monthlyAmount || (policy.premium || 0) / 12;
    
    insurerMap.set(insurerName, (insurerMap.get(insurerName) || 0) + monthlyCost);
  });

  const insurerDistribution = Array.from(insurerMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      percentage: Math.round((value / totalMonthlyCost) * 100)
    }))
    .sort((a, b) => b.value - a.value);

  // Distribuição por tipo
  const typeMap = new Map<string, number>();
  
  policies.forEach(policy => {
    const typeLabel = getTypeLabel(policy.type);
    const monthlyCost = policy.monthlyAmount || (policy.premium || 0) / 12;
    
    typeMap.set(typeLabel, (typeMap.get(typeLabel) || 0) + monthlyCost);
  });

  const typeDistribution = Array.from(typeMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))
    .sort((a, b) => b.value - a.value);

  // Evolução mensal (projeção)
  const monthlyEvolution = generateMonthlyProjection(totalMonthlyCost);

  // Classificação por pessoa física/jurídica
  const personTypeDistribution = classifyPersonTypes(policies);

  // Insights
  const insights = generateInsights(policies, totalMonthlyCost, totalInstallments);

  const dashboardData = {
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

  console.log('📊 Dashboard data final:', dashboardData);
  return dashboardData;
}

function getTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    'auto': 'Seguro Auto',
    'vida': 'Seguro de Vida',
    'saude': 'Seguro Saúde',
    'residencial': 'Seguro Residencial',
    'empresarial': 'Empresarial',
    'patrimonial': 'Seguro Patrimonial',
    'acidentes_pessoais': 'Acidentes Pessoais'
  };
  
  return typeLabels[type?.toLowerCase()] || 'Seguro Auto';
}

function generateMonthlyProjection(totalMonthlyCost: number) {
  console.log('📅 Gerando projeção dinâmica de 12 meses a partir de:', new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
  
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    console.log(`📆 Mês ${i + 1}: ${monthName}`);
    
    months.push({
      month: monthName,
      cost: Math.round(totalMonthlyCost)
    });
  }
  
  console.log('📊 Projeção mensal dinâmica gerada:', months);
  return months;
}

function classifyPersonTypes(policies: ParsedPolicyData[]) {
  console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
  
  let pessoaFisica = 0;
  let pessoaJuridica = 0;
  
  policies.forEach(policy => {
    console.log('📋 Analisando política:', {
      id: policy.id,
      name: policy.name,
      documento_tipo: policy.documento_tipo,
      documento: policy.documento
    });
    
    // Usar extractFieldValue para extrair o tipo de documento
    const documentoTipo = extractFieldValue(policy.documento_tipo);
    
    if (documentoTipo) {
      console.log(`📄 Política "${policy.name}": documento_tipo = "${documentoTipo}"`);
      
      if (documentoTipo === 'CPF') {
        pessoaFisica++;
        console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
      } else if (documentoTipo === 'CNPJ') {
        pessoaJuridica++;
        console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
      }
    } else {
      console.log(`⚠️ Política "${policy.name}": campo documento_tipo não encontrado, vazio ou undefined`);
      console.log('⚠️ Dados disponíveis:', Object.keys(policy));
      console.log('⚠️ Valor do campo documento_tipo:', policy.documento_tipo);
    }
  });
  
  const result = {
    pessoaFisica,
    pessoaJuridica
  };
  
  console.log('🎯 RESULTADO FINAL da classificação:', {
    ...result,
    total: pessoaFisica + pessoaJuridica
  });
  
  return result;
}

function generateInsights(policies: ParsedPolicyData[], totalMonthlyCost: number, totalInstallments: number) {
  const insights = [];
  
  // Verificar apólices com custo alto
  const averageCost = totalMonthlyCost / policies.length;
  const highCostPolicies = policies.filter(p => {
    const monthlyCost = p.monthlyAmount || (p.premium || 0) / 12;
    return monthlyCost > averageCost * 1.5;
  }).length;
  
  if (highCostPolicies > 0) {
    insights.push({
      type: 'warning' as const,
      category: 'Alto Custo',
      message: `${highCostPolicies} apólice(s) com custo acima da média. Considere renegociar.`
    });
  }
  
  // Insight sobre diversificação
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
}
