
interface PDFExtractionResult {
  seguradora?: string;
  numero_apolice?: string;
  item?: string;
  data_emissao?: string;
  inicio?: string;
  fim?: string;
  tipo?: string;
  ramo?: string;
  cobertura?: string;
  cosseguro?: boolean;
  nome_segurado?: string;
  cpf_segurado?: string;
  data_nascimento_segurado?: string;
  email?: string;
  telefone?: string;
  condutor_nome?: string;
  condutor_cpf?: string;
  condutor_nascimento?: string;
  condutor_principal?: boolean;
  proprietario_nome?: string;
  proprietario_cpf?: string;
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
    portas?: number;
    eixos?: number;
    lotacao?: number;
    antifurto?: string;
  };
  valor_mercado?: string;
  premio_veiculo?: number;
  premio_rcf?: number;
  premio_total?: number;
  parcelas?: number;
  valor_parcela?: number;
  forma_pagamento?: string;
  bandeira_cartao?: string;
  fim_validade_cartao?: string;
  pagamento_confirmado?: boolean;
  danos_materiais_terceiros?: number;
  danos_corporais_terceiros?: number;
  danos_morais?: number;
  franquia?: number;
  corretora?: string;
  susep?: string;
}

// Simulação de extração de PDF com IA - em produção seria integrado com API real de OCR
export class PDFExtractor {
  private static readonly SAMPLE_DATA_TEMPLATES: PDFExtractionResult[] = [
    {
      seguradora: "Bradesco",
      numero_apolice: "0865.990.0244.306021",
      item: "0001",
      data_emissao: "2023-11-07",
      inicio: "2023-11-01",
      fim: "2024-11-01",
      tipo: "Auto Prime",
      ramo: "Automóvel",
      cobertura: "Compreensiva",
      cosseguro: false,
      nome_segurado: "TULIO VILASBOAS REIS",
      cpf_segurado: "806.040.055-04",
      data_nascimento_segurado: "1979-03-30",
      email: "TULIOVBREIS@BOL.COM.BR",
      telefone: "71 996150539",
      veiculo: {
        marca: "TOYOTA",
        modelo: "HILUX SW4 SRX 4X4 2.8 TDI 16V",
        ano_fabricacao: "2022",
        ano_modelo: "2022",
        placa: "BVT9A24",
        chassi: "8AJBA3FS9N0324764",
        uso: "Particular",
        tipo: "SUV",
        combustivel: "Diesel",
        portas: 4
      },
      premio_total: 6209.83,
      parcelas: 12,
      valor_parcela: 517.49,
      forma_pagamento: "Cartão de Crédito",
      franquia: 14710.5
    },
    {
      seguradora: "Porto Seguro",
      numero_apolice: "5312.847.0019.552143",
      tipo: "Seguro Vida",
      ramo: "Vida",
      nome_segurado: "MARIA SILVA SANTOS",
      cpf_segurado: "123.456.789-00",
      premio_total: 2400.00,
      parcelas: 12,
      valor_parcela: 200.00,
      forma_pagamento: "Boleto"
    },
    {
      seguradora: "SulAmérica",
      numero_apolice: "7849.123.4567.890123",
      tipo: "Residencial",
      ramo: "Patrimonial",
      nome_segurado: "JOÃO PEREIRA LIMA",
      cpf_segurado: "987.654.321-00",
      premio_total: 1800.00,
      parcelas: 6,
      valor_parcela: 300.00,
      forma_pagamento: "Débito Automático"
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
    
    // Gerar variações nos dados para simular extração real
    const extractedData = { ...selectedTemplate };
    
    // Variar alguns valores
    if (extractedData.premio_total) {
      extractedData.premio_total = extractedData.premio_total * (0.8 + Math.random() * 0.4);
      if (extractedData.parcelas) {
        extractedData.valor_parcela = extractedData.premio_total / extractedData.parcelas;
      }
    }
    
    // Gerar número de apólice único
    extractedData.numero_apolice = this.generatePolicyNumber();
    
    // Atualizar datas para serem mais realistas
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    extractedData.inicio = startDate.toISOString().split('T')[0];
    extractedData.fim = endDate.toISOString().split('T')[0];
    
    console.log(`✅ Dados extraídos com sucesso:`, extractedData);
    return extractedData;
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
