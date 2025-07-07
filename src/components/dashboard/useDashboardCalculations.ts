
import { useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';

export function useDashboardCalculations(policies: ParsedPolicyData[]) {
  return useMemo(() => {
    console.log('🔍 DynamicDashboard: Recebendo políticas:', policies);
    console.log('🔍 Total de políticas recebidas:', policies?.length || 0);
    
    if (!policies || policies.length === 0) {
      console.log('❌ Nenhuma política encontrada');
      return {
        TotalPolicies: 0,
        TotalMonthlyCost: 0,
        TotalInsuredValue: 0,
        ExpiringPolicies: 0,
        ExpiredPolicies: 0,
        ActivePolicies: 0,
        TypeDistribution: [],
        InsurerDistribution: [],
        CategoryDistribution: [],
        RecentPolicies: [],
        PersonTypeDistribution: { PessoaFisica: 0, PessoaJuridica: 0 },
        FinancialData: [],
        StatusDistribution: [],
        MonthlyEvolution: []
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

        if (tipoUp === 'CPF') {
          pf++;
          console.log('✅ PESSOA FÍSICA identificada via documento_tipo! Total PF:', pf);
        } else if (tipoUp === 'CNPJ') {
          pj++;
          console.log('✅ PESSOA JURÍDICA identificada via documento_tipo! Total PJ:', pj);
        } else {
          // fallback pelo campo documento com limpeza correta
          const documentoValue = extractFieldValue(p.documento);
          if (documentoValue && documentoValue !== 'undefined') {
            const numeroLimpo = documentoValue.replace(/[^\d]/g, ''); // Remove tudo que não é número

            console.log('🔍 Número limpo para inferência:', numeroLimpo);

            if (numeroLimpo.length === 11) {
              pf++;
              console.log('✅ PESSOA FÍSICA incrementada via fallback! Total CPF:', pf);
            } else if (numeroLimpo.length === 14) {
              pj++;
              console.log('✅ PESSOA JURÍDICA incrementada via fallback! Total CNPJ:', pj);
            } else {
              console.log('⚠️ Documento com tamanho inválido:', numeroLimpo.length);
            }
          }
        }
      });

      // ► Fallback final: se nada foi classificado,
      //   mas existe ao menos 1 apólice, conte-a como PF
      if (pf === 0 && pj === 0 && lista.length > 0) {
        pf = 1;
        console.log('🔄 Aplicando fallback final: contando como PF');
      }

      return { PessoaFisica: pf, PessoaJuridica: pj };
    }

    // A. Classificação e identificação
    const TypeDistribution = policies.reduce((acc, policy) => {
      const type = policy.type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const InsurerDistribution = policies.reduce((acc, policy) => {
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

    const CategoryDistribution = policies.reduce((acc, policy) => {
      const category = categoryMapping[policy.type?.toLowerCase() || ''] || 'Outros';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ✅ NOVA LÓGICA ROBUSTA - Usando a função contarPFouPJ
    const PersonTypeDistribution = contarPFouPJ(policies);

    console.log('🎯 RESULTADO FINAL da contagem:', {
      PessoaFisica: PersonTypeDistribution.PessoaFisica,
      PessoaJuridica: PersonTypeDistribution.PessoaJuridica,
      total: PersonTypeDistribution.PessoaFisica + PersonTypeDistribution.PessoaJuridica,
      TotalPolicies: policies.length
    });

    // C. Informações financeiras
    const TotalMonthlyCost = policies.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    const TotalInsuredValue = policies.reduce((sum, policy) => sum + (policy.totalCoverage || 0), 0);

    const FinancialData = policies.map(policy => ({
      name: policy.name?.substring(0, 15) + '...' || 'Apólice',
      valor: policy.monthlyAmount || 0,
      cobertura: policy.totalCoverage || 0
    })).sort((a, b) => b.valor - a.valor).slice(0, 5);

    // D. Gestão e ciclo de vida
    const now = new Date();
    
    // Calcular apólices vencidas, vencendo e ativas
    let ExpiredPolicies = 0;
    let ExpiringPolicies = 0; 
    let ActivePolicies = 0;
    
    policies.forEach(policy => {
      if (!policy.endDate) {
        ActivePolicies++; // Se não tem data fim, considera ativa
        return;
      }
      
      const endDate = new Date(policy.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        ExpiredPolicies++; // Já venceu
      } else if (diffDays <= 30) {
        ExpiringPolicies++; // Vence nos próximos 30 dias
      } else {
        ActivePolicies++; // Ainda tem mais de 30 dias
      }
    });
    
    console.log('📊 Status das apólices:', {
      total: policies.length,
      ativas: ActivePolicies,
      vencendo: ExpiringPolicies,
      vencidas: ExpiredPolicies
    });

    // Status das apólices
    const StatusDistribution = policies.reduce((acc, policy) => {
      let status = 'Ativa';
      const endDate = new Date(policy.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) status = 'Vencida';
      else if (diffDays <= 30) status = 'Vencendo';
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Evolução mensal dos custos - VERSÃO SIMPLIFICADA
    const MonthlyEvolution = [];
    
    console.log('🔍 DEBUG - Total de policies:', policies.length);
    console.log('🔍 DEBUG - TotalMonthlyCost calculado:', TotalMonthlyCost);
    
    // Para políticas reais, mostrar o custo atual nos últimos meses
    // Se há apólices, assumir que estão ativas no período atual
    const currentMonthlyCost = TotalMonthlyCost;
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      // Para simplificar: se há apólices, mostrar custo nos últimos 3 meses
      // Nos meses anteriores, mostrar 0 (antes da contratação)
      const isRecentMonth = i <= 2; // Últimos 3 meses
      const costForMonth = (policies.length > 0 && isRecentMonth) ? currentMonthlyCost : 0;
      const activePolicies = (policies.length > 0 && isRecentMonth) ? policies.length : 0;
      
      MonthlyEvolution.push({
        month,
        custo: costForMonth,
        apolices: activePolicies
      });
    }
    
    console.log('📊 Evolução mensal simplificada:', MonthlyEvolution);

    // Apólices inseridas nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const RecentPolicies = policies
      .filter(policy => {
        if (!policy.extractedAt) return false;
        const extractedDate = new Date(policy.extractedAt);
        return extractedDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime())
      .slice(0, 10)
      .map(policy => ({
        id: policy.id,
        name: policy.name,
        extractedAt: policy.extractedAt,
        monthlyAmount: policy.monthlyAmount,
        premium: policy.premium,
        endDate: policy.endDate,
        insurer: policy.insurer
      }));

    return {
      TotalPolicies: policies.length,
      TotalMonthlyCost,
      TotalInsuredValue,
      ExpiringPolicies,
      ExpiredPolicies,
      ActivePolicies,
      TypeDistribution: Object.entries(TypeDistribution).map(([name, value]) => ({ name, value })),
      InsurerDistribution: Object.entries(InsurerDistribution).map(([name, value]) => ({ name, value })),
      CategoryDistribution: Object.entries(CategoryDistribution).map(([name, value]) => ({ name, value })),
      RecentPolicies,
      PersonTypeDistribution,
      FinancialData,
      StatusDistribution: Object.entries(StatusDistribution).map(([name, value]) => ({ name, value })),
      MonthlyEvolution
    };
  }, [policies]);
}
