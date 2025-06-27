
export interface DocumentInfo {
  type: 'CPF' | 'CNPJ' | 'INVALID';
  personType: 'PF' | 'PJ' | 'UNKNOWN';
  rawValue: string;
  cleanValue: string;
  isValid: boolean;
  formatted: string;
}

export class DocumentValidator {
  // RegEx permissivo para capturar possíveis CPF/CNPJ
  private static readonly DOCUMENT_REGEX = /(\d{2,3}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s\/]?\d{4}[\-\s]?\d{2}|\d{11,14})/g;

  static detectDocument(text: string): DocumentInfo | null {
    console.log('🔍 Procurando CPF/CNPJ no texto...');
    
    const matches = text.match(this.DOCUMENT_REGEX);
    if (!matches || matches.length === 0) {
      console.log('❌ Nenhum documento encontrado');
      return null;
    }

    // Processar todas as correspondências e retornar a primeira válida
    for (const match of matches) {
      const docInfo = this.processDocument(match);
      if (docInfo.type !== 'INVALID') {
        console.log(`✅ Documento detectado: ${docInfo.type} (${docInfo.personType})`, docInfo);
        return docInfo;
      }
    }

    console.log('❌ Nenhum documento válido encontrado');
    return null;
  }

  private static processDocument(rawValue: string): DocumentInfo {
    // Etapa 1: Capturar o valor bruto
    const cleanValue = this.cleanDocument(rawValue);
    
    // Etapa 2: Verificar tamanho
    const docType = this.getDocumentType(cleanValue);
    
    // Etapa 3: Validar dígitos (opcional mas recomendado)
    const isValid = this.validateDocument(cleanValue, docType);
    
    // Etapa 4: Formatar o documento
    const formatted = this.formatDocument(cleanValue, docType);

    return {
      type: docType,
      personType: docType === 'CPF' ? 'PF' : docType === 'CNPJ' ? 'PJ' : 'UNKNOWN',
      rawValue,
      cleanValue,
      isValid,
      formatted
    };
  }

  // Etapa 2: Remover todos os separadores
  private static cleanDocument(document: string): string {
    return document.replace(/[^\d]/g, '');
  }

  // Etapa 3: Verificar tamanho para determinar tipo
  private static getDocumentType(cleanDocument: string): 'CPF' | 'CNPJ' | 'INVALID' {
    const length = cleanDocument.length;
    
    if (length === 11) {
      return 'CPF';
    } else if (length === 14) {
      return 'CNPJ';
    } else {
      return 'INVALID';
    }
  }

  // Etapa 4: Validação de dígitos verificadores
  private static validateDocument(cleanDocument: string, type: 'CPF' | 'CNPJ' | 'INVALID'): boolean {
    if (type === 'INVALID') return false;
    
    if (type === 'CPF') {
      return this.validateCPF(cleanDocument);
    } else if (type === 'CNPJ') {
      return this.validateCNPJ(cleanDocument);
    }
    
    return false;
  }

  // Validação de CPF
  private static validateCPF(cpf: string): boolean {
    // Verificar se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Calcular primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    // Calcular segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  // Validação de CNPJ
  private static validateCNPJ(cnpj: string): boolean {
    // Verificar se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Calcular primeiro dígito verificador
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = (weight === 9) ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (firstDigit !== parseInt(cnpj.charAt(12))) return false;

    // Calcular segundo dígito verificador
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = (weight === 9) ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    if (secondDigit !== parseInt(cnpj.charAt(13))) return false;

    return true;
  }

  // Formatação do documento
  private static formatDocument(cleanDocument: string, type: 'CPF' | 'CNPJ' | 'INVALID'): string {
    if (type === 'CPF' && cleanDocument.length === 11) {
      return cleanDocument.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'CNPJ' && cleanDocument.length === 14) {
      return cleanDocument.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cleanDocument;
  }

  // Método auxiliar para verificar se é pessoa física ou jurídica
  static getPersonType(document: string): 'PF' | 'PJ' | 'UNKNOWN' {
    const docInfo = this.detectDocument(document);
    return docInfo?.personType || 'UNKNOWN';
  }
}
