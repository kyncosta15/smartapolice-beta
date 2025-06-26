
interface PDFExtractionResult {
  seguradora?: string;
  numero_apolice?: string;
  item?: string;
  tipo_apolice?: string;
  ramo?: string;
  data_emissao?: string;
  inicio_vigencia?: string;
  fim_vigencia?: string;
  
  segurado?: {
    nome?: string;
    cpf?: string;
    data_nascimento?: string;
    email?: string;
    telefone?: string;
  };

  condutor?: {
    nome?: string;
    cpf?: string;
    data_nascimento?: string;
    condutor_principal?: boolean;
  };

  proprietario?: {
    nome?: string;
    cpf?: string;
  };

  veiculo?: {
    marca?: string;
    modelo?: string;
    ano_fabricacao?: string;
    ano_modelo?: string;
    placa?: string;
    chassi?: string;
    codigo_fipe?: string;
    uso?: string;
    tipo?: string;
    combustivel?: string;
    portas?: number | null;
    eixos?: number | null;
    lotacao?: number | null;
    antifurto?: string;
  };

  coberturas?: {
    tipo?: string;
    valor_mercado?: string;
    danos_materiais_terceiros?: number;
    danos_corporais_terceiros?: number;
    danos_morais?: number;
    franquia?: number;
  };

  pagamento?: {
    premio_total?: number;
    premio_veiculo?: number;
    premio_rcf?: number;
    parcelas?: number;
    valor_parcela?: number;
    forma_pagamento?: string;
    bandeira_cartao?: string;
    fim_validade_cartao?: string;
    pagamento_confirmado?: boolean;
    custo_mensal?: number;
  };

  outros?: {
    cosseguro?: boolean;
    corretora?: string;
    susep?: string;
    observacoes?: string;
  };
}

