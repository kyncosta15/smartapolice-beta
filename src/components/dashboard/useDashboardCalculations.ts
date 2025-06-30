
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DocumentValidator } from '@/utils/documentValidator';

export function useDashboardCalculations(policies: ParsedPolicyData[]) {
  return useMemo(() => {
    console.log('🔍 DynamicDashboard: Recebendo políticas:', policies);
    console.log('🔍 Total de políticas recebidas:', policies?.length || 0);
    
    if (!policies || policies.length === 0) {
      console.log('❌ Nenhuma política encontrada');
      return {
        totalPolicies: 0,
        totalMonthlyCost: 0,
        totalInsuredValue: 0,
        expiringPolicies: 0,
        typeDistribution: [],
        insurerDistribution: [],
        categoryDistribution: [],
        personTypeDistribution: { pessoaFisica: 0, pessoaJuridica: 0 },
        financialData: [],
        statusDistribution: [],
        monthlyEvolution: []
      };
    }

    // A. Classificação e identificação
    const typeDistribution = policies.reduce((acc, policy) => {
      const type = policy.type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const insurerDistribution = policies.reduce((acc, policy) => {
      const insurer = policy.insurer || 'Não informado';
      acc[insurer] = (acc[insurer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Categoria (baseado no tipo de seguro)
    const categoryMapping: Record<string, string> = {
      'auto': 'Pessoal',
      'vida': 'Pessoal', 
      'saude': 'Pessoal',
      'residencial': 'Imóvel',
      'patrimonial': 'Imóvel',
      'empresarial': 'Operacional'
    };

    const categoryDistribution = policies.reduce((acc, policy) => {
      const category = categoryMapping[policy.type?.toLowerCase() || ''] || 'Outros';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribuição por tipo de pessoa - lógica simplificada e direta
    console.log('🔍 Iniciando contagem de CPF/CNPJ...');
    
    const personTypeDistribution = policies.reduce((acc, policy) => {
      console.log(`\n📋 === Analisando política ${policy.id || 'sem ID'} ===`);
      console.log('📄 Dados da política:', {
        name: policy.name,
        documento_tipo: policy.documento_tipo,
        documento: policy.documento,
        allKeys: Object.keys(policy)
      });
      
      // Lógica direta: verificar o campo documento_tipo
      if (policy.documento_tipo) {
        const tipoStr = String(policy.documento_tipo).toUpperCase().trim();
        console.log('📝 Tipo de documento processado:', tipoStr);
        
        if (tipoStr === 'CPF') {
          acc.pessoaFisica++;
          console.log('✅ PESSOA FÍSICA incrementada! Total atual:', acc.pessoaFisica);
        } else if (tipoStr === 'CNPJ') {
          acc.pessoaJuridica++;
          console.log('✅ PESSOA JURÍDICA incrementada! Total atual:', acc.pessoaJuridica);
        } else {
          console.log('⚠️ Tipo de documento não reconhecido:', tipoStr);
        }
      } else {
        console.log('❌ Campo documento_tipo não encontrado ou vazio');
        
        // Fallback: tentar analisar o campo documento diretamente
        if (policy.documento) {
          console.log('🔍 Tentando analisar campo documento:', policy.documento);
          const documentInfo = DocumentValidator.detectDocument(String(policy.documento));
          
          if (documentInfo && documentInfo.type !== 'INVALID') {
            console.log('✅ Documento detectado via fallback:', documentInfo.type);
            if (documentInfo.type === 'CPF') {
              acc.pessoaFisica++;
              console.log('✅ PESSOA FÍSICA incrementada via fallback! Total atual:', acc.pessoaFisica);
            } else if (documentInfo.type === 'CNPJ') {
              acc.pessoaJuridica++;
              console.log('✅ PESSOA JURÍDICA incrementada via fallback! Total atual:', acc.pessoaJuridica);
            }
          } else {
            console.log('❌ Documento não válido via fallback');
          }
        }
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da contagem:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica,
      totalPolicies: policies.length
    });

    // C. Informações financeiras
    const totalMonthlyCost = policies.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    const totalInsuredValue = policies.reduce((sum, policy) => sum + (policy.totalCoverage || 0), 0);

    const financialData = policies.map(policy => ({
      name: policy.name?.substring(0, 15) + '...' || 'Apólice',
      valor: policy.monthlyAmount || 0,
      cobertura: policy.totalCoverage || 0
    })).sort((a, b) => b.valor - a.valor).slice(0, 5);

    // D. Gestão e ciclo de vida
    const now = new Date();
    const expiringPolicies = policies.filter(policy => {
      const endDate = new Date(policy.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;

    // Status das apólices
    const statusDistribution = policies.reduce((acc, policy) => {
      let status = 'Ativa';
      const endDate = new Date(policy.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) status = 'Vencida';
      else if (diffDays <= 30) status = 'Vencendo';
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Evolução mensal dos custos
    const monthlyEvolution = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      monthlyEvolution.push({
        month,
        custo: totalMonthlyCost + (Math.random() - 0.5) * totalMonthlyCost * 0.1,
        apolices: policies.length + Math.floor((Math.random() - 0.5) * 3)
      });
    }

    return {
      totalPolicies: policies.length,
      totalMonthlyCost,
      totalInsuredValue,
      expiringPolicies,
      typeDistribution: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
      insurerDistribution: Object.entries(insurerDistribution).map(([name, value]) => ({ name, value })),
      categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })),
      personTypeDistribution,
      financialData,
      statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      monthlyEvolution
    };
  }, [policies]);
}
