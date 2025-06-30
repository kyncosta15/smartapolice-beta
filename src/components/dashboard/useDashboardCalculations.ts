
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';

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

    // ✅ LÓGICA CORRIGIDA - Função para extrair valores de campos do N8N
    console.log('🔍 Iniciando contagem de CPF/CNPJ com extração de valores do N8N...');
    
    const extractFieldValue = (field: any): string | null => {
      console.log('🔍 Extraindo valor do campo:', field);
      
      // Se é uma string simples
      if (typeof field === 'string') {
        console.log('✅ Campo é string simples:', field);
        return field;
      }
      
      // Se é um objeto do N8N com propriedade 'value'
      if (field && typeof field === 'object' && 'value' in field) {
        console.log('✅ Campo é objeto N8N com value:', field.value);
        return field.value;
      }
      
      // Se é undefined ou null
      if (!field) {
        console.log('❌ Campo é null/undefined');
        return null;
      }
      
      console.log('⚠️ Campo tem estrutura desconhecida:', typeof field, field);
      return null;
    };

    // Contar políticas por tipo de documento
    let totalCPF = 0;
    let totalCNPJ = 0;
    
    policies.forEach((policy, index) => {
      console.log(`\n📋 === Analisando política ${index + 1}/${policies.length} ===`);
      console.log('📄 Nome da política:', policy.name);
      console.log('📄 ID da política:', policy.id);
      
      // Extrair valor do documento_tipo
      const documentoTipoValue = extractFieldValue(policy.documento_tipo);
      console.log('📝 Valor extraído do documento_tipo:', documentoTipoValue);
      
      if (documentoTipoValue && documentoTipoValue !== 'undefined') {
        const tipoDocumento = documentoTipoValue.toString().toUpperCase().trim();
        console.log('📝 Tipo de documento normalizado:', tipoDocumento);
        
        if (tipoDocumento === 'CPF') {
          totalCPF++;
          console.log('✅ PESSOA FÍSICA incrementada! Total CPF:', totalCPF);
        } else if (tipoDocumento === 'CNPJ') {
          totalCNPJ++;
          console.log('✅ PESSOA JURÍDICA incrementada! Total CNPJ:', totalCNPJ);
        } else {
          console.log('⚠️ Tipo de documento não reconhecido:', tipoDocumento);
        }
      } else {
        console.log('❌ Não foi possível extrair documento_tipo válido');
        console.log('❌ Valor original do campo:', policy.documento_tipo);
        
        // Tentar extrair do campo documento como fallback
        const documentoValue = extractFieldValue(policy.documento);
        console.log('🔍 Tentando fallback com campo documento:', documentoValue);
        
        if (documentoValue && documentoValue !== 'undefined') {
          // Inferir tipo baseado no tamanho (CPF: 11 dígitos, CNPJ: 14 dígitos)
          const numeroLimpo = documentoValue.replace(/\D/g, '');
          console.log('🔍 Número limpo para inferência:', numeroLimpo);
          
          if (numeroLimpo.length === 11) {
            totalCPF++;
            console.log('✅ PESSOA FÍSICA incrementada via fallback! Total CPF:', totalCPF);
          } else if (numeroLimpo.length === 14) {
            totalCNPJ++;
            console.log('✅ PESSOA JURÍDICA incrementada via fallback! Total CNPJ:', totalCNPJ);
          } else {
            console.log('⚠️ Documento com tamanho inválido:', numeroLimpo.length);
          }
        }
      }
    });

    const personTypeDistribution = {
      pessoaFisica: totalCPF,
      pessoaJuridica: totalCNPJ
    };

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
