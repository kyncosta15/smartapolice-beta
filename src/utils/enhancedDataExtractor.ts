import { EXTRACTION_PATTERNS, INSURANCE_COMPANIES_LIST, INSURER_SPECIFIC_PATTERNS } from './extractionPatterns';
import { DynamicPDFData } from '@/types/pdfUpload';

export interface ExtractedInstallment {
  data: string;
  valor: number;
  numero: number;
}

export interface EnhancedExtractedData {
  nomeSegurado: string;
  cpf: string;
  apolice: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  premioTotal: number;
  parcelas: ExtractedInstallment[];
  parcelasTotais: number;
  valorMensal: number;
  veiculo: string;
  placa: string;
  fipe: string;
  tipoCobertura: string;
  seguradora: string;
}

export class EnhancedDataExtractor {
  static extractFromText(text: string): EnhancedExtractedData {
    console.log('🔍 Iniciando extração precisa de dados...');
    
    // Normalizar e limpar o texto para melhor processamento
    const normalizedText = this.normalizeText(text);
    
    // Primeiro, identificar a seguradora para usar padrões específicos
    const detectedInsurer = this.detectInsuranceCompany(normalizedText);
    console.log(`🏢 Seguradora detectada: ${detectedInsurer}`);
    
    const extractedData: EnhancedExtractedData = {
      seguradora: detectedInsurer,
      nomeSegurado: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.insuredName, "Nome não identificado"),
      cpf: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.cpfCnpj, ""),
      apolice: this.extractPolicyNumber(normalizedText, detectedInsurer),
      vigenciaInicio: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.startDate, this.generateStartDate(), this.convertDateFormat),
      vigenciaFim: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.endDate, this.generateEndDate(), this.convertDateFormat),
      premioTotal: this.extractTotalPremium(normalizedText, detectedInsurer),
      parcelas: this.extractInstallments(normalizedText, detectedInsurer),
      parcelasTotais: this.extractNumberOfInstallments(normalizedText),
      valorMensal: 0, // Será calculado depois
      veiculo: this.extractVehicleInfo(normalizedText),
      placa: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.licensePlate, ""),
      fipe: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.fipeCode, ""),
      tipoCobertura: this.extractWithMultiplePatterns(normalizedText, EXTRACTION_PATTERNS.coverageType, "BÁSICA")
    };

    // Cálculo preciso do valor mensal
    extractedData.valorMensal = this.calculateMonthlyValue(extractedData);
    
    // Validação cruzada e correção de inconsistências
    const validatedData = this.validateAndCorrectData(extractedData);
    
    console.log('📊 Dados extraídos com precisão:', validatedData);
    return validatedData;
  }

  private static extractNumberOfInstallments(text: string): number {
    for (const pattern of EXTRACTION_PATTERNS.numberOfInstallments) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1].trim());
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    return 12; // valor padrão
  }

  private static normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static detectInsuranceCompany(text: string): string {
    const textLower = text.toLowerCase();
    
    // Busca por cabeçalhos e seções específicas primeiro
    const headerSections = [
      textLower.substring(0, 500), // Cabeçalho
      ...textLower.match(/emitido\s+por\s+([^\n.]{5,100})/gi) || [],
      ...textLower.match(/dados\s+do\s+corretor[^]*?([a-z\s&.-]{10,150})/gi) || []
    ];

    for (const section of headerSections) {
      for (const company of INSURANCE_COMPANIES_LIST) {
        const companyLower = company.toLowerCase();
        
        // Verificação exata
        if (section.includes(companyLower)) {
          console.log(`✅ Seguradora detectada (exata): ${company}`);
          return company;
        }
        
        // Verificação por palavras-chave principais
        const keywords = companyLower.split(' ').filter(word => word.length > 3);
        const matchCount = keywords.filter(keyword => section.includes(keyword)).length;
        
        if (matchCount >= Math.ceil(keywords.length * 0.7)) {
          console.log(`✅ Seguradora detectada (palavras-chave): ${company}`);
          return company;
        }
      }
    }
    
    return "Seguradora não identificada";
  }

  private static extractWithMultiplePatterns<T>(
    text: string, 
    patterns: RegExp[], 
    defaultValue: T, 
    transformer?: (value: string) => T
  ): T {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        if (value && value.length > 0) {
          return transformer ? transformer(value) : value as T;
        }
      }
    }
    return defaultValue;
  }

  private static extractPolicyNumber(text: string, insurer: string): string {
    // Usar padrão específico da seguradora se disponível
    const specificPattern = INSURER_SPECIFIC_PATTERNS[insurer]?.policyPattern;
    if (specificPattern) {
      const match = text.match(specificPattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Usar padrões gerais
    return this.extractWithMultiplePatterns(text, EXTRACTION_PATTERNS.policyNumber, this.generatePolicyNumber());
  }

  private static extractTotalPremium(text: string, insurer: string): number {
    // Usar padrão específico da seguradora se disponível
    const specificPattern = INSURER_SPECIFIC_PATTERNS[insurer]?.premiumPattern;
    if (specificPattern) {
      const match = text.match(specificPattern);
      if (match && match[1]) {
        return this.parseMonetaryValue(match[1]);
      }
    }
    
    // Usar padrões gerais
    const premiumStr = this.extractWithMultiplePatterns(text, EXTRACTION_PATTERNS.totalPremium, "0");
    return this.parseMonetaryValue(premiumStr);
  }

  private static extractInstallments(text: string, insurer: string): ExtractedInstallment[] {
    const installments: ExtractedInstallment[] = [];
    
    // Usar padrão específico da seguradora se disponível
    const specificPattern = INSURER_SPECIFIC_PATTERNS[insurer]?.installmentPattern;
    if (specificPattern) {
      const matches = Array.from(text.matchAll(specificPattern));
      matches.forEach((match, index) => {
        if (match[1] && match[2]) {
          installments.push({
            numero: index + 1,
            data: this.convertDateFormat(match[1]),
            valor: this.parseMonetaryValue(match[2])
          });
        }
      });
    }
    
    // Se não encontrou com padrão específico, usar padrões gerais
    if (installments.length === 0) {
      const valueMatches = this.getAllMatches(text, EXTRACTION_PATTERNS.installmentValue);
      const dateMatches = this.getAllMatches(text, EXTRACTION_PATTERNS.installmentDate);
      
      const maxLength = Math.min(valueMatches.length, dateMatches.length, 24);
      
      for (let i = 0; i < maxLength; i++) {
        if (valueMatches[i] && dateMatches[i]) {
          installments.push({
            numero: i + 1,
            data: this.convertDateFormat(dateMatches[i]),
            valor: this.parseMonetaryValue(valueMatches[i])
          });
        }
      }
    }
    
    return installments.sort((a, b) => a.numero - b.numero);
  }

  private static getAllMatches(text: string, patterns: RegExp[]): string[] {
    const allMatches: string[] = [];
    
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        if (match[1]) {
          allMatches.push(match[1]);
        }
      });
    }
    
    return allMatches;
  }

  private static extractVehicleInfo(text: string): string {
    const vehiclePatterns = EXTRACTION_PATTERNS.vehicleModel;
    
    for (const pattern of vehiclePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          // Padrão que captura marca e modelo separadamente
          return `${match[1].trim()} ${match[2].trim()}`.toUpperCase();
        } else if (match[1]) {
          // Padrão que captura tudo junto
          return match[1].trim().toUpperCase();
        }
      }
    }
    
    return "";
  }

  private static calculateMonthlyValue(data: EnhancedExtractedData): number {
    // Prioridade: valor da primeira parcela > cálculo baseado no total
    if (data.parcelas && data.parcelas.length > 0) {
      const firstInstallment = data.parcelas[0];
      if (firstInstallment.valor > 0) {
        return Math.round(firstInstallment.valor * 100) / 100;
      }
    }
    
    // Calcular baseado no prêmio total e número de parcelas
    if (data.premioTotal > 0 && data.parcelasTotais > 0) {
      return Math.round((data.premioTotal / data.parcelasTotais) * 100) / 100;
    }
    
    // Fallback: dividir por 12 meses
    return Math.round((data.premioTotal / 12) * 100) / 100;
  }

  private static validateAndCorrectData(data: EnhancedExtractedData): EnhancedExtractedData {
    const correctedData = { ...data };
    
    // Validar e corrigir número de parcelas vs parcelas extraídas
    if (correctedData.parcelas.length > 0) {
      correctedData.parcelasTotais = correctedData.parcelas.length;
    }
    
    // Gerar parcelas se não foram encontradas mas temos prêmio total
    if (correctedData.parcelas.length === 0 && correctedData.premioTotal > 0) {
      correctedData.parcelas = this.generateInstallments(
        correctedData.premioTotal, 
        correctedData.parcelasTotais, 
        correctedData.vigenciaInicio
      );
    }
    
    // Validar coerência do valor mensal
    const expectedMonthly = Math.round((correctedData.premioTotal / correctedData.parcelasTotais) * 100) / 100;
    const tolerance = expectedMonthly * 0.15; // 15% de tolerância
    
    if (Math.abs(correctedData.valorMensal - expectedMonthly) > tolerance) {
      console.warn('⚠️ Valor mensal recalculado por inconsistência');
      correctedData.valorMensal = expectedMonthly;
    }
    
    // Validar datas de vigência
    const startDate = new Date(correctedData.vigenciaInicio);
    const endDate = new Date(correctedData.vigenciaFim);
    
    if (endDate <= startDate) {
      console.warn('⚠️ Data de fim corrigida');
      const newEndDate = new Date(startDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      correctedData.vigenciaFim = newEndDate.toISOString().split('T')[0];
    }
    
    return correctedData;
  }

  // Métodos utilitários
  private static parseMonetaryValue(value: string): number {
    if (!value) return 0;
    
    const cleanValue = value
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  private static convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  private static generatePolicyNumber(): string {
    return `${Date.now()}.${Math.floor(Math.random() * 1000)}`;
  }

  private static generateStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
    return date.toISOString().split('T')[0];
  }

  private static generateEndDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  private static generateInstallments(totalPremium: number, numberOfInstallments: number, startDate: string): ExtractedInstallment[] {
    const installments: ExtractedInstallment[] = [];
    const monthlyValue = Math.round((totalPremium / numberOfInstallments) * 100) / 100;
    const start = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(start);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        data: installmentDate.toISOString().split('T')[0],
        valor: monthlyValue
      });
    }
    
    return installments;
  }

  // Método para converter para o formato legado
  static convertToLegacyFormat(enhancedData: EnhancedExtractedData): DynamicPDFData {
    return {
      informacoes_gerais: {
        nome_apolice: `Apólice ${enhancedData.seguradora}`,
        tipo: "Auto",
        status: "Ativa",
        numero_apolice: enhancedData.apolice
      },
      seguradora: {
        empresa: enhancedData.seguradora,
        categoria: "Categoria Padrão",
        cobertura: enhancedData.tipoCobertura,
        entidade: "Corretora"
      },
      informacoes_financeiras: {
        premio_anual: enhancedData.premioTotal,
        premio_mensal: enhancedData.valorMensal
      },
      vigencia: {
        inicio: enhancedData.vigenciaInicio,
        fim: enhancedData.vigenciaFim,
        extraido_em: new Date().toISOString().split('T')[0]
      },
      segurado: enhancedData.nomeSegurado !== "Nome não identificado" ? {
        nome: enhancedData.nomeSegurado,
        cpf: enhancedData.cpf
      } : undefined,
      veiculo: enhancedData.veiculo ? {
        marca: enhancedData.veiculo.split(' ')[0],
        modelo: enhancedData.veiculo
      } : undefined
    };
  }
}
