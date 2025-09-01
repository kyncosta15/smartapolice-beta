
import React from 'react';

/**
 * Função utilitária para renderização segura de valores no React
 * Previne erros de "Objects are not valid as a React child"
 */
export function renderValue(value: any): React.ReactNode {
  // Valores nulos ou undefined
  if (value == null || value === undefined) {
    return "-";
  }

  // Strings e números são válidos
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  // Arrays - renderizar como lista
  if (Array.isArray(value)) {
    return value.map((v, i) => (
      <span key={i}>
        {renderValue(v)}
        {i < value.length - 1 ? ", " : ""}
      </span>
    ));
  }

  // Objetos - extrair campos conhecidos ou stringify
  if (typeof value === "object") {
    // Estrutura N8N específica - PRIORIDADE ALTA
    if ("empresa" in value && value.empresa) {
      return renderValue(value.empresa);
    }
    if ("categoria" in value && value.categoria) {
      return renderValue(value.categoria);
    }
    if ("cobertura" in value && value.cobertura) {
      return renderValue(value.cobertura);
    }
    if ("entidade" in value && value.entidade) {
      return renderValue(value.entidade);
    }

    // Campos comuns de objetos
    if ("descricao" in value && value.descricao) {
      return renderValue(value.descricao);
    }
    if ("nome" in value && value.nome) {
      return renderValue(value.nome);
    }
    if ("razaoSocial" in value && value.razaoSocial) {
      return renderValue(value.razaoSocial);
    }
    if ("name" in value && value.name) {
      return renderValue(value.name);
    }
    if ("value" in value && value.value) {
      return renderValue(value.value);
    }

    // Se nada foi encontrado, tentar stringify de forma segura
    try {
      const stringified = JSON.stringify(value);
      if (stringified !== "{}") {
        return stringified;
      }
    } catch (error) {
      console.warn("Erro ao stringify objeto:", error);
    }

    return "Objeto complexo";
  }

  // Fallback para outros tipos
  return String(value);
}

/**
 * Renderiza uma lista de coberturas de forma segura
 */
export function renderCoverageList(coverages: any): React.ReactNode {
  if (!coverages) return "-";

  if (Array.isArray(coverages)) {
    if (coverages.length === 0) return "-";

    return (
      <ul className="list-disc list-inside space-y-1">
        {coverages.map((coverage, index) => (
          <li key={coverage?.id ?? index} className="text-sm">
            <span className="font-medium">
              {renderValue(coverage?.descricao || coverage?.nome || coverage)}
            </span>
            {coverage?.lmi && (
              <span className="text-gray-500 ml-2">
                - LMI: {renderValue(coverage.lmi)}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return renderValue(coverages);
}

/**
 * Renderiza dados financeiros de forma segura
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
  return {
    name: renderValue(policy?.name || policy?.segurado),
    insurer: renderValue(policy?.insurer || policy?.seguradora),
    policyNumber: renderValue(policy?.policyNumber || policy?.numero_apolice),
    type: renderValue(policy?.type || policy?.tipo),
    monthlyAmount: renderCurrency(policy?.monthlyAmount || policy?.custo_mensal),
    premium: renderCurrency(policy?.premium || policy?.valor_premio),
    coverages: renderCoverageList(policy?.coberturas || policy?.coverage),
    startDate: policy?.startDate ? new Date(policy.startDate).toLocaleDateString('pt-BR') : "-",
    endDate: policy?.endDate ? new Date(policy.endDate).toLocaleDateString('pt-BR') : "-"
  };
}
