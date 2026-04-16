import { useMemo, useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { safeString } from '@/utils/safeDataRenderer';
import { extractFieldValue } from '@/utils/extractFieldValue';
import { fetchEndossosTotal } from '@/services/endossosService';

interface DashboardData {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalEndossosValue: number;
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

export const useDashboardCalculations = (policies: ParsedPolicyData[], endossosTotal: number = 0): DashboardData => {
  return useMemo(() => {
    console.log('🔍 Recalculando métricas do dashboard para', policies.length, 'apólices - MODO SUPER SEGURO');
    console.log('💰 Total de endossos recebido:', endossosTotal);
    
    // Função para extrair nome da seguradora de forma SUPER SEGURA
    const getInsurerName = (insurerData: any): string => {
      const extracted = extractFieldValue(insurerData);
      const safeName = safeString(extracted);
      if (safeName && safeName !== 'Não informado') {
        return safeName;
      }
      return 'Seguradora Desconhecida';
    };

    // Calcular métricas básicas - APENAS VIGENTES
    const totalPolicies = policies.filter(policy => {
      const status = policy.status?.toLowerCase();
      return status === 'vigente' || status === 'ativa' || status === 'vencendo';
    }).length;
    
    // Filtrar apenas apólices vigentes para cálculos financeiros
    const activePoliciesForCalc = policies.filter(policy => {
      const status = policy.status?.toLowerCase();
      return status === 'vigente' || status === 'ativa' || status === 'vencendo';
    });
    
    const totalMonthlyCost = activePoliciesForCalc.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    const totalInsuredValue = activePoliciesForCalc.reduce((sum, policy) => sum + (policy.totalCoverage || 0), 0);
    
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

    // Distribuição por seguradora (APENAS VIGENTES) - CONVERSÃO TOTAL PARA STRINGS
    const insurerCounts = activePoliciesForCalc.reduce((acc, policy) => {
      let insurerName = safeString(getInsurerName(policy.insurer));
      
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
      name: safeString(name),
      value,
      percentage: totalMonthlyCost > 0 ? (value / totalMonthlyCost) * 100 : 0
    }));

    // Distribuição por tipo (APENAS VIGENTES) - CONVERSÃO TOTAL PARA STRINGS
    const typeCounts = activePoliciesForCalc.reduce((acc, policy) => {
      // Usar type direto (já normalizado por normalizePolicy com tipo_seguro)
      const typeName = safeString(policy.type || 'Outros');
      acc[typeName] = (acc[typeName] || 0) + (policy.monthlyAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
      name: safeString(name),
      value
    }));

    // Classificação por pessoa física/jurídica - DETECTA AUTOMATICAMENTE (APENAS ATIVAS)
    console.log('🔍 Iniciando classificação de pessoa física/jurídica - DETECÇÃO AUTOMÁTICA (APENAS ATIVAS)...');
    const personTypeDistribution = activePoliciesForCalc.reduce((acc, policy) => {
      const safeName = safeString(policy.name);
      const safeDocumento = safeString(extractFieldValue(policy.documento));
      
      // Remover caracteres não numéricos do documento
      const documentoNumeros = safeDocumento.replace(/[^\d]/g, '');
      
      console.log('📋 Analisando política:', {
        id: policy.id,
        name: safeName,
        documento: safeDocumento,
        documentoNumeros,
        tamanho: documentoNumeros.length
      });
      
      // Verificar se o documento tem conteúdo válido
      if (!documentoNumeros || documentoNumeros === '' || documentoNumeros.length === 0) {
        console.log(`⚠️ Política "${safeName}": documento vazio ou inválido`);
        return acc;
      }
      
      // CPF tem 11 dígitos, CNPJ tem 14 dígitos
      if (documentoNumeros.length === 11) {
        console.log(`✅ Política "${safeName}": classificada como Pessoa Física (CPF com ${documentoNumeros.length} dígitos)`);
        acc.pessoaFisica++;
      } else if (documentoNumeros.length === 14) {
        console.log(`✅ Política "${safeName}": classificada como Pessoa Jurídica (CNPJ com ${documentoNumeros.length} dígitos)`);
        acc.pessoaJuridica++;
      } else {
        console.log(`⚠️ Política "${safeName}": documento com tamanho inválido: ${documentoNumeros.length} dígitos`);
      }
      
      return acc;
    }, { pessoaFisica: 0, pessoaJuridica: 0 });

    console.log('🎯 RESULTADO FINAL da classificação (SUPER SEGURO):', {
      pessoaFisica: personTypeDistribution.pessoaFisica,
      pessoaJuridica: personTypeDistribution.pessoaJuridica,
      total: personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica
    });

    // Evolução mensal (projeção de 12 meses)
    // CORRIGIDO: Distribui custos apenas nos meses com parcelas reais,
    // não ao longo de toda a vigência
    const currentDate = new Date();
    const monthlyEvolution: Array<{ month: string; custo: number; apolices: number }> = [];
    const monthlyCosts: { [key: string]: number } = {};
    const monthlyActiveCount: { [key: string]: number } = {};
    
    console.log('📅 Gerando projeção dinâmica de 12 meses baseada em parcelas reais');
    
    // Gerar chaves dos 12 meses
    const monthKeys: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthKeys.push(key);
      monthlyCosts[key] = 0;
      monthlyActiveCount[key] = 0;
    }
    
    // Para cada apólice, distribuir o custo apenas nos meses onde há parcelas
    policies.forEach(policy => {
      const startDate = new Date(policy.startDate);
      const qtdParcelas = (policy as any).quantidade_parcelas || policy.installments?.length || 1;
      const valorTotal = policy.premium || 0;
      
      if (valorTotal <= 0) return;
      
      const valorParcela = valorTotal / qtdParcelas;
      
      console.log(`💰 ${policy.name}: total=R$${valorTotal}, parcelas=${qtdParcelas}, valor/parcela=R$${valorParcela.toFixed(2)}`);
      
      // Distribuir o custo apenas nos meses das parcelas (a partir do início da vigência)
      for (let i = 0; i < qtdParcelas; i++) {
        const dataParcela = new Date(startDate);
        dataParcela.setMonth(dataParcela.getMonth() + i);
        const key = `${dataParcela.getFullYear()}-${(dataParcela.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (monthlyCosts[key] !== undefined) {
          monthlyCosts[key] += valorParcela;
        }
      }
      
      // Contar apólices ativas por mês (pela vigência)
      monthKeys.forEach(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(policy.endDate);
        if (date >= startDate && date <= endDate) {
          monthlyActiveCount[key]++;
        }
      });
    });
    
    // Montar array final
    monthKeys.forEach(key => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      monthlyEvolution.push({
        month: monthLabel,
        custo: Math.round(monthlyCosts[key] * 100) / 100,
        apolices: monthlyActiveCount[key]
      });
    });

    console.log('📊 Projeção mensal dinâmica gerada:', monthlyEvolution);

    // Recent policies (last 30 days) - CONVERSÃO TOTAL PARA STRINGS
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
        name: safeString(policy.name),
        insurer: safeString(getInsurerName(policy.insurer)),
        premium: policy.premium || 0,
        monthlyAmount: policy.monthlyAmount || 0,
        endDate: safeString(policy.endDate),
        extractedAt: safeString(policy.extractedAt)
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
      totalMonthlyCost: totalMonthlyCost + endossosTotal, // Soma endossos ao prêmio mensal
      totalEndossosValue: endossosTotal,
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

    console.log('📊 Dashboard data final (SUPER SEGURO):', dashboardData);
    console.log('💰 Prêmio mensal com endossos:', totalMonthlyCost, '+', endossosTotal, '=', dashboardData.totalMonthlyCost);
    
    return dashboardData;
  }, [policies, endossosTotal]);
};