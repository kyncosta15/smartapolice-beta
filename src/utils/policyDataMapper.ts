
import { ParsedPolicyData } from './policyDataParser';
import { extractFieldValue, extractNumericValue } from './extractFieldValue';

/**
 * Mapeador robusto para dados de políticas que elimina erros de propriedades inexistentes
 */
export class PolicyDataMapper {
  /**
   * Extrai o nome da seguradora de forma segura
   */
  static getInsurerName(policy: ParsedPolicyData): string {
    // Tentar múltiplas propriedades possíveis
    const possibleFields = [
      policy.insurer,
      (policy as any).seguradora, // Cast seguro para acessar propriedade N8N
      policy.entity
    ];

    for (const field of possibleFields) {
      const value = extractFieldValue(field);
      if (value && value !== 'Não informado' && value !== '') {
        return value;
      }
    }

    return 'Seguradora Não Informada';
  }

  /**
   * Extrai o tipo de documento de forma segura
   */
  static getDocumentType(policy: ParsedPolicyData): 'CPF' | 'CNPJ' | null {
    const possibleFields = [
      policy.documento_tipo,
      (policy as any).document_type,
      policy.documento
    ];

    for (const field of possibleFields) {
      const value = extractFieldValue(field);
      if (value) {
        const upperValue = value.toUpperCase();
        if (upperValue === 'CPF' || upperValue === 'CNPJ') {
          return upperValue as 'CPF' | 'CNPJ';
        }
      }
    }

    // Fallback: inferir pelo documento se disponível
    const documento = extractFieldValue(policy.documento);
    if (documento) {
      const numbersOnly = documento.replace(/\D/g, '');
      if (numbersOnly.length === 11) return 'CPF';
      if (numbersOnly.length === 14) return 'CNPJ';
    }

    return null;
  }

  /**
   * Extrai o nome do segurado de forma segura
   */
  static getInsuredName(policy: ParsedPolicyData): string {
    const possibleFields = [
      policy.name,
      policy.insuredName,
      (policy as any).segurado
    ];

    for (const field of possibleFields) {
      const value = extractFieldValue(field);
      if (value && value !== 'Não informado' && value !== '') {
        return value;
      }
    }

    return 'Nome não informado';
  }

  /**
   * Extrai o valor mensal de forma segura
   */
  static getMonthlyAmount(policy: ParsedPolicyData): number {
    const possibleFields = [
      policy.monthlyAmount,
      (policy as any).custo_mensal,
      policy.premium
    ];

    for (const field of possibleFields) {
      const value = extractNumericValue(field);
      if (value > 0) {
        return value;
      }
    }

    return 0;
  }

  /**
   * Extrai o status de forma segura
   */
  static getStatus(policy: ParsedPolicyData): string {
    const possibleFields = [
      policy.status,
      policy.policyStatus,
      (policy as any).statusApolice
    ];

    for (const field of possibleFields) {
      const value = extractFieldValue(field);
      if (value && value !== '') {
        return value;
      }
    }

    return 'vigente';
  }

  /**
   * Mapeia dados para uso em gráficos de forma segura
   */
  static mapForChart(policy: ParsedPolicyData) {
    return {
      id: policy.id,
      name: this.getInsuredName(policy),
      insurer: this.getInsurerName(policy),
      monthlyAmount: this.getMonthlyAmount(policy),
      documentType: this.getDocumentType(policy),
      status: this.getStatus(policy),
      type: extractFieldValue(policy.type) || 'auto',
      startDate: extractFieldValue(policy.startDate) || '',
      endDate: extractFieldValue(policy.endDate) || '',
      extractedAt: extractFieldValue(policy.extractedAt) || new Date().toISOString()
    };
  }
}
