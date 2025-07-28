
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface DashboardData {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  totalInstallments: number;
  insurerDistribution: Array<{ name: string; value: number; percentage: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; cost: number }>;
  insights: Array<{ type: string; category: string; message: string }>;
  personTypeDistribution: { pessoaFisica: number; pessoaJuridica: number };
}

export const useDashboardCalculations = (policies: ParsedPolicyData[]): DashboardData => {
  return useMemo(() => {
    console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');
    
    // Função para extrair nome da seguradora de forma segura
    const getInsurerName = (insurerData: any): string => {
      if (!insurerData) return 'Seguradora Desconhecida';
      
      if (typeof insurerData === 'string') {
        return insurerData;
      }
      
      if (typeof insurerData === 'object' && insurerData !== null) {
        // Handle different object structures
        if (insurerData.empresa) return String(insurerData.empresa);
        if (insurerData.name) return String(insurerData.name);
        if (insurerData.value) return String(insurerData.value);
        
        return 'Seguradora Desconhecida';
      }
      
      return String(insurerData);
    };

    // Calcular métricas básicas
    const totalPolicies = policies.length;
    const totalMonthlyCost = policies.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    const totalInsuredValue = policies.reduce((sum, policy) => sum + (policy.totalCoverage || 0), 0);
    
    // Calcular apólices vencendo (próximos 30 dias)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;

    // Calcular total de parcelas
    const totalInstallments = policies.reduce((sum, policy) => {
      return sum + (policy.installments?.length || 0);
    }, 0);

    // Distribuição por seguradora
    const insurerCounts = policies.reduce((acc, policy) => {
      const insurerName = getInsurerName(policy.insurer);
      acc[insurerName] = (acc[insurerName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const insurerDistribution = Object.entries(insurerCounts).map(([name, value]) => ({
      name,
      value,
      percentage: totalMonthlyCost > 0 ? (value / totalMonthlyCost) * 100 : 0
    }));

    // Distribuição por tipo
    const getTypeLabel = (type: string) => {
      const types = {
        auto: 'Seguro Auto',
        vida: 'Seguro de Vida',
        saude: 'Seguro Saúde',
        patrimonial: 'Seguro Patrimonial',
        empresarial: 'Seguro Empresarial',
        acidentes_pessoais: 'Acidentes Pessoais'
      };
      return types[type] || 'Seguro Auto';
    };

    const typeCounts = policies.reduce((acc, policy) => {
      const typeLabel = getTypeLabel(policy.type);
      acc[typeLabel] = (acc[typeLabel] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Classificação por pessoa física/jurídica
    console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
    const personTypeDistribution = policies.reduce((acc, policy) => {
      console.log('📋 Analisando política:', {
        id: policy.id,
        name: policy.name,
        documento_tipo: policy.documento_tipo,
        documento: policy.documento
      });
      
      const documentoTipo = extractFieldValue(policy.documento_tipo);
      
      if (!documentoTipo || documentoTipo === 'undefined' || documentoTipo === '') {
        console.log(`⚠️ Política "${policy.name}": campo documento_tipo não encontrado, vazio ou undefined`);
        console.log('⚠️ Dados disponíveis:', Object.keys(policy));
        console.log('⚠️ Valor do campo documento_tipo:', policy.documento_tipo);
        return acc;
      }
      
      if (documentoTipo === 'CPF') {
        console.log(`✅ Política "${policy.name}": classificada como Pessoa Física`);
        acc.pessoaFisica++;
      } else if (documentoTipo === 'CNPJ') {
        console.log(`✅ Política "${policy.name}": classificada como Pessoa Jurídica`);
        acc.pessoaJuridica++;
      } else {
        console.log(`⚠️ Política "${policy.name}": tipo de documento desconhecido: ${documentoTipo}`);
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da classificação:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Evolução mensal (projeção de 12 meses)
    const currentDate = new Date();
    const monthlyEvolution = [];
    
    console.log('📅 Gerando projeção dinâmica de 12 meses a partir de:', currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      console.log(`📆 Mês ${i + 1}: ${monthLabel}`);
      
      // Calcular custo mensal considerando apólices ativas neste mês
      const monthlyCost = policies.reduce((sum, policy) => {
        const startDate = new Date(policy.startDate);
        const endDate = new Date(policy.endDate);
        
        // Verificar se a apólice está ativa neste mês
        if (date >= startDate && date <= endDate) {
          return sum + (policy.monthlyAmount || 0);
        }
        return sum;
      }, 0);
      
      monthlyEvolution.push({
        month: monthLabel,
        cost: monthlyCost
      });
    }

    console.log('📊 Projeção mensal dinâmica gerada:', monthlyEvolution);

    // Insights
    const insights = [];
    
    if (totalInstallments > 0) {
      insights.push({
        type: 'info',
        category: 'Parcelas',
        message: `Total de ${totalInstallments} parcelas distribuídas em suas apólices.`
      });
    }
    
    if (expiringPolicies > 0) {
      insights.push({
        type: 'warning',
        category: 'Vencimentos',
        message: `${expiringPolicies} apólice(s) vencendo nos próximos 30 dias.`
      });
    }

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
  }, [policies]);
};
