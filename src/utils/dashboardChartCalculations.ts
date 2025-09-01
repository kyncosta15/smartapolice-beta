
import { ParsedPolicyData } from './policyDataParser';
import { PolicyDataMapper } from './policyDataMapper';

export interface ChartDataItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface StatusChartItem {
  name: string;
  value: number;
}

// Função para calcular dados do gráfico de status
export const calculateStatusChartData = (policies: ParsedPolicyData[]): StatusChartItem[] => {
  const statusCounts = policies.reduce((acc, policy) => {
    const status = PolicyDataMapper.getStatus(policy);
    
    const statusKey = status.toLowerCase().includes('vig') ? 'Vigentes' :
                     status.toLowerCase().includes('vencid') ? 'Vencidas' :
                     status.toLowerCase().includes('cancel') ? 'Canceladas' :
                     status.toLowerCase().includes('renovad') ? 'Renovadas' : 'Outras';
    
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));
};

// Função para calcular dados do gráfico de seguradoras
export const calculateInsurerChartData = (policies: ParsedPolicyData[]): ChartDataItem[] => {
  console.log('🔍 calculateInsurerChartData - Processando políticas:', policies.length);
  
  if (!policies || policies.length === 0) {
    return [];
  }

  const insurerCounts = policies.reduce((acc, policy) => {
    // USANDO MAPPER ROBUSTO: Evita erros de propriedade inexistente
    const insurerName = PolicyDataMapper.getInsurerName(policy);
    const policyValue = PolicyDataMapper.getMonthlyAmount(policy);
    
    console.log(`📋 Política ${PolicyDataMapper.getInsuredName(policy)}: seguradora extraída = "${insurerName}"`);
    
    if (!acc[insurerName]) {
      acc[insurerName] = { count: 0, totalValue: 0 };
    }
    
    acc[insurerName].count += 1;
    acc[insurerName].totalValue += policyValue;
    
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  const totalValue = Object.values(insurerCounts).reduce((sum, item) => sum + item.totalValue, 0);

  const result = Object.entries(insurerCounts).map(([name, data]) => ({
    name: name,
    value: Math.round(data.totalValue),
    percentage: totalValue > 0 ? Math.round((data.totalValue / totalValue) * 100) : 0
  }));

  console.log('✅ calculateInsurerChartData resultado:', result);
  return result;
};

// Função para calcular distribuição de tipos
export const calculateTypeDistribution = (policies: ParsedPolicyData[]): ChartDataItem[] => {
  const typeCounts = policies.reduce((acc, policy) => {
    const mappedData = PolicyDataMapper.mapForChart(policy);
    const type = mappedData.type;
    
    const typeKey = type.toLowerCase().includes('auto') ? 'Seguro Auto' :
                   type.toLowerCase().includes('vida') ? 'Seguro Vida' :
                   type.toLowerCase().includes('empresarial') ? 'Empresarial' :
                   type.toLowerCase().includes('resid') ? 'Residencial' : 'Outros';
    
    const monthlyAmount = mappedData.monthlyAmount;
    
    if (!acc[typeKey]) {
      acc[typeKey] = 0;
    }
    acc[typeKey] += monthlyAmount;
    
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }));
};

// Função para calcular políticas recentes
export const calculateRecentPolicies = (policies: ParsedPolicyData[]) => {
  return policies
    .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime())
    .slice(0, 5)
    .map(policy => {
      const mappedData = PolicyDataMapper.mapForChart(policy);
      return {
        id: policy.id,
        name: mappedData.name,
        insurer: mappedData.insurer,
        premium: PolicyDataMapper.getMonthlyAmount(policy),
        monthlyAmount: mappedData.monthlyAmount,
        endDate: mappedData.endDate,
        extractedAt: mappedData.extractedAt
      };
    });
};

// Função para classificação de pessoa física/jurídica usando mapper robusto
export const calculatePersonTypeDistribution = (policies: ParsedPolicyData[]) => {
  console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
  
  const distribution = { pessoaFisica: 0, pessoaJuridica: 0 };
  
  policies.forEach(policy => {
    const mappedData = PolicyDataMapper.mapForChart(policy);
    const documentType = mappedData.documentType;
    
    console.log('📋 Analisando política:', {
      id: policy.id,
      name: mappedData.name,
      documentType: documentType
    });
    
    if (documentType === 'CPF') {
      distribution.pessoaFisica++;
      console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
    } else if (documentType === 'CNPJ') {
      distribution.pessoaJuridica++;
      console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
    } else {
      console.log(`⚠️ Política "${mappedData.name}": tipo de documento não determinado`);
    }
  });
  
  console.log('🎯 RESULTADO FINAL da classificação:', {
    pessoaFisica: distribution.pessoaFisica,
    pessoaJuridica: distribution.pessoaJuridica,
    total: distribution.pessoaFisica + distribution.pessoaJuridica
  });
  
  return distribution;
};
