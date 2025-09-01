
import { ParsedPolicyData } from './policyDataParser';
import { extractFieldValue, extractNumericValue } from './extractFieldValue';

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
    // CORREÇÃO: Usar extractFieldValue para status
    const status = extractFieldValue(policy.status) || 'vigente';
    
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
    // CORREÇÃO CRÍTICA: Usar extractFieldValue para extrair o nome da seguradora
    const insurerName = extractFieldValue(policy.insurer) || 
                       extractFieldValue(policy.seguradora) || 
                       'Seguradora Não Informada';
    
    console.log(`📋 Política ${policy.name}: seguradora extraída = "${insurerName}"`);
    
    // CORREÇÃO: Usar extractNumericValue para o valor
    const policyValue = extractNumericValue(policy.monthlyAmount) || 0;
    
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
    // CORREÇÃO: Usar extractFieldValue para tipo
    const type = extractFieldValue(policy.type) || 'Não Especificado';
    
    const typeKey = type.toLowerCase().includes('auto') ? 'Seguro Auto' :
                   type.toLowerCase().includes('vida') ? 'Seguro Vida' :
                   type.toLowerCase().includes('empresarial') ? 'Empresarial' :
                   type.toLowerCase().includes('resid') ? 'Residencial' : 'Outros';
    
    // CORREÇÃO: Usar extractNumericValue para o valor
    const monthlyAmount = extractNumericValue(policy.monthlyAmount) || 0;
    
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
    .map(policy => ({
      id: policy.id,
      name: extractFieldValue(policy.name) || 'Apólice sem nome',
      insurer: extractFieldValue(policy.insurer) || extractFieldValue(policy.seguradora) || 'Seguradora não informada',
      premium: extractNumericValue(policy.premium) || extractNumericValue(policy.monthlyAmount) || 0,
      monthlyAmount: extractNumericValue(policy.monthlyAmount) || 0,
      endDate: extractFieldValue(policy.endDate) || extractFieldValue(policy.expirationDate) || '',
      extractedAt: extractFieldValue(policy.extractedAt) || new Date().toISOString()
    }));
};

// CORREÇÃO: Função para classificação de pessoa física/jurídica usando extractFieldValue
export const calculatePersonTypeDistribution = (policies: ParsedPolicyData[]) => {
  console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
  
  const distribution = { pessoaFisica: 0, pessoaJuridica: 0 };
  
  policies.forEach(policy => {
    console.log('📋 Analisando política:', {
      id: policy.id,
      name: extractFieldValue(policy.name),
      documento_tipo: policy.documento_tipo,
      documento: policy.documento
    });
    
    // CORREÇÃO CRÍTICA: Usar extractFieldValue para documento_tipo
    const documentoTipo = extractFieldValue(policy.documento_tipo);
    
    if (documentoTipo) {
      console.log(`📄 Política "${extractFieldValue(policy.name)}": documento_tipo = "${documentoTipo}"`);
      
      if (documentoTipo.toUpperCase() === 'CPF') {
        distribution.pessoaFisica++;
        console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
      } else if (documentoTipo.toUpperCase() === 'CNPJ') {
        distribution.pessoaJuridica++;
        console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
      } else {
        console.log(`⚠️ Tipo de documento não reconhecido: "${documentoTipo}"`);
      }
    } else {
      console.log(`⚠️ Política "${extractFieldValue(policy.name)}": campo documento_tipo não encontrado, vazio ou undefined`);
      console.log('⚠️ Dados disponíveis:', Object.keys(policy));
      console.log('⚠️ Valor do campo documento_tipo:', policy.documento_tipo);
      
      // Fallback: tentar inferir pelo documento
      const documento = extractFieldValue(policy.documento);
      if (documento) {
        const numbersOnly = documento.replace(/\D/g, '');
        if (numbersOnly.length === 11) {
          distribution.pessoaFisica++;
          console.log('✅ PESSOA FÍSICA incrementada (inferido por CPF de 11 dígitos)');
        } else if (numbersOnly.length === 14) {
          distribution.pessoaJuridica++;
          console.log('✅ PESSOA JURÍDICA incrementada (inferido por CNPJ de 14 dígitos)');
        }
      }
    }
  });
  
  console.log('🎯 RESULTADO FINAL da classificação:', {
    pessoaFisica: distribution.pessoaFisica,
    pessoaJuridica: distribution.pessoaJuridica,
    total: distribution.pessoaFisica + distribution.pessoaJuridica
  });
  
  return distribution;
};
