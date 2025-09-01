
import { ParsedPolicyData } from './policyDataParser';
import { extractFieldValue, extractNumericValue } from './extractFieldValue';

/**
 * Mapeador ultra-robusto para dados de políticas que elimina completamente erros de objetos inválidos
 */
export class PolicyDataMapper {
  /**
   * Extrai o nome da seguradora de forma 100% segura
   */
  static getInsurerName(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getInsurerName: policy é null/undefined');
      return 'Seguradora Não Informada';
    }

    // Tentar múltiplas propriedades possíveis com extractFieldValue
    const possibleFields = [
      policy.insurer,
      (policy as any).seguradora,
      policy.entity,
      (policy as any).empresa
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== 'Não informado' && value !== '' && value !== 'undefined' && value !== 'null') {
          return String(value).trim();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair campo da seguradora:', error);
        continue;
      }
    }

    return 'Seguradora Não Informada';
  }

  /**
   * Extrai o tipo de documento de forma 100% segura
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
          const upperValue = String(value).toUpperCase().trim();
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
        const numbersOnly = String(documento).replace(/\D/g, '');
        if (numbersOnly.length === 11) return 'CPF';
        if (numbersOnly.length === 14) return 'CNPJ';
      }
    } catch (error) {
      console.warn('⚠️ Erro ao inferir tipo de documento:', error);
    }

    return null;
  }

  /**
   * Extrai o nome do segurado de forma 100% segura
   */
  static getInsuredName(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getInsuredName: policy é null/undefined');
      return 'Nome não informado';
    }

    const possibleFields = [
      policy.name,
      policy.insuredName,
      (policy as any).segurado,
      (policy as any).nome
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== 'Não informado' && value !== '' && value !== 'undefined' && value !== 'null') {
          return String(value).trim();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair nome do segurado:', error);
        continue;
      }
    }

    return 'Nome não informado';
  }

  /**
   * Extrai o valor mensal de forma 100% segura
   */
  static getMonthlyAmount(policy: ParsedPolicyData): number {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getMonthlyAmount: policy é null/undefined');
      return 0;
    }

    const possibleFields = [
      policy.monthlyAmount,
      (policy as any).custo_mensal,
      policy.premium,
      (policy as any).valor_mensal
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
   * Extrai o status de forma 100% segura
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
        if (value && value !== '' && value !== 'undefined' && value !== 'null') {
          return String(value).trim().toLowerCase();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair status:', error);
        continue;
      }
    }

    return 'vigente';
  }

  /**
   * Extrai o tipo de seguro de forma 100% segura
   */
  static getPolicyType(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getPolicyType: policy é null/undefined');
      return 'auto';
    }

    const possibleFields = [
      policy.type,
      (policy as any).tipo_seguro,
      policy.category,
      (policy as any).categoria
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== '' && value !== 'undefined' && value !== 'null') {
          return String(value).trim().toLowerCase();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair tipo de seguro:', error);
        continue;
      }
    }

    return 'auto';
  }

  /**
   * Extrai o número da apólice de forma 100% segura
   */
  static getPolicyNumber(policy: ParsedPolicyData): string {
    if (!policy) {
      console.warn('⚠️ PolicyDataMapper.getPolicyNumber: policy é null/undefined');
      return 'N/A';
    }

    const possibleFields = [
      policy.policyNumber,
      (policy as any).numero_apolice,
      (policy as any).policy_number
    ];

    for (const field of possibleFields) {
      try {
        const value = extractFieldValue(field);
        if (value && value !== '' && value !== 'undefined' && value !== 'null') {
          return String(value).trim();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao extrair número da apólice:', error);
        continue;
      }
    }

    return 'N/A';
  }

  /**
   * Mapeia dados para uso em gráficos de forma 100% segura
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
        id: String(policy.id || 'unknown'),
        name: this.getInsuredName(policy),
        insurer: this.getInsurerName(policy),
        monthlyAmount: this.getMonthlyAmount(policy),
        documentType: this.getDocumentType(policy),
        status: this.getStatus(policy),
        type: this.getPolicyType(policy),
        policyNumber: this.getPolicyNumber(policy),
        startDate: extractFieldValue(policy.startDate) || '',
        endDate: extractFieldValue(policy.endDate) || '',
        extractedAt: extractFieldValue(policy.extractedAt) || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro crítico no mapeamento para gráfico:', error);
      return {
        id: String(policy.id || 'error'),
        name: 'Erro no Mapeamento',
        insurer: 'Erro',
        monthlyAmount: 0,
        documentType: null,
        status: 'erro',
        type: 'unknown',
        policyNumber: 'N/A',
        startDate: '',
        endDate: '',
        extractedAt: new Date().toISOString()
      };
    }
  }
}