// Simulação de extração de PDF com IA - em produção seria integrado com API real de OCR
export class PDFExtractor {
  private static readonly SAMPLE_DATA_TEMPLATES: PDFExtractionResult[] = [
    {
      seguradora: "Bradesco Seguros",
      numero_apolice: "0865.990.0244.306021",
      item: "0001",
      tipo_apolice: "Auto Prime",
      ramo: "Automóvel",
      data_emissao: "2023-11-07",
      inicio_vigencia: "2023-11-01",
      fim_vigencia: "2024-11-01",
      
      segurado: {
        nome: "TULIO VILASBOAS REIS",
        cpf: "806.040.055-04",
        data_nascimento: "1979-03-30",
        email: "TULIOVBREIS@BOL.COM.BR",
        telefone: "71 996150539"
      },

      condutor: {
        nome: "CINTIA MURICY CA JAZEIRA REIS",
        cpf: "800.854.745-68",
        data_nascimento: "1980-09-29",
        condutor_principal: false
      },

      proprietario: {
        nome: "TULIO VILASBOAS REIS",
        cpf: "806.040.055-04"
      },

      veiculo: {
        marca: "TOYOTA",
        modelo: "HILUX SW4 SRX 4X4 2.8 TDI 16V",
        ano_fabricacao: "2022",
        ano_modelo: "2022",
        placa: "BVT9A24",
        chassi: "8AJBA3FS9N0324764",
        codigo_fipe: "2146.6",
        uso: "Particular",
        tipo: "SUV",
        combustivel: "Diesel",
        portas: 4,
        eixos: 2,
        lotacao: 7,
        antifurto: "Comodato CEABS GSM"
      },

      coberturas: {
        tipo: "Compreensiva",
        valor_mercado: "referenciado",
        danos_materiais_terceiros: 200000,
        danos_corporais_terceiros: 450000,
        danos_morais: 5000,
        franquia: 14710.5
      },

      pagamento: {
        premio_total: 6209.83,
        premio_veiculo: 4726.13,
        premio_rcf: 1056.92,
        parcelas: 12,
        valor_parcela: 517.49,
        forma_pagamento: "Cartão de Crédito",
        bandeira_cartao: "VISA",
        fim_validade_cartao: "10/2031",
        pagamento_confirmado: true,
        custo_mensal: 0 // Será calculado automaticamente
      },

      outros: {
        cosseguro: false,
        corretora: "RCALDAS COR E ADM DE SEGS LTDA",
        susep: "00000202089637",
        observacoes: ""
      }
    },
    {
      seguradora: "Porto Seguro",
      numero_apolice: "5312.847.0019.552143",
      tipo_apolice: "Seguro Vida Individual",
      ramo: "Vida",
      data_emissao: "2023-10-15",
      inicio_vigencia: "2023-11-01",
      fim_vigencia: "2024-11-01",
      
      segurado: {
        nome: "MARIA SILVA SANTOS",
        cpf: "123.456.789-00",
        data_nascimento: "1985-05-20",
        email: "maria.santos@email.com",
        telefone: "11 987654321"
      },

      pagamento: {
        premio_total: 2400.00,
        parcelas: 12,
        valor_parcela: 200.00,
        forma_pagamento: "Boleto",
        pagamento_confirmado: true,
        custo_mensal: 0 // Será calculado automaticamente
      },

      outros: {
        cosseguro: false,
        corretora: "Corretora Vida & Cia",
        susep: "15414900840201909",
        observacoes: "Seguro de vida individual com cobertura básica"
      }
    },
    {
      seguradora: "SulAmérica",
      numero_apolice: "7849.123.4567.890123",
      tipo_apolice: "Residencial Completo",
      ramo: "Patrimonial",
      data_emissao: "2023-09-20",
      inicio_vigencia: "2023-10-01",
      fim_vigencia: "2024-10-01",
      
      segurado: {
        nome: "JOÃO PEREIRA LIMA",
        cpf: "987.654.321-00",
        data_nascimento: "1975-12-10",
        email: "joao.lima@email.com",
        telefone: "21 912345678"
      },

      coberturas: {
        tipo: "Residencial Completo",
        valor_mercado: "450000",
        danos_materiais_terceiros: 100000,
        franquia: 2500
      },

      pagamento: {
        premio_total: 1800.00,
        parcelas: 6,
        valor_parcela: 300.00,
        forma_pagamento: "Débito Automático",
        pagamento_confirmado: true,
        custo_mensal: 0 // Será calculado automaticamente
      },

      outros: {
        cosseguro: false,
        corretora: "Imóveis Seguros Ltda",
        susep: "15414900840201801",
        observacoes: "Cobertura para imóvel residencial"
      }
    }
  ];

  static async extractFromPDF(file: File): Promise<PDFExtractionResult> {
    console.log(`🔍 Extraindo dados do PDF: ${file.name}`);
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Selecionar template baseado no nome do arquivo ou aleatoriamente
    const fileName = file.name.toLowerCase();
    let selectedTemplate: PDFExtractionResult;
    
    if (fileName.includes('bradesco') || fileName.includes('auto')) {
      selectedTemplate = this.SAMPLE_DATA_TEMPLATES[0];
    } else if (fileName.includes('vida') || fileName.includes('porto')) {
      selectedTemplate = this.SAMPLE_DATA_TEMPLATES[1];
    } else if (fileName.includes('residencial') || fileName.includes('sulamerica')) {
      selectedTemplate = this.SAMPLE_DATA_TEMPLATES[2];
    } else {
      // Selecionar aleatoriamente
      const randomIndex = Math.floor(Math.random() * this.SAMPLE_DATA_TEMPLATES.length);
      selectedTemplate = this.SAMPLE_DATA_TEMPLATES[randomIndex];
    }
    
    // Aplicar validação e preenchimento seguro
    const validatedData = this.validateAndFillData(selectedTemplate);
    
    // Gerar variações nos dados para simular extração real
    const extractedData = this.generateVariations(validatedData);
    
    // Calcular campos derivados
    const finalData = this.calculateDerivedFields(extractedData);
    
    console.log(`✅ Dados extraídos e validados:`, finalData);
    return finalData;
  }

