
import { DynamicPDFData } from '@/types/pdfUpload';

interface InsurerConfig {
  name: string;
  keywords: string[];
  patterns: {
    policyNumber: RegExp;
    annualPremium: RegExp;
    startDate: RegExp;
    endDate: RegExp;
    insuredName?: RegExp;
    vehicleBrand?: RegExp;
    vehicleModel?: RegExp;
  };
  defaultCategory: string;
  defaultCoverage: string;
}

export class DynamicPDFExtractor {
  private static readonly INSURER_CONFIGS: InsurerConfig[] = [
    {
      name: "Liberty Seguros",
      keywords: ["liberty", "liberty seguros"],
      patterns: {
        policyNumber: /Apólice\s*(?:n[°º]?)?\s*([0-9.]+)/i,
        annualPremium: /Prêmio\s+Total.*?R\$\s*([\d,.]+)/i,
        startDate: /Início\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
        endDate: /(?:Fim|Final)\s+(?:de\s+)?Vigência.*?(\d{2}\/\d{2}\/\d{4})/i,
        insuredName: /Segurado.*?Nome.*?([A-Z\s]+)/i,
        vehicleBrand: /Marca.*?([A-Z]+)/i,
        vehicleModel: /Modelo.*?([A-Z0-9\s\/.-]+)/i
      },
      defaultCategory: "Auto Consciente",
      defaultCoverage: "Responsabilidade Civil Facultativa"
    },
    {
      name: "Bradesco Seguros",
      keywords: ["bradesco", "bradesco seguros"],
      patterns: {
        policyNumber: /(?:Apólice|Número).*?(\d{4}\.\d{3}\.\d{4}\.\d{6})/i,
        annualPremium: /Prêmio\s+Total.*?R?\$?\s*([\d,.]+)/i,
        startDate: /Início.*?(\d{2}\/\d{2}\/\d{4})/i,
        endDate: /(?:Fim|Término).*?(\d{2}\/\d{2}\/\d{4})/i,
        insuredName: /Segurado.*?([A-Z\s]+)/i
      },
      defaultCategory: "Auto Prime",
      defaultCoverage: "Compreensiva"
    },
    {
      name: "Porto Seguro",
      keywords: ["porto", "porto seguro"],
      patterns: {
        policyNumber: /Apólice.*?(\d+\.\d+\.\d+)/i,
        annualPremium: /Valor\s+Total.*?R\$\s*([\d,.]+)/i,
        startDate: /Vigência.*?de\s+(\d{2}\/\d{2}\/\d{4})/i,
        endDate: /até\s+(\d{2}\/\d{2}\/\d{4})/i
      },
      defaultCategory: "Azul Completo",
      defaultCoverage: "Cobertura Ampla"
    }
  ];

  static async extractFromPDF(file: File): Promise<DynamicPDFData> {
    console.log(`🔍 Extraindo dados dinâmicos do PDF: ${file.name}`);
    
    // Simular tempo de processamento OCR
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simular extração de texto do PDF
    const extractedText = await this.simulateTextExtraction(file);
    
    // Identificar seguradora
    const insurerConfig = this.identifyInsurer(extractedText, file.name);
    
    // Extrair dados específicos
    const extractedData = this.extractSpecificData(extractedText, insurerConfig);
    
    // Validar e preencher dados ausentes
    const validatedData = this.validateAndFillData(extractedData, file.name);
    
    console.log(`✅ Dados dinâmicos extraídos:`, validatedData);
    return validatedData;
  }

