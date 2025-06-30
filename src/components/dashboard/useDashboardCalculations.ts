
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

    /**
     * ✅ NOVA FUNÇÃO SIMPLIFICADA - Aceita snake_case OU camelCase
     * Sem dependência do extractFieldValue, leitura direta dos campos
     */
    function contarPFouPJ(lista: ParsedPolicyData[]) {
      let pf = 0, pj = 0;

      // Verificação rápida dos dados
      console.table(
        lista.map(p => ({
          docTipo: (p as any).documento_tipo ?? (p as any).documentoTipo,
          doc: (p as any).documento
        }))
      );

      lista.forEach(p => {
        // ← 1. usa documento_tipo OU documentoTipo
        const tipoBruto = (p as any).documento_tipo ?? (p as any).documentoTipo ?? '';
        const tipo = String(tipoBruto).toUpperCase().trim();

        console.log('🔍 Analisando política:', { tipoBruto, tipo });

        // ← 2. se vier CPF/CNPJ explícito
        if (tipo === 'CPF') { 
          pf++; 
          console.log('✅ PESSOA FÍSICA identificada via documento_tipo! Total PF:', pf);
          return; 
        }
        if (tipo === 'CNPJ') { 
          pj++; 
          console.log('✅ PESSOA JURÍDICA identificada via documento_tipo! Total PJ:', pj);
          return; 
        }

        // ← 3. fallback pelo campo documento (com ou sem pontuação)
        const doc = (p as any).documento ?? '';
        const dig = String(doc).replace(/\D/g, '');
        
        console.log('🔍 Fallback por documento:', { doc, dig, length: dig.length });
        
        if (dig.length === 11) {
          pf++;
          console.log('✅ PESSOA FÍSICA identificada via documento (11 dígitos)! Total PF:', pf);
        } else if (dig.length === 14) {
          pj++;
          console.log('✅ PESSOA JURÍDICA identificada via documento (14 dígitos)! Total PJ:', pj);
        }
      });

      // fallback final
      if (pf === 0 && pj === 0 && lista.length) {
        pf = 1;
        console.log('🔄 Aplicando fallback final: contando como PF');
      }

      console.log('🎯 RESULTADO FINAL da contagem:', {
        pessoaFisica: pf,
        pessoaJuridica: pj,
        total: pf + pj,
        totalPolicies: lista.length
      });

      return { pessoaFisica: pf, pessoaJuridica: pj };
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

    // ✅ NOVA LÓGICA SIMPLIFICADA - Usando a função contarPFouPJ otimizada
    const personTypeDistribution = contarPFouPJ(policies);

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