  private static validateAndFillData(data: PDFExtractionResult): PDFExtractionResult {
    const safeData = { ...data };
    
    // Validação básica e preenchimento seguro
    safeData.seguradora = safeData.seguradora || "Desconhecido";
    safeData.numero_apolice = safeData.numero_apolice || this.generatePolicyNumber();
    safeData.item = safeData.item || "0001";
    safeData.tipo_apolice = safeData.tipo_apolice || "Não especificado";
    safeData.ramo = safeData.ramo || "Geral";
    
    // Validar datas
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    safeData.data_emissao = safeData.data_emissao || startDate.toISOString().split('T')[0];
    safeData.inicio_vigencia = safeData.inicio_vigencia || startDate.toISOString().split('T')[0];
    safeData.fim_vigencia = safeData.fim_vigencia || endDate.toISOString().split('T')[0];
    
    // Validar estruturas aninhadas
    if (!safeData.segurado) safeData.segurado = {};
    safeData.segurado.nome = safeData.segurado.nome || "Nome não informado";
    safeData.segurado.cpf = safeData.segurado.cpf || "";
    safeData.segurado.email = safeData.segurado.email || "";
    safeData.segurado.telefone = safeData.segurado.telefone || "";
    
    if (!safeData.pagamento) safeData.pagamento = {};
    safeData.pagamento.premio_total = safeData.pagamento.premio_total || 0;
    safeData.pagamento.parcelas = safeData.pagamento.parcelas || 12;
    safeData.pagamento.forma_pagamento = safeData.pagamento.forma_pagamento || "Boleto";
    safeData.pagamento.pagamento_confirmado = safeData.pagamento.pagamento_confirmado || false;
    
    if (!safeData.outros) safeData.outros = {};
    safeData.outros.cosseguro = safeData.outros.cosseguro || false;
    safeData.outros.corretora = safeData.outros.corretora || "Não informado";
    safeData.outros.susep = safeData.outros.susep || "";
    safeData.outros.observacoes = safeData.outros.observacoes || "";
    
    return safeData;
  }

  private static generateVariations(data: PDFExtractionResult): PDFExtractionResult {
    const variedData = { ...data };
    
    // Variar alguns valores para simular extração real
    if (variedData.pagamento?.premio_total) {
      variedData.pagamento.premio_total = variedData.pagamento.premio_total * (0.8 + Math.random() * 0.4);
      variedData.pagamento.premio_total = Math.round(variedData.pagamento.premio_total * 100) / 100;
    }
    
    // Gerar número de apólice único
    variedData.numero_apolice = this.generatePolicyNumber();
    
    return variedData;
  }

  private static calculateDerivedFields(data: PDFExtractionResult): PDFExtractionResult {
    const calculatedData = { ...data };
    
    // Calcular custo mensal automaticamente
    if (calculatedData.pagamento) {
      const premioTotal = calculatedData.pagamento.premio_total || 0;
      const parcelas = calculatedData.pagamento.parcelas || 12;
      
      // Custo mensal baseado no número de parcelas
      calculatedData.pagamento.custo_mensal = Math.round((premioTotal / 12) * 100) / 100;
      
      // Recalcular valor da parcela se necessário
      if (!calculatedData.pagamento.valor_parcela && parcelas > 0) {
        calculatedData.pagamento.valor_parcela = Math.round((premioTotal / parcelas) * 100) / 100;
      }
    }
    
    return calculatedData;
  }
  
  private static generatePolicyNumber(): string {
    const segments = [
      Math.floor(1000 + Math.random() * 9000).toString(),
      Math.floor(100 + Math.random() * 900).toString(),
      Math.floor(1000 + Math.random() * 9000).toString(),
      Math.floor(100000 + Math.random() * 900000).toString()
    ];
    return segments.join('.');
  }
}
