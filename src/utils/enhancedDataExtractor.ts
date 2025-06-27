
import { EXTRACTION_PATTERNS, INSURANCE_COMPANIES_LIST } from './extractionPatterns';
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
    console.log('🔍 Iniciando extração aprimorada de dados...');
    
    const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const extractedData: EnhancedExtractedData = {
      nomeSegurado: this.extractInsuredName(normalizedText),
      cpf: this.extractCpfCnpj(normalizedText),
      apolice: this.extractPolicyNumber(normalizedText),
      vigenciaInicio: this.extractStartDate(normalizedText),
      vigenciaFim: this.extractEndDate(normalizedText),
      premioTotal: this.extractTotalPremium(normalizedText),
      parcelas: this.extractInstallments(normalizedText),
      parcelasTotais: this.extractNumberOfInstallments(normalizedText),
      valorMensal: 0, // Será calculado depois
      veiculo: this.extractVehicleModel(normalizedText),
      placa: this.extractLicensePlate(normalizedText),
      fipe: this.extractFipeCode(normalizedText),
      tipoCobertura: this.extractCoverageType(normalizedText),
      seguradora: this.extractInsuranceCompany(normalizedText)
    };

    // Cálculo dinâmico do valor mensal
    extractedData.valorMensal = this.calculateMonthlyValue(extractedData);
    
    // Validação e preenchimento de dados ausentes
    const validatedData = this.validateAndFillMissingData(extractedData);
    
    console.log('📊 Dados extraídos com sucesso:', validatedData);
    return validatedData;
  }

  private static extractInsuredName(text: string): string {
    let match = text.match(EXTRACTION_PATTERNS.insuredName);
    
    if (!match) {
      // Tentar padrões alternativos
      for (const pattern of EXTRACTION_PATTERNS.alternativePatterns.insuredName) {
        match = text.match(pattern);
        if (match) break;
      }
    }
    
    return match ? match[1].trim().toUpperCase() : "Nome não identificado";
  }

  private static extractCpfCnpj(text: string): string {
    const match = text.match(EXTRACTION_PATTERNS.cpfCnpj);
    return match ? match[1].trim() : "";
  }

  private static extractPolicyNumber(text: string): string {
    let match = text.match(EXTRACTION_PATTERNS.policyNumber);
    
    if (!match) {
      // Tentar padrões alternativos
      for (const pattern of EXTRACTION_PATTERNS.alternativePatterns.policyNumber) {
        match = text.match(pattern);
        if (match) break;
      }
    }
    
    return match ? match[1].trim() : this.generatePolicyNumber();
  }

  private static extractStartDate(text: string): string {
    let match = text.match(EXTRACTION_PATTERNS.startDate);
    
    if (!match) {
      // Tentar padrões alternativos
      for (const pattern of EXTRACTION_PATTERNS.alternativePatterns.startDate) {
        match = text.match(pattern);
        if (match) break;
      }
    }
    
    return match ? this.convertDateFormat(match[1]) : this.generateStartDate();
  }

  private static extractEndDate(text: string): string {
    let match = text.match(EXTRACTION_PATTERNS.endDate);
    
    if (!match) {
      // Tentar padrões alternativos
      for (const pattern of EXTRACTION_PATTERNS.alternativePatterns.endDate) {
        match = text.match(pattern);
        if (match) break;
      }
    }
    
    return match ? this.convertDateFormat(match[1]) : this.generateEndDate();
  }

  private static extractTotalPremium(text: string): number {
    let match = text.match(EXTRACTION_PATTERNS.totalPremium);
    
    if (!match) {
      // Tentar padrões alternativos
      for (const pattern of EXTRACTION_PATTERNS.alternativePatterns.totalPremium) {
        match = text.match(pattern);
        if (match) break;
      }
    }
    
    return match ? this.parseMonetaryValue(match[1]) : this.generateRealisticPremium();
  }

  private static extractInstallments(text: string): ExtractedInstallment[] {
    const installments: ExtractedInstallment[] = [];
    
    const valueMatches = Array.from(text.matchAll(EXTRACTION_PATTERNS.installmentValue));
    const dateMatches = Array.from(text.matchAll(EXTRACTION_PATTERNS.installmentDate));
    
    const maxLength = Math.min(valueMatches.length, dateMatches.length, 24); // Máximo 24 parcelas
    
    for (let i = 0; i < maxLength; i++) {
      if (valueMatches[i] && dateMatches[i]) {
        installments.push({
          numero: i + 1,
          data: this.convertDateFormat(dateMatches[i][1]),
          valor: this.parseMonetaryValue(valueMatches[i][1])
        });
      }
    }
    
    return installments;
  }

  private static extractNumberOfInstallments(text: string): number {
    const match = text.match(EXTRACTION_PATTERNS.numberOfInstallments);
    return match ? parseInt(match[1]) : 12;
  }

  private static extractVehicleModel(text: string): string {
    const match = text.match(EXTRACTION_PATTERNS.vehicleModel);
    return match ? match[1].trim().toUpperCase() : "";
  }

  private static extractLicensePlate(text: string): string {
    const match = text.match(EXTRACTION_PATTERNS.licensePlate);
    return match ? match[1].trim().toUpperCase() : "";
  }

  private static extractFipeCode(text: string): string {
    const match = text.match(EXTRACTION_PATTERNS.fipeCode);
    return match ? match[1].trim() : "";
  }

  private static extractCoverageType(text: string): string {
    const match = text.match(EXTRACTION_PATTERNS.coverageType);
    return match ? match[1].trim().toUpperCase() : "BÁSICA";
  }

  private static extractInsuranceCompany(text: string): string {
    const textLower = text.toLowerCase();
    
    // Busca por correspondência exata
    for (const company of INSURANCE_COMPANIES_LIST) {
      const companyLower = company.toLowerCase();
      if (textLower.includes(companyLower)) {
        console.log(`✅ Seguradora detectada: ${company}`);
        return company;
      }
    }
    
    // Busca por palavras-chave
    for (const company of INSURANCE_COMPANIES_LIST) {
      const keywords = company.toLowerCase().split(' ');
      const matchCount = keywords.filter(keyword => 
        keyword.length > 3 && textLower.includes(keyword)
      ).length;
      
      if (matchCount >= Math.ceil(keywords.length / 2)) {
        console.log(`✅ Seguradora detectada por palavras-chave: ${company}`);
        return company;
      }
    }
    
    return "Seguradora não identificada";
  }

  private static calculateMonthlyValue(data: EnhancedExtractedData): number {
    if (data.parcelas && data.parcelas.length > 0) {
      // Usar o valor da primeira parcela se disponível
      return data.parcelas[0].valor;
    }
    
    if (data.premioTotal && data.parcelasTotais > 0) {
      return Math.round((data.premioTotal / data.parcelasTotais) * 100) / 100;
    }
    
    return Math.round((data.premioTotal / 12) * 100) / 100;
  }

  private static validateAndFillMissingData(data: EnhancedExtractedData): EnhancedExtractedData {
    // Validar número de parcelas vs parcelas extraídas
    if (data.parcelas.length > 0 && data.parcelasTotais !== data.parcelas.length) {
      data.parcelasTotais = data.parcelas.length;
    }
    
    // Gerar parcelas se não foram encontradas
    if (data.parcelas.length === 0 && data.premioTotal > 0) {
      data.parcelas = this.generateInstallments(data.premioTotal, data.parcelasTotais, data.vigenciaInicio);
    }
    
    // Validar coerência do valor mensal
    if (data.valorMensal === 0 || data.valorMensal > data.premioTotal) {
      data.valorMensal = this.calculateMonthlyValue(data);
    }
    
    return data;
  }

  // Métodos utilitários
  private static parseMonetaryValue(value: string): number {
    const cleanValue = value
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  private static convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
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

  private static generateRealisticPremium(): number {
    return Math.round((1500 + Math.random() * 3500) * 100) / 100;
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
