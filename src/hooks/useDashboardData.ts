import { useState, useEffect, useMemo } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { normalizePolicy } from '@/lib/policies';

interface DashboardMetrics {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  totalInstallments: number;
  insurerDistribution: Array<{ name: string; value: number; percentage: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; cost: number }>;
  insights: Array<{ type: string; category: string; message: string }>;
  // Novas métricas para pessoa física/jurídica
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
  // Nova métrica para renovadas vs não renovadas
  renewalDistribution: {
    renovadas: number;
    naoRenovadas: number;
  };
}

export function useDashboardData(policies: ParsedPolicyData[]) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const dashboardData = useMemo((): DashboardMetrics => {
    if (!policies || policies.length === 0) {
      return {
        totalPolicies: 0,
        totalMonthlyCost: 0,
        totalInsuredValue: 0,
        expiringPolicies: 0,
        totalInstallments: 0,
        insurerDistribution: [],
        typeDistribution: [],
        monthlyEvolution: [],
        insights: [],
        personTypeDistribution: {
          pessoaFisica: 0,
          pessoaJuridica: 0
        },
        renewalDistribution: {
          renovadas: 0,
          naoRenovadas: 0
        }
      };
    }

    console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices');

    // Normalize all policies first to ensure safe data handling
    const normalizedPolicies = policies.map(normalizePolicy);

    // Contar apenas apólices vigentes no total
    const totalPolicies = normalizedPolicies.filter(p => {
      const status = p.status?.toLowerCase();
      return status === 'vigente' || status === 'ativa' || status === 'vencendo';
    }).length;
    
    // Filtrar apenas apólices vigentes para cálculos financeiros
    const activePolicies = normalizedPolicies.filter(p => {
      const status = p.status?.toLowerCase();
      return status === 'vigente' || status === 'ativa' || status === 'vencendo';
    });
    
    console.log(`📊 [useDashboardData] Total: ${totalPolicies} apólices, Vigentes: ${activePolicies.length} apólices`);
    
    // LOG DETALHADO: Mostrar cada apólice vigente e seu valor mensal
    console.log('💰 [useDashboardData] Calculando totalMonthlyCost APENAS com apólices vigentes:');
    activePolicies.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name}: R$ ${p.monthlyAmount?.toFixed(2) || '0.00'} (status: ${p.status})`);
    });
    
    const totalMonthlyCost = activePolicies.reduce((sum, p) => {
      const value = p.monthlyAmount || 0;
      console.log(`    Somando ${p.name}: ${value} (acumulado: ${sum + value})`);
      return sum + value;
    }, 0);
    
    console.log(`💰 [useDashboardData] TOTAL FINAL (só vigentes): R$ ${totalMonthlyCost.toFixed(2)}`);
    
    const totalInsuredValue = activePolicies.reduce((sum, p) => sum + (p.totalCoverage || p.premium || 0), 0);
    
    // Calcular apólices vencendo nos próximos 30 dias
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPolicies = normalizedPolicies.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate <= thirtyDaysFromNow && endDate >= new Date();
    }).length;

    // Calcular total de parcelas - corrigindo o erro TypeScript
    const totalInstallments = normalizedPolicies.reduce((sum, p) => {
      const installmentCount = Array.isArray(p.installments) 
        ? p.installments.length 
        : (typeof p.installments === 'number' ? p.installments : 12);
      return sum + installmentCount;
    }, 0);

    // Distribuição por seguradora (APENAS VIGENTES)
    const insurerCounts = activePolicies.reduce((acc, policy: any) => {
      // Use normalized data which has safe string values
      let insurerName = policy.seguradoraEmpresa || policy.seguradora || 'Não informado';
      
      // Normalizar nomes de seguradoras para melhor exibição
      insurerName = insurerName
        .replace(/CIA DE SEGUROS GERAIS/gi, '')
        .replace(/COMPANHIA DE SEGUROS/gi, '')
        .replace(/SEGUROS S\.?A\.?/gi, 'Seguros')
        .replace(/SEGURADORA/gi, '')
        .trim();
      
      acc[insurerName] = (acc[insurerName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const insurerDistribution = Object.entries(insurerCounts).map(([name, value]) => ({
      name,
      value: Math.round(Number(value) || 0),
      percentage: totalMonthlyCost > 0 ? Math.round((Number(value) / totalMonthlyCost) * 100) : 0
    }));

    // Distribuição por tipo (APENAS VIGENTES)
    const typeCounts = activePolicies.reduce((acc, policy: any) => {
      // Usar tipo_seguro direto do banco (já normalizado por normalizePolicy)
      const typeName = policy.tipoCategoria || policy.tipo_seguro || policy.type || 'Outros';
      acc[typeName] = (acc[typeName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value: Math.round(Number(value) || 0)
    }));

    // 🚨 LÓGICA CORRIGIDA - Distribuição pessoa física/jurídica - DETECÇÃO AUTOMÁTICA (APENAS ATIVAS)
    console.log('🔍 Iniciando classificação de pessoa física/jurídica - DETECÇÃO AUTOMÁTICA (APENAS ATIVAS)...');
    
    const personTypeDistribution = activePolicies.reduce((acc, policy) => {
      // Função para extrair valor do campo do N8N
      const extractValue = (field: any): string | null => {
        if (!field) return null;
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field.value) return field.value;
        return null;
      };

      // Extrair o valor do documento
      const documento = extractValue(policy.documento);
      
      if (!documento) {
        console.log(`⚠️ Política "${policy.name}": campo documento não encontrado`);
        return acc;
      }

      // Remover caracteres não numéricos do documento
      const documentoNumeros = documento.replace(/[^\d]/g, '');
      
      console.log('📋 Analisando política:', {
        id: policy.id,
        name: policy.name,
        documento: documento,
        documentoNumeros,
        tamanho: documentoNumeros.length
      });
      
      // CPF tem 11 dígitos, CNPJ tem 14 dígitos
      if (documentoNumeros.length === 11) {
        acc.pessoaFisica++;
        console.log(`✅ PESSOA FÍSICA incrementada (CPF com ${documentoNumeros.length} dígitos)`);
      } else if (documentoNumeros.length === 14) {
        acc.pessoaJuridica++;
        console.log(`✅ PESSOA JURÍDICA incrementada (CNPJ com ${documentoNumeros.length} dígitos)`);
      } else {
        console.log(`⚠️ Documento com tamanho inválido: ${documentoNumeros.length} dígitos`);
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da classificação:', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Distribuição por status (vigentes vs antigas) - BASEADO NO STATUS
    console.log('🔄 Iniciando análise de status (vigentes vs antigas)...');
    
    const renewalDistribution = normalizedPolicies.reduce((acc, policy: any) => {
      const status = policy.status?.toLowerCase();
      
      console.log(`📋 "${policy.name}": status = ${status}`);

      // Vigentes: status vigente, ativa ou vencendo
      // Antigas: todas as demais (não renovadas, vencidas, canceladas, etc.)
      if (status === 'vigente' || status === 'ativa' || status === 'vencendo') {
        acc.renovadas++;
        console.log('✅ VIGENTE');
      } else {
        acc.naoRenovadas++;
        console.log('❌ ANTIGA (não renovada)');
      }
      
      return acc;
    }, { renovadas: 0, naoRenovadas: 0 });

    console.log('🔄 Distribuição FINAL (Vigentes/Antigas):', renewalDistribution);

    // Evolução mensal - PROJEÇÃO DINÂMICA DE 12 MESES A PARTIR DO MÊS ATUAL
    const monthlyEvolution = generateMonthlyEvolution(normalizedPolicies);

    // Insights
    const insights = generateBasicInsights(normalizedPolicies);

    const result = {
      totalPolicies,
      totalMonthlyCost,
      totalInsuredValue,
      expiringPolicies,
      totalInstallments,
      insurerDistribution,
      typeDistribution,
      monthlyEvolution,
      insights,
      personTypeDistribution,
      renewalDistribution
    };

    console.log('📊 Dashboard data final:', result);
    return result;
  }, [policies]);

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    console.log('Atualizando dashboard...');
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLastUpdate(new Date());
    setIsRefreshing(false);
    console.log('Dashboard atualizado:', new Date().toLocaleTimeString());
  };

  useEffect(() => {
    if (policies.length > 0) {
      setLastUpdate(new Date());
    }
  }, [policies.length]);

  return {
    dashboardData,
    isRefreshing,
    lastUpdate,
    refreshDashboard
  };
}

function generateMonthlyEvolution(policies: ParsedPolicyData[]) {
  const monthlyMap: { [key: string]: number } = {};
  const now = new Date();
  
  // PROJEÇÃO DINÂMICA: 12 meses a partir do mês atual
  console.log('📅 Gerando projeção dinâmica de 12 meses a partir de:', now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    monthlyMap[key] = 0;
    
    console.log(`📆 Mês ${i + 1}: ${key}`);
  }

  // Distribui custos mensais para os próximos 12 meses
  policies.forEach(policy => {
    const monthlyCost = policy.monthlyAmount || 0;
    Object.keys(monthlyMap).forEach(month => {
      monthlyMap[month] += monthlyCost;
    });
  });

  const result = Object.entries(monthlyMap).map(([month, cost]) => ({
    month,
    cost: Math.round(cost)
  }));

  console.log('📊 Projeção mensal dinâmica gerada:', result);
  return result;
}

function generateBasicInsights(policies: ParsedPolicyData[]) {
  const insights: Array<{ type: string; category: string; message: string }> = [];

  if (policies.length === 0) {
    insights.push({
      type: 'info',
      category: 'Início',
      message: 'Faça upload de PDFs de apólices para começar a análise.'
    });
    return insights;
  }

  const avgCost = policies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0) / policies.length;
  const highCostPolicies = policies.filter(p => (p.monthlyAmount || 0) > avgCost * 1.5);

  if (highCostPolicies.length > 0) {
    insights.push({
      type: 'warning',
      category: 'Alto Custo',
      message: `${highCostPolicies.length} apólice(s) com custo acima da média. Considere renegociar.`
    });
  }

  if (policies.length > 3) {
    insights.push({
      type: 'info',
      category: 'Portfolio',
      message: `Portfolio bem diversificado com ${policies.length} apólices ativas.`
    });
  }

  // Insight sobre parcelas - corrigindo o erro TypeScript
  const totalInstallments = policies.reduce((sum, p) => {
    const installmentCount = Array.isArray(p.installments) 
      ? p.installments.length 
      : (typeof p.installments === 'number' ? p.installments : 12);
    return sum + installmentCount;
  }, 0);
  
  insights.push({
    type: 'info',
    category: 'Parcelas',
    message: `Total de ${totalInstallments} parcelas distribuídas em suas apólices.`
  });

  return insights;
}
