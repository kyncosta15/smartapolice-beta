import React from 'react';
import { safeString, validateNoObjects } from './safeDataRenderer';

/**
 * VERSÃO REFATORADA - SISTEMA SUPER SEGURO DE RENDERIZAÇÃO
 * Garante que NUNCA um objeto seja renderizado no React
 */

/**
 * Função principal para renderização segura no React
 */
export function renderValue(value: any): React.ReactNode {
  // Validação preventiva
  if (!validateNoObjects(value)) {
    console.error('TENTATIVA DE RENDERIZAR OBJETO DETECTADA:', value);
    return "Erro: Objeto detectado";
  }

  const safeValue = safeString(value);
  
  // Garantir que retornamos apenas string, número ou null
  if (safeValue === 'Não informado' || safeValue === '') {
    return "-";
  }
  
  return safeValue;
}

/**
 * Versão que sempre retorna string
 */
export function renderValueAsString(value: any): string {
  const safeValue = safeString(value);
  return safeValue === 'Não informado' ? '' : safeValue;
}

/**
 * Renderiza lista de coberturas
 */
export function renderCoverageList(coverages: any): React.ReactNode {
  if (!coverages) return "-";

  const safeValue = safeString(coverages);
  
  if (safeValue === 'Não informado') return "-";

  // Se é uma string com vírgulas, transformar em lista
  if (safeValue.includes(',')) {
    const items = safeValue.split(',').map(item => item.trim());
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">
            <span className="font-medium">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return safeValue;
}

/**
 * Renderiza dados financeiros
 */
export function renderCurrency(value: any): React.ReactNode {
  if (value == null || value === undefined) return "R$ 0,00";

  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
  
  if (isNaN(numericValue)) return "R$ 0,00";

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
}

/**
 * Hook para renderização segura de dados de política
 */
export function useSafeRenderPolicy(policy: any) {
  if (!policy) {
    return {
      name: '-',
      insurer: '-',
      policyNumber: '-',
      type: '-',
      monthlyAmount: 'R$ 0,00',
      premium: 'R$ 0,00',
      coverages: '-',
      startDate: '-',
      endDate: '-'
    };
  }

  // Converter tudo para strings seguras
  return {
    name: renderValueAsString(policy.name || policy.segurado),
    insurer: renderValueAsString(policy.insurer || policy.seguradora),
    policyNumber: renderValueAsString(policy.policyNumber || policy.numero_apolice),
    type: renderValueAsString(policy.type || policy.tipo),
    monthlyAmount: renderCurrency(policy.monthlyAmount || policy.custo_mensal),
    premium: renderCurrency(policy.premium || policy.valor_premio),
    coverages: renderValueAsString(policy.coberturas || policy.coverage),
    startDate: policy.startDate ? new Date(policy.startDate).toLocaleDateString('pt-BR') : "-",
    endDate: policy.endDate ? new Date(policy.endDate).toLocaleDateString('pt-BR') : "-"
  };
}

/**
 * Função de emergência para limpar qualquer objeto antes da renderização
 */
export function emergencyCleanForRender(data: any): string {
  try {
    const cleaned = safeString(data);
    if (typeof cleaned === 'object') {
      console.error('EMERGÊNCIA: Objeto ainda presente após limpeza:', cleaned);
      return 'Erro de renderização';
    }
    return cleaned;
  } catch (error) {
    console.error('EMERGÊNCIA: Erro na limpeza:', error);
    return 'Erro crítico';
  }
}