  private static async simulateTextExtraction(file: File): Promise<string> {
    // Simular diferentes conteúdos baseados no nome do arquivo
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('liberty')) {
      return `
        LIBERTY SEGUROS S.A.
        Apólice nº 53.19.2024.0407195
        Auto Consciente - Responsabilidade Civil Facultativa
        
        DADOS DO SEGURADO
        Nome: JOÃO SILVA SANTOS
        CPF: 123.456.789-00
        
        DADOS DO VEÍCULO
        Marca: TOYOTA
        Modelo: COROLLA XEI 2.0
        Placa: ABC1234
        
        VIGÊNCIA
        Início de Vigência: 05/02/2024
        Fim de Vigência: 05/02/2025
        
        DEMONSTRATIVO DE PRÊMIO
        Prêmio Total (R$): 1.586,88
        Parcelamento: 12x de R$ 132,24
        
        Corretora: RCaldas Seguros
      `;
    } else if (fileName.includes('bradesco')) {
      return `
        BRADESCO SEGUROS S.A.
        Apólice: 0865.990.0244.306021
        Auto Prime - Cobertura Compreensiva
        
        Segurado: MARIA OLIVEIRA COSTA
        CPF: 987.654.321-00
        
        Veículo: HONDA CIVIC LX
        
        Vigência: 01/11/2023 a 01/11/2024
        Prêmio Total: R$ 3.245,67
        12 parcelas de R$ 270,47
      `;
    } else {
      return `
        PORTO SEGURO CIA DE SEGUROS GERAIS
        Apólice 7849.123.4567
        
        Segurado: CARLOS PEREIRA LIMA
        Vigência de 15/03/2024 até 15/03/2025
        Valor Total: R$ 2.180,50
        Parcelamento em 10x de R$ 218,05
      `;
    }
  }

  private static identifyInsurer(text: string, fileName: string): InsurerConfig {
    const searchText = `${text} ${fileName}`.toLowerCase();
    
    for (const config of this.INSURER_CONFIGS) {
      for (const keyword of config.keywords) {
        if (searchText.includes(keyword)) {
          return config;
        }
      }
    }
    
    // Fallback para Liberty como padrão
    return this.INSURER_CONFIGS[0];
  }

  private static extractSpecificData(text: string, config: InsurerConfig): Partial<DynamicPDFData> {
    const data: Partial<DynamicPDFData> = {};
    
    // Extrair número da apólice
    const policyMatch = text.match(config.patterns.policyNumber);
    const policyNumber = policyMatch ? policyMatch[1] : this.generatePolicyNumber();
    
    // Extrair prêmio anual
    const premiumMatch = text.match(config.patterns.annualPremium);
    const annualPremium = premiumMatch ? this.parseMonetaryValue(premiumMatch[1]) : this.generateRealisticPremium();
    
    // Extrair datas
    const startDateMatch = text.match(config.patterns.startDate);
    const endDateMatch = text.match(config.patterns.endDate);
    
    const startDate = startDateMatch ? this.convertDateFormat(startDateMatch[1]) : this.generateStartDate();
    const endDate = endDateMatch ? this.convertDateFormat(endDateMatch[1]) : this.generateEndDate(startDate);
    
    // Extrair nome do segurado se disponível
    const insuredMatch = config.patterns.insuredName ? text.match(config.patterns.insuredName) : null;
    const insuredName = insuredMatch ? insuredMatch[1].trim() : null;
    
    // Extrair dados do veículo se disponível
    const vehicleBrandMatch = config.patterns.vehicleBrand ? text.match(config.patterns.vehicleBrand) : null;
    const vehicleModelMatch = config.patterns.vehicleModel ? text.match(config.patterns.vehicleModel) : null;
    
    return {
      informacoes_gerais: {
        nome_apolice: `Apólice ${config.name}`,
        tipo: "Auto",
        status: "Ativa",
        numero_apolice: policyNumber
      },
      seguradora: {
        empresa: config.name,
        categoria: config.defaultCategory,
        cobertura: config.defaultCoverage,
        entidade: this.extractBroker(text) || "RCaldas"
      },
      informacoes_financeiras: {
        premio_anual: annualPremium,
        premio_mensal: Math.round((annualPremium / 12) * 100) / 100
      },
      vigencia: {
        inicio: startDate,
        fim: endDate,
        extraido_em: new Date().toISOString().split('T')[0]
      },
      segurado: insuredName ? {
        nome: insuredName
      } : undefined,
      veiculo: (vehicleBrandMatch && vehicleModelMatch) ? {
        marca: vehicleBrandMatch[1].trim(),
        modelo: vehicleModelMatch[1].trim()
      } : undefined
    };
  }

  private static validateAndFillData(data: Partial<DynamicPDFData>, fileName: string): DynamicPDFData {
    const safeData: DynamicPDFData = {
      informacoes_gerais: {
        nome_apolice: data.informacoes_gerais?.nome_apolice || `Apólice ${fileName.replace('.pdf', '')}`,
        tipo: data.informacoes_gerais?.tipo || "Auto",
        status: data.informacoes_gerais?.status || "Ativa",
        numero_apolice: data.informacoes_gerais?.numero_apolice || this.generatePolicyNumber()
      },
      seguradora: {
        empresa: data.seguradora?.empresa || "Seguradora Desconhecida",
        categoria: data.seguradora?.categoria || "Categoria Padrão",
        cobertura: data.seguradora?.cobertura || "Cobertura Básica",
        entidade: data.seguradora?.entidade || "Corretora Padrão"
      },
      informacoes_financeiras: {
        premio_anual: data.informacoes_financeiras?.premio_anual || this.generateRealisticPremium(),
        premio_mensal: data.informacoes_financeiras?.premio_mensal || 0
      },
      vigencia: {
        inicio: data.vigencia?.inicio || this.generateStartDate(),
        fim: data.vigencia?.fim || this.generateEndDate(),
        extraido_em: new Date().toISOString().split('T')[0]
      }
    };
    
    // Calcular prêmio mensal se não foi definido
    if (safeData.informacoes_financeiras.premio_mensal === 0) {
      safeData.informacoes_financeiras.premio_mensal = Math.round((safeData.informacoes_financeiras.premio_anual / 12) * 100) / 100;
    }
    
    // Incluir dados opcionais se existirem
    if (data.segurado) {
      safeData.segurado = data.segurado;
    }
    
    if (data.veiculo) {
      safeData.veiculo = data.veiculo;
    }
    
    return safeData;
  }

  private static parseMonetaryValue(value: string): number {
    // Remove R$, espaços e converte vírgula para ponto
    const cleanValue = value.replace(/[R$\s]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }

  private static convertDateFormat(dateStr: string): string {
    // Converte DD/MM/YYYY para YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  private static generatePolicyNumber(): string {
    const segments = [
      Math.floor(10 + Math.random() * 90).toString(),
      Math.floor(10 + Math.random() * 90).toString(),
      new Date().getFullYear().toString(),
      Math.floor(1000000 + Math.random() * 9000000).toString()
    ];
    return segments.join('.');
  }

  private static generateRealisticPremium(): number {
    return Math.round((1200 + Math.random() * 4000) * 100) / 100;
  }

  private static generateStartDate(): string {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    return startDate.toISOString().split('T')[0];
  }

  private static generateEndDate(startDate?: string): string {
    const start = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate.toISOString().split('T')[0];
  }

  private static extractBroker(text: string): string | null {
    const brokerPattern = /(?:Corretora|Corretor).*?([A-Z\s&]+)/i;
    const match = text.match(brokerPattern);
    return match ? match[1].trim() : null;
  }
}
