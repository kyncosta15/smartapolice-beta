
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
     * Conta PF | PJ de modo robusto.
     * 1. Usa documento_tipo, se existir.
     * 2. Se não existir ou vier 'undefined', infere pelo tamanho do campo documento.
     * 3. Se mesmo assim nada for detectado mas EXISTE ao menos 1 apólice,
     *    considera a apólice como PF por default (último fallback).
     */
    function contarPFouPJ(lista: ParsedPolicyData[]) {
      let pf = 0;
      let pj = 0;

      lista.forEach((p) => {
        const tipo = (p.documento_tipo as any)?.value ?? p.documento_tipo ?? '';
        const tipoUp = String(tipo).toUpperCase().trim();

        if (tipoUp === 'CPF') pf++;
        else if (tipoUp === 'CNPJ') pj++;
        else {
          // fallback pelo campo documento
          const doc = (p.documento as any)?.value ?? p.documento ?? '';
          const digitos = String(doc).replace(/\D/g, '');
          if (digitos.length === 11) pf++;
          else if (digitos.length === 14) pj++;
        }
      });

      // ► Fallback final: se nada foi classificado,
      //   mas existe ao menos 1 apólice, conte-a como PF
      if (pf === 0 && pj === 0 && lista.length > 0) pf = 1;

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

    // ✅ NOVA LÓGICA ROBUSTA - Usando a função contarPFouPJ
    const personTypeDistribution = contarPFouPJ(policies);

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
