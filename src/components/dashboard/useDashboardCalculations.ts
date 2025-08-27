
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';

export interface DashboardMetrics {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  expiredPolicies: number;
  activePolicies: number;
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
    type: 'info' | 'warning' | 'error';
    category: string;
    message: string;
  }>;
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
  recentPolicies?: ParsedPolicyData[];
}

export function useDashboardCalculations(policies: ParsedPolicyData[]): DashboardMetrics {
  console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');

  return useMemo(() => {
    const totalPolicies = policies.length;
    const totalMonthlyCost = policies.reduce((sum, policy) => {
      const monthlyAmount = policy.monthlyAmount || (policy.premium ? policy.premium / 12 : 0);
      return sum + monthlyAmount;
    }, 0);
    
    const totalInsuredValue = policies.reduce((sum, policy) => sum + (policy.premium || 0), 0);
    
    // Calcular seguradoras com extração segura
    const insurerCounts = new Map<string, { count: number; value: number }>();
    
    policies.forEach(policy => {
      // Usar extractFieldValue para processar o campo insurer de forma segura
      const insurerName = extractFieldValue(policy.insurer);
      const safeName = insurerName || 'Seguradora Não Informada';
      
      console.log('📊 Processando seguradora no dashboard:', { 
        original: policy.insurer, 
        extracted: safeName,
        type: typeof policy.insurer 
      });
      
      const monthlyAmount = policy.monthlyAmount || (policy.premium ? policy.premium / 12 : 0);
      
      const current = insurerCounts.get(safeName) || { count: 0, value: 0 };
      insurerCounts.set(safeName, {
        count: current.count + 1,
        value: current.value + monthlyAmount
      });
    });

    const insurerDistribution = Array.from(insurerCounts.entries()).map(([name, data]) => ({
      name,
      value: Math.round(data.value),
      percentage: Math.round((data.value / totalMonthlyCost) * 100)
    }));

    // Calcular tipos de seguro
    const typeCounts = new Map<string, number>();
    policies.forEach(policy => {
      const type = policy.type === 'auto' ? 'Seguro Auto' : 
                   policy.type === 'empresarial' ? 'Empresarial' : 
                   policy.type || 'Outros';
      const monthlyAmount = policy.monthlyAmount || (policy.premium ? policy.premium / 12 : 0);
      typeCounts.set(type, (typeCounts.get(type) || 0) + monthlyAmount);
    });

    const typeDistribution = Array.from(typeCounts.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    // Calcular apólices vencendo (próximos 30 dias)
    const today = new Date();
    const next30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const expiringPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate || policy.expirationDate);
      return endDate >= today && endDate <= next30Days;
    }).length;

    // Calcular apólices expiradas
    const expiredPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate || policy.expirationDate);
      return endDate < today;
    }).length;

    const activePolicies = totalPolicies - expiredPolicies;

    // Calcular parcelas
    const totalInstallments = policies.reduce((sum, policy) => {
      return sum + (Array.isArray(policy.installments) ? policy.installments.length : 0);
    }, 0);

    // Calcular distribuição por tipo de pessoa
    console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
    
    const personTypeDistribution = { pessoaFisica: 0, pessoaJuridica: 0 };
    
    policies.forEach(policy => {
      console.log('📋 Analisando política:', {
        id: policy.id,
        name: policy.name,
        documento_tipo: policy.documento_tipo,
        documento: policy.documento
      });
      
      // Usar extractFieldValue para extrair o tipo de documento
      let documentType = extractFieldValue(policy.documento_tipo);
      
      if (!documentType) {
        console.log(`⚠️ Política "${policy.name}": campo documento_tipo não encontrado, vazio ou undefined`);
        console.log('⚠️ Dados disponíveis:', Object.keys(policy));
        console.log('⚠️ Valor do campo documento_tipo:', policy.documento_tipo);
        
        // Tentar inferir pelo documento se disponível
        const documento = extractFieldValue(policy.documento);
        if (documento) {
          const digits = documento.replace(/\D/g, '');
          if (digits.length === 11) {
            documentType = 'CPF';
            console.log('🔍 Tipo inferido pelo documento: CPF');
          } else if (digits.length === 14) {
            documentType = 'CNPJ';
            console.log('🔍 Tipo inferido pelo documento: CNPJ');
          }
        }
      }
      
      console.log(`📄 Política "${policy.name}": documento_tipo = "${documentType}"`);
      
      if (documentType === 'CPF') {
        personTypeDistribution.pessoaFisica++;
        console.log('✅ PESSOA FÍSICA incrementada (CPF detectado)');
      } else if (documentType === 'CNPJ') {
        personTypeDistribution.pessoaJuridica++;
        console.log('✅ PESSOA JURÍDICA incrementada (CNPJ detectado)');
      } else {
        console.log(`⚠️ Documento tipo "${documentType}" não reconhecido ou vazio`);
      }
    });
    
    console.log('🎯 RESULTADO FINAL da classificação:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Gerar evolução mensal dinâmica
    console.log('📅 Gerando projeção dinâmica de 12 meses a partir de:', new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today));
    
    const monthlyEvolution = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(monthDate);
      
      console.log(`📆 Mês ${i + 1}: ${monthName}`);
      
      monthlyEvolution.push({
        month: monthName,
        cost: Math.round(totalMonthlyCost)
      });
    }
    
    console.log('📊 Projeção mensal dinâmica gerada:', monthlyEvolution);

    // Gerar insights
    const insights = [
      {
        type: 'warning' as const,
        category: 'Alto Custo',
        message: `${policies.filter(p => (p.monthlyAmount || 0) > (totalMonthlyCost / totalPolicies) * 1.5).length} apólice(s) com custo acima da média. Considere renegociar.`
      },
      {
        type: 'info' as const,
        category: 'Portfolio',
        message: `Portfolio bem diversificado com ${totalPolicies} apólices ativas.`
      },
      {
        type: 'info' as const,
        category: 'Parcelas',
        message: `Total de ${totalInstallments} parcelas distribuídas em suas apólices.`
      }
    ];

    const dashboardData = {
      totalPolicies,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      totalInsuredValue: Math.round(totalInsuredValue * 100) / 100,
      expiringPolicies,
      expiredPolicies,
      activePolicies,
      totalInstallments,
      insurerDistribution,
      typeDistribution,
      monthlyEvolution,
      insights,
      personTypeDistribution,
      recentPolicies: policies.slice(-5)
    };

    console.log('📊 Dashboard data final:', dashboardData);
    return dashboardData;
  }, [policies]);
}
