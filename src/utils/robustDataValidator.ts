import { ParsedPolicyData } from '@/utils/policyDataParser';

/**
 * VALIDADOR ROBUSTO SEM ALUCINAÇÃO
 * 
 * Princípios:
 * - NUNCA inventar dados que não constam no PDF/integradores
 * - NUNCA remover campos confirmados silenciosamente  
 * - SEMPRE preservar dados existentes se novos não forem encontrados
 * - SEMPRE normalizar dados sem alterar significado
 * - SEMPRE marcar divergências como "pendente de revisão"
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pendingReview: string[];
  normalizedData: Partial<ParsedPolicyData>;
  metadata: {
    sourceReliability: 'high' | 'medium' | 'low';
    extractionQuality: number; // 0-100
    fieldsFound: string[];
    fieldsMissing: string[];
    fieldsNormalized: string[];
  };
}

export interface FieldValidationRule {
  fieldName: string;
  required: boolean;
  normalize?: (value: any) => any;
  validate?: (value: any) => { isValid: boolean; message?: string };
  allowEmpty?: boolean;
}

export class RobustDataValidator {
  
  /**
   * VALIDAÇÃO PRINCIPAL SEM ALUCINAÇÃO
   */
  static validateWithoutHallucination(
    extractedData: any,
    existingData?: Partial<ParsedPolicyData>
  ): ValidationResult {
    console.log('🔍 Iniciando validação robusta sem alucinação');
    console.log('📊 Dados extraídos:', extractedData);
    console.log('📋 Dados existentes:', existingData);

    const errors: string[] = [];
    const warnings: string[] = [];
    const pendingReview: string[] = [];
    const fieldsFound: string[] = [];
    const fieldsMissing: string[] = [];
    const fieldsNormalized: string[] = [];

    // Definir regras de validação rigorosas
    const validationRules = this.getValidationRules();
    
    // Dados normalizados começam com dados existentes (NUNCA sobrescrever silenciosamente)
    const normalizedData: any = {
      ...existingData
    };

    let sourceReliability: 'high' | 'medium' | 'low' = 'high';
    let extractionQuality = 100;

    // Validar cada campo seguindo as regras
    for (const rule of validationRules) {
      const result = this.validateField(
        extractedData, 
        existingData, 
        rule, 
        normalizedData
      );

      // Processar resultado da validação
      if (result.found) {
        fieldsFound.push(rule.fieldName);
        if (result.normalized) {
          fieldsNormalized.push(rule.fieldName);
        }
      } else {
        fieldsMissing.push(rule.fieldName);
        
        if (rule.required && !existingData?.[rule.fieldName as keyof ParsedPolicyData]) {
          errors.push(`Campo obrigatório ausente: ${rule.fieldName}`);
        }
      }

      // Adicionar avisos e pendências
      if (result.warning) {
        warnings.push(result.warning);
      }

      if (result.needsReview) {
        pendingReview.push(result.needsReview);
      }

      // Impacto na qualidade da extração
      if (result.qualityImpact) {
        extractionQuality -= result.qualityImpact;
        if (extractionQuality < 80) sourceReliability = 'medium';
        if (extractionQuality < 60) sourceReliability = 'low';
      }
    }

    // Validações cruzadas (sem inventar dados)
    const crossValidationResult = this.performCrossValidation(normalizedData);
    errors.push(...crossValidationResult.errors);
    warnings.push(...crossValidationResult.warnings);
    pendingReview.push(...crossValidationResult.pendingReview);

    // Log do resultado
    console.log('✅ Validação concluída:', {
      errors: errors.length,
      warnings: warnings.length,
      pendingReview: pendingReview.length,
      sourceReliability,
      extractionQuality: Math.max(0, extractionQuality)
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      pendingReview,
      normalizedData,
      metadata: {
        sourceReliability,
        extractionQuality: Math.max(0, extractionQuality),
        fieldsFound,
        fieldsMissing,
        fieldsNormalized
      }
    };
  }

  /**
   * DEFINIR REGRAS DE VALIDAÇÃO RIGOROSAS
   */
  private static getValidationRules(): FieldValidationRule[] {
    return [
      {
        fieldName: 'insurer',
        required: true,
        normalize: (value) => this.normalizeString(value),
        validate: (value) => ({
          isValid: typeof value === 'string' && value.length >= 3,
          message: 'Seguradora deve ter pelo menos 3 caracteres'
        })
      },
      {
        fieldName: 'policyNumber', 
        required: true,
        normalize: (value) => this.normalizePolicyNumber(value),
        validate: (value) => ({
          isValid: typeof value === 'string' && value.length >= 5,
          message: 'Número da apólice deve ter pelo menos 5 caracteres'
        })
      },
      {
        fieldName: 'name',
        required: true,
        normalize: (value) => this.normalizePersonName(value),
        validate: (value) => ({
          isValid: typeof value === 'string' && value.length >= 3,
          message: 'Nome deve ter pelo menos 3 caracteres'
        })
      },
      {
        fieldName: 'premium',
        required: true,
        normalize: (value) => this.normalizeMonetaryValue(value),
        validate: (value) => ({
          isValid: typeof value === 'number' && value > 0,
          message: 'Prêmio deve ser um valor positivo'
        })
      },
      {
        fieldName: 'monthlyAmount',
        required: false,
        normalize: (value) => this.normalizeMonetaryValue(value),
        validate: (value) => ({
          isValid: !value || (typeof value === 'number' && value > 0),
          message: 'Valor mensal deve ser positivo se informado'
        })
      },
      {
        fieldName: 'startDate',
        required: true,
        normalize: (value) => this.normalizeDate(value),
        validate: (value) => ({
          isValid: this.isValidDate(value),
          message: 'Data de início deve ser uma data válida'
        })
      },
      {
        fieldName: 'endDate',
        required: true,
        normalize: (value) => this.normalizeDate(value),
        validate: (value) => ({
          isValid: this.isValidDate(value),
          message: 'Data de fim deve ser uma data válida'  
        })
      },
      {
        fieldName: 'deductible',
        required: false,
        normalize: (value) => this.normalizeMonetaryValue(value),
        validate: (value) => ({
          isValid: !value || (typeof value === 'number' && value >= 0),
          message: 'Franquia deve ser zero ou positiva'
        }),
        allowEmpty: true
      }
    ];
  }

  /**
   * VALIDAR CAMPO INDIVIDUAL SEM INVENTAR DADOS
   */
  private static validateField(
    extractedData: any,
    existingData: Partial<ParsedPolicyData> | undefined,
    rule: FieldValidationRule,
    normalizedData: Partial<ParsedPolicyData>
  ): {
    found: boolean;
    normalized: boolean;
    warning?: string;
    needsReview?: string;
    qualityImpact?: number;
  } {
    
    // Tentar extrair valor do dado bruto
    const extractedValue = this.extractFieldValue(extractedData, rule.fieldName);
    const existingValue = existingData?.[rule.fieldName as keyof ParsedPolicyData];
    
    let result = {
      found: false,
      normalized: false,
      warning: undefined as string | undefined,
      needsReview: undefined as string | undefined,
      qualityImpact: undefined as number | undefined
    };

    if (extractedValue !== null && extractedValue !== undefined && extractedValue !== '') {
      // Valor encontrado nos dados extraídos
      result.found = true;
      
      let finalValue = extractedValue;
      
      // Normalizar se necessário
      if (rule.normalize) {
        const originalValue = extractedValue;
        finalValue = rule.normalize(extractedValue);
        
        if (originalValue !== finalValue) {
          result.normalized = true;
          console.log(`🔧 Normalizado ${rule.fieldName}: "${originalValue}" → "${finalValue}"`);
        }
      }

      // Validar valor normalizado
      if (rule.validate) {
        const validation = rule.validate(finalValue);
        if (!validation.isValid) {
          result.warning = `${rule.fieldName}: ${validation.message}`;
          result.qualityImpact = 10;
        }
      }

      // Comparar com valor existente (detectar divergências)
      if (existingValue && existingValue !== finalValue) {
        // Divergência detectada - não sobrescrever automaticamente
        result.needsReview = `${rule.fieldName}: divergência entre dados existentes ("${existingValue}") e novos ("${finalValue}")`;
        result.qualityImpact = 15;
        
        // Manter valor existente por segurança
        console.log(`⚠️ Divergência em ${rule.fieldName}, mantendo valor existente`);
        
      } else {
        // Valor consistente ou novo - pode usar
        (normalizedData as any)[rule.fieldName] = finalValue;
      }

    } else if (existingValue) {
      // Não encontrado nos novos dados, mas existe valor anterior
      console.log(`🔄 Mantendo valor existente para ${rule.fieldName}: "${existingValue}"`);
      (normalizedData as any)[rule.fieldName] = existingValue;
      
      if (!rule.allowEmpty) {
        result.needsReview = `${rule.fieldName}: não encontrado nos novos dados, mantido valor anterior`;
        result.qualityImpact = 5;
      }

    } else if (rule.required) {
      // Campo obrigatório não encontrado e sem valor anterior
      result.qualityImpact = 20;
    }

    return result;
  }

  /**
   * EXTRAIR VALOR DO CAMPO DOS DADOS BRUTOS
   */
  private static extractFieldValue(data: any, fieldName: string): any {
    if (!data || typeof data !== 'object') return null;

    // Mapeamentos para diferentes formatos de dados
    const fieldMappings: { [key: string]: string[] } = {
      'insurer': ['seguradora', 'seguradora_empresa', 'empresa', 'insurer'],
      'policyNumber': ['numero_apolice', 'apolice', 'policy_number', 'policyNumber'],
      'name': ['segurado', 'nome', 'name', 'insuredName'],
      'premium': ['premio', 'valor_premio', 'premium', 'valor_total'],
      'monthlyAmount': ['custo_mensal', 'valor_mensal', 'monthlyAmount', 'valor_parcela'],
      'startDate': ['inicio', 'inicio_vigencia', 'startDate', 'data_inicio'],
      'endDate': ['fim', 'fim_vigencia', 'endDate', 'data_fim'],
      'deductible': ['franquia', 'deductible']
    };

    const possibleKeys = fieldMappings[fieldName] || [fieldName];

    // Buscar em diferentes níveis da estrutura
    for (const key of possibleKeys) {
      // Nível direto
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        return data[key];
      }

      // Dentro de objetos aninhados
      if (data.informacoes_gerais?.[key] !== undefined) {
        return data.informacoes_gerais[key];
      }

      if (data.seguradora?.[key] !== undefined) {
        return data.seguradora[key];
      }

      if (data.informacoes_financeiras?.[key] !== undefined) {
        return data.informacoes_financeiras[key];
      }

      if (data.vigencia?.[key] !== undefined) {
        return data.vigencia[key];
      }
    }

    return null;
  }

  /**
   * VALIDAÇÕES CRUZADAS SEM INVENTAR DADOS
   */
  private static performCrossValidation(data: Partial<ParsedPolicyData>): {
    errors: string[];
    warnings: string[];
    pendingReview: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const pendingReview: string[] = [];

    // Validar coerência de datas
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (end <= start) {
        errors.push('Data de fim deve ser posterior à data de início');
      }
      
      const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 2) {
        warnings.push('Vigência superior a 2 anos é incomum');
      }
    }

    // Validar coerência financeira
    if (data.premium && data.monthlyAmount) {
      const expectedMonthly = data.premium / 12;
      const tolerance = expectedMonthly * 0.20; // 20% tolerância
      
      if (Math.abs(data.monthlyAmount - expectedMonthly) > tolerance) {
        pendingReview.push(`Valor mensal (${data.monthlyAmount}) inconsistente com prêmio anual (${data.premium})`);
      }
    }

    // Validar franquia vs prêmio
    if (data.deductible && data.premium && data.deductible > data.premium) {
      warnings.push('Franquia superior ao prêmio anual');
    }

    return { errors, warnings, pendingReview };
  }

  // MÉTODOS DE NORMALIZAÇÃO SEGUROS

  private static normalizeString(value: any): string | null {
    if (!value) return null;
    
    const str = String(value).trim();
    return str.length > 0 ? str.toUpperCase() : null;
  }

  private static normalizePersonName(value: any): string | null {
    if (!value) return null;
    
    const name = String(value).trim();
    if (name.length < 3) return null;
    
    // Capitalizar adequadamente
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  private static normalizePolicyNumber(value: any): string | null {
    if (!value) return null;
    
    const policyNum = String(value).trim();
    return policyNum.length >= 5 ? policyNum : null;
  }

  private static normalizeMonetaryValue(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'number') {
      return value > 0 ? Math.round(value * 100) / 100 : null;
    }
    
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return !isNaN(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
    }
    
    return null;
  }

  private static normalizeDate(value: any): string | null {
    if (!value) return null;
    
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
  }

  private static isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}