
export class PDFTextSimulator {
  private static readonly SAMPLE_TEXTS = [
    // Exemplo Liberty Seguros
    `
    LIBERTY SEGUROS
    Apólice: 12345.678.901
    Nome do Segurado: JOÃO SILVA SANTOS
    CPF: 123.456.789-00
    Vigência do Seguro Das 24:00 horas do dia 01/01/2024 às 24:00 horas do dia 31/12/2024
    Prêmio Total (R$): 2.450,00
    Nº Parcelas: 12
    Cobertura: COMPREENSIVA
    Marca/Tipo do Veículo: TOYOTA COROLLA
    Placa: ABC1234
    Código FIPE: 123.456
    
    Parcelas:
    0001 01/01/2024 204,17
    0002 01/02/2024 204,17
    0003 01/03/2024 204,17
    `,
    
    // Exemplo Bradesco Seguros
    `
    BRADESCO SEGUROS
    Apólice: 98765.432.100
    Nome do Segurado: MARIA OLIVEIRA COSTA
    CPF: 987.654.321-00
    Vigência do Seguro Das 24:00 horas do dia 15/03/2024 às 24:00 horas do dia 14/03/2025
    Prêmio Total (R$): 3.240,00
    Nº Parcelas: 10
    Cobertura: BÁSICA
    Marca/Tipo do Veículo: HONDA CIVIC
    Placa: XYZ9876
    Código FIPE: 654.321
    
    Parcelas:
    0001 15/03/2024 324,00
    0002 15/04/2024 324,00
    0003 15/05/2024 324,00
    `,
    
    // Exemplo Porto Seguro
    `
    PORTO SEGURO
    Apólice: 55555.666.777
    Nome do Segurado: CARLOS PEREIRA LIMA
    CPF: 555.666.777-88
    Vigência do Seguro Das 24:00 horas do dia 10/06/2024 às 24:00 horas do dia 09/06/2025
    Prêmio Total (R$): 1.890,00
    Nº Parcelas: 6
    Cobertura: COMPREENSIVA
    Marca/Tipo do Veículo: FORD FIESTA
    Placa: DEF5678
    Código FIPE: 789.012
    
    Parcelas:
    0001 10/06/2024 315,00
    0002 10/07/2024 315,00
    0003 10/08/2024 315,00
    `
  ];

  static async simulateTextExtraction(file: File): Promise<string> {
    console.log('📄 Simulando extração de texto do PDF...');
    
    // Selecionar texto baseado no nome do arquivo
    const fileName = file.name.toLowerCase();
    let selectedText: string;
    
    if (fileName.includes('liberty')) {
      selectedText = this.SAMPLE_TEXTS[0];
    } else if (fileName.includes('bradesco')) {
      selectedText = this.SAMPLE_TEXTS[1];
    } else if (fileName.includes('porto')) {
      selectedText = this.SAMPLE_TEXTS[2];
    } else {
      // Selecionar aleatoriamente
      const randomIndex = Math.floor(Math.random() * this.SAMPLE_TEXTS.length);
      selectedText = this.SAMPLE_TEXTS[randomIndex];
    }
    
    // Simular variações nos dados
    const variatedText = this.addRealisticVariations(selectedText);
    
    console.log('✅ Texto extraído com sucesso');
    return variatedText;
  }

  private static addRealisticVariations(text: string): string {
    // Adicionar variações realistas nos valores
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    // Variar datas para o ano atual
    text = text.replace(/(\d{2}\/\d{2}\/)\d{4}/g, (match, prefix) => {
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${currentYear}`;
    });

    // Variar valores monetários
    text = text.replace(/(\d+\.\d+,\d+)/g, (match) => {
      const baseValue = parseFloat(match.replace('.', '').replace(',', '.'));
      const variation = baseValue * (0.8 + Math.random() * 0.4);
      return variation.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });

    // Variar números de apólice
    text = text.replace(/(\d{5}\.\d{3}\.\d{3})/g, () => {
      const segments = [
        Math.floor(10000 + Math.random() * 90000),
        Math.floor(100 + Math.random() * 900),
        Math.floor(100 + Math.random() * 900)
      ];
      return segments.join('.');
    });

    return text;
  }
}
