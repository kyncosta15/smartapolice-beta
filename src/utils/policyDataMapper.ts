
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
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getInsurerName: policy é null/undefined');
      return 'Seguradora Não Informada';
    }

    // Tentar múltiplas propriedades possíveis
    const possibleFields = [
      policy.insurer,
      (policy as any).seguradora,
      policy.entity
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== 'Não informado' && value !== '' && value !== 'undefined') {
          return value;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair campo da seguradora:', error);
        continue;
      }
    }

    return 'Seguradora Não Informada';
  }

  /**
   * Extrai o tipo de documento de forma segura
   */
  static getDocumentType(policy: ParsedPolicyData): 'CPF' | 'CNPJ' | null {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getDocumentType: policy é null/undefined');
      return null;
    }

    const possibleFields = [
      policy.documento_tipo,
      (policy as any).document_type,
      policy.documento
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value) {
          const upperValue = value.toUpperCase();
          if (upperValue === 'CPF' || upperValue === 'CNPJ') {
            return upperValue as 'CPF' | 'CNPJ';
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair tipo de documento:', error);
        continue;
      }
    }

    // Fallback: inferir pelo documento se disponível
    try {
      const documento = extractFieldValue(policy.documento);
      if (documento) {
        const numbersOnly = documento.replace(/\D/g, '');
        if (numbersOnly.length === 11) return 'CPF';
        if (numbersOnly.length === 14) return 'CNPJ';
      }
    } catch (error) {
      console.warn('⚠️ Erro ao inferir tipo de documento:', error);
    }

    return null;
  }

  /**
   * Extrai o nome do segurado de forma segura
   */
  static getInsuredName(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getInsuredName: policy é null/undefined');
      return 'Nome não informado';
    }

    const possibleFields = [
      policy.name,
      policy.insuredName,
      (policy as any).segurado
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== 'Não informado' && value !== '' && value !== 'undefined') {
          return value;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair nome do segurado:', error);
        continue;
      }
    }

    return 'Nome não informado';
  }

  /**
   * Extrai o valor mensal de forma segura
   */
  static getMonthlyAmount(policy: ParsedPolicyData): number {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getMonthlyAmount: policy é null/undefined');
      return 0;
    }

    const possibleFields = [
      policy.monthlyAmount,
      (policy as any).custo_mensal,
      policy.premium
    ];

    for (const field of possibleFields) {
      try {
        const value = extractNumericValue(field);
        if (value > 0) {
          return value;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair valor mensal:', error);
        continue;
      }
    }

    return 0;
  }

  /**
   * Extrai o status de forma segura
   */
  static getStatus(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getStatus: policy é null/undefined');
      return 'vigente';
    }

    const possibleFields = [
      policy.status,
      policy.policyStatus,
      (policy as any).statusApolice
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== '' && value !== 'undefined') {
          return value;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair status:', error);
        continue;
      }
    }

    return 'vigente';
  }

  /**
   * Mapeia dados para uso em gráficos de forma segura
   */
  static mapForChart(policy: ParsedPolicyData) {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.mapForChart: policy é null/undefined');
      return {
        id: 'unknown',
        name: 'Política Inválida',
        insurer: 'Não informado',
        monthlyAmount: 0,
        documentType: null,
        status: 'erro',
        type: 'unknown',
        startDate: '',
        endDate: '',
        extractedAt: new Date().toISOString()
      };
    }

    try {
      return {
        id: policy.id || 'unknown',
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
    } catch (error) {
      console.error('❌ Erro crítico no mapeamento para gráfico:', error);
      return {
        id: policy.id || 'error',
        name: 'Erro no Mapeamento',
        insurer: 'Erro',
        monthlyAmount: 0,
        documentType: null,
        status: 'erro',
        type: 'unknown',
        startDate: '',
        endDate: '',
        extractedAt: new Date().toISOString()
      };
    }
  }
}
