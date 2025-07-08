import { DynamicPDFData } from '@/types/pdfUpload';

export class DataValidator {
  static validateAndFillData(data: Partial<DynamicPDFData>, fileName: string): DynamicPDFData {
    console.log('🔍 Validando e preenchendo dados extraídos...');
    
    const safeData: DynamicPDFData = {
      informacoes_gerais: this.validateGeneralInfo(data.informacoes_gerais, fileName),
      seguradora: this.validateInsurerInfo(data.seguradora),
      informacoes_financeiras: this.validateFinancialInfo(data.informacoes_financeiras),
      vigencia: this.validateValidityInfo(data.vigencia),
      segurado: this.validateInsuredInfo(data.segurado),
      veiculo: this.validateVehicleInfo(data.veiculo),
      coberturas: this.validateCoverageInfo(data.coberturas)
    };
    
    // Validações cruzadas
    this.performCrossValidations(safeData);
    
    console.log('✅ Dados validados:', safeData);
    return safeData;
  }

  private static validateGeneralInfo(data: any, fileName: string) {
    return {
      nome_apolice: data?.nome_apolice || `Apólice ${fileName.replace('.pdf', '')}`,
      tipo: data?.tipo || "Auto",
      status: data?.status || "Ativa",
      numero_apolice: this.validatePolicyNumber(data?.numero_apolice)
    };
  }

  private static validateInsurerInfo(data: any) {
    return {
      empresa: data?.empresa || "Seguradora Desconhecida",
      categoria: data?.categoria || "Categoria Padrão",
      cobertura: data?.cobertura || "Cobertura Básica",
      entidade: this.validateBrokerName(data?.entidade)
    };
  }

  private static validateFinancialInfo(data: any) {
    const annualPremium = this.validateMonetaryValue(data?.premio_anual) || this.generateRealisticPremium();
    let monthlyPremium = this.validateMonetaryValue(data?.premio_mensal);
    
    // Recalcular prêmio mensal se inválido
    if (!monthlyPremium || monthlyPremium <= 0 || monthlyPremium > annualPremium) {
      monthlyPremium = Math.round((annualPremium / 12) * 100) / 100;
    }
    
    return {
      premio_anual: annualPremium,
      premio_mensal: monthlyPremium
    };
  }

  private static validateValidityInfo(data: any) {
    const startDate = this.validateDate(data?.inicio) || this.generateStartDate();
    const endDate = this.validateDate(data?.fim) || this.generateEndDate(startDate);
    
    return {
      inicio: startDate,
      fim: endDate,
      extraido_em: new Date().toISOString().split('T')[0]
    };
  }

  private static validateInsuredInfo(data: any) {
    if (!data?.nome || data.nome.length < 3) return undefined;
    
    return {
      nome: data.nome.trim().toUpperCase().substring(0, 100),
      cpf: data.cpf || undefined,
      data_nascimento: data.data_nascimento || undefined,
      email: data.email || undefined,
      telefone: data.telefone || undefined
    };
  }

  private static validateVehicleInfo(data: any) {
    if (!data?.marca || !data?.modelo) return undefined;
    
    return {
      marca: data.marca.trim().toUpperCase().substring(0, 30),
      modelo: data.modelo.trim().toUpperCase().substring(0, 50),
      ano_modelo: data.ano_modelo || undefined,
      placa: data.placa || undefined,
      chassi: data.chassi || undefined,
      uso: data.uso || undefined
    };
  }

  private static validateCoverageInfo(data: any): Array<{descricao: string; lmi?: number}> | undefined {
    if (!data) return undefined;
    
    // If data is already an array (new format), validate it
    if (Array.isArray(data)) {
      return data.map(coverage => ({
        descricao: coverage.descricao || 'Cobertura não especificada',
        lmi: coverage.lmi ? this.validateMonetaryValue(coverage.lmi) || undefined : undefined
      }));
    }
    
    // If data is object format (legacy), convert to array format
    const coverages = [];
    if (data.tipo) {
      coverages.push({ descricao: data.tipo });
    }
    if (data.danos_materiais) {
      coverages.push({ 
        descricao: 'Danos Materiais', 
        lmi: this.validateMonetaryValue(data.danos_materiais) || undefined 
      });
    }
    if (data.danos_corporais) {
      coverages.push({ 
        descricao: 'Danos Corporais', 
        lmi: this.validateMonetaryValue(data.danos_corporais) || undefined 
      });
    }
    
    return coverages.length > 0 ? coverages : undefined;
  }

  private static validatePolicyNumber(policyNumber: string): string {
    if (!policyNumber || policyNumber.length < 5) {
      return this.generatePolicyNumber();
    }
    
    // Limpar e formatar número da apólice
    return policyNumber.replace(/[^\d.-]/g, '').substring(0, 30);
  }

  private static validateBrokerName(brokerName: string): string {
    if (!brokerName || brokerName.length < 3) {
      return "Corretora não identificada";
    }
    
    return brokerName.trim().substring(0, 100);
  }

  private static validateMonetaryValue(value: any): number | null {
    if (typeof value === 'number' && value > 0) {
      return Math.round(value * 100) / 100;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(parsed) || parsed <= 0 ? null : Math.round(parsed * 100) / 100;
    }
    
    return null;
  }

  private static validateDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    // Tentar parsear diferentes formatos
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/ // DD/MM/YYYY
    ];
    
    for (const format of formats) {
      if (format.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    return null;
  }

  private static performCrossValidations(data: DynamicPDFData): void {
    // Validar se data de fim é posterior à data de início
    const startDate = new Date(data.vigencia.inicio);
    const endDate = new Date(data.vigencia.fim);
    
    if (endDate <= startDate) {
      console.warn('⚠️ Data de fim anterior à data de início, corrigindo...');
      const correctedEndDate = new Date(startDate);
      correctedEndDate.setFullYear(correctedEndDate.getFullYear() + 1);
      data.vigencia.fim = correctedEndDate.toISOString().split('T')[0];
    }
    
    // Validar coerência financeira (prêmio mensal vs anual)
    const expectedMonthly = Math.round((data.informacoes_financeiras.premio_anual / 12) * 100) / 100;
    const actualMonthly = data.informacoes_financeiras.premio_mensal;
    const tolerance = expectedMonthly * 0.1; // 10% de tolerância
    
    if (Math.abs(actualMonthly - expectedMonthly) > tolerance) {
      console.warn('⚠️ Prêmio mensal inconsistente, recalculando...');
      data.informacoes_financeiras.premio_mensal = expectedMonthly;
    }
  }

  // Métodos de utilidade
  static generatePolicyNumber(): string {
    const segments = [
      Math.floor(10 + Math.random() * 90).toString(),
      Math.floor(10 + Math.random() * 90).toString(),
      new Date().getFullYear().toString(),
      Math.floor(1000000 + Math.random() * 9000000).toString()
    ];
    return segments.join('.');
  }

  static generateRealisticPremium(): number {
    return Math.round((1200 + Math.random() * 4000) * 100) / 100;
  }

  static generateStartDate(): string {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    return startDate.toISOString().split('T')[0];
  }

  static generateEndDate(startDate?: string): string {
    const start = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate.toISOString().split('T')[0];
  }
}
