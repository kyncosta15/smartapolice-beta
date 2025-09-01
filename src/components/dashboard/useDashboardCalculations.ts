import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyDataMapper } from '@/utils/policyDataMapper';

interface DashboardData {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  expiredPolicies: number;
  activePolicies: number;
  totalInstallments: number;
  insurerDistribution: Array<{ name: string; value: number; percentage: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; custo: number; apolices: number }>;
  insights: Array<{ type: string; category: string; message: string }>;
  personTypeDistribution: { pessoaFisica: number; pessoaJuridica: number };
  recentPolicies: Array<{
    id: string;
    name: string;
    insurer: string;
    premium: number;
    monthlyAmount: number;
    endDate: string;
    extractedAt: string;
  }>;
}

export const useDashboardCalculations = (policies: ParsedPolicyData[]): DashboardData => {
  return useMemo(() => {
    console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');
    
    // Calcular métricas básicas usando mapper robusto
    const totalPolicies = policies.length;
    const totalMonthlyCost = policies.reduce((sum, policy) => 
      sum + PolicyDataMapper.getMonthlyAmount(policy), 0
    );
    const totalInsuredValue = policies.reduce((sum, policy) => sum + (policy.totalCoverage || 0), 0);
    
    // Calcular apólices por status
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;

    const expiredPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate);
      return endDate < today;
    }).length;

    const activePolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate);
      return endDate >= today;
    }).length;

    // Calcular total de parcelas
    const totalInstallments = policies.reduce((sum, policy) => {
      return sum + (policy.installments?.length || 0);
    }, 0);

    // Distribuição por seguradora usando mapper
    const insurerCounts = policies.reduce((acc, policy) => {
      const insurerName = PolicyDataMapper.getInsurerName(policy);
      const monthlyAmount = PolicyDataMapper.getMonthlyAmount(policy);
      acc[insurerName] = (acc[insurerName] || 0) + monthlyAmount;
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
      const monthlyAmount = PolicyDataMapper.getMonthlyAmount(policy);
      acc[typeLabel] = (acc[typeLabel] || 0) + monthlyAmount;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Classificação por pessoa física/jurídica usando mapper
    console.log('🔍 Iniciando classificação de pessoa física/jurídica...');
    const personTypeDistribution = policies.reduce((acc, policy) => {
      const documentType = PolicyDataMapper.getDocumentType(policy);
      
      if (documentType === 'CPF') {
        console.log(`✅ Política "${PolicyDataMapper.getInsuredName(policy)}": classificada como Pessoa Física`);
        acc.pessoaFisica++;
      } else if (documentType === 'CNPJ') {
        console.log(`✅ Política "${PolicyDataMapper.getInsuredName(policy)}": classificada como Pessoa Jurídica`);
        acc.pessoaJuridica++;
      } else {
        console.log(`⚠️ Política "${PolicyDataMapper.getInsuredName(policy)}": tipo de documento não determinado`);
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da classificação:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Evolução mensal (projeção de 12 meses) - Fixed type
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
          return sum + PolicyDataMapper.getMonthlyAmount(policy);
        }
        return sum;
      }, 0);
      
      // Count active policies for this month
      const activeCount = policies.filter(policy => {
        const startDate = new Date(policy.startDate);
        const endDate = new Date(policy.endDate);
        return date >= startDate && date <= endDate;
      }).length;
      
      monthlyEvolution.push({
        month: monthLabel,
        custo: monthlyCost,
        apolices: activeCount
      });
    }

    console.log('📊 Projeção mensal dinâmica gerada:', monthlyEvolution);

    // Recent policies (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPolicies = policies
      .filter(policy => {
        const extractedDate = new Date(policy.extractedAt);
        return extractedDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime())
      .slice(0, 10)
      .map(policy => ({
        id: policy.id,
        name: PolicyDataMapper.getInsuredName(policy),
        insurer: PolicyDataMapper.getInsurerName(policy),
        premium: policy.premium || 0,
        monthlyAmount: PolicyDataMapper.getMonthlyAmount(policy),
        endDate: policy.endDate,
        extractedAt: policy.extractedAt
      }));

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
      expiredPolicies,
      activePolicies,
      totalInstallments,
      insurerDistribution,
      typeDistribution,
      monthlyEvolution,
      insights,
      personTypeDistribution,
      recentPolicies
    };

    console.log('📊 Dashboard data final:', dashboardData);
    
    return dashboardData;
  }, [policies]);
};
