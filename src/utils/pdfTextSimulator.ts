
export class PDFTextSimulator {
  static async simulateTextExtraction(file: File): Promise<string> {
    // Simular diferentes conteúdos baseados no nome do arquivo
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('liberty') || fileName.includes('edson')) {
      return `
        LIBERTY SEGUROS S.A.
        
        DADOS DO CORRETOR
        RCaldas Cor e Adm de Segs Ltda
        
        Apólice nº 53.19.2024.0407195
        Auto Consciente - Responsabilidade Civil Facultativa
        
        DADOS DO SEGURADO
        Nome: EDSON LOPES REIS
        CPF: 123.456.789-00
        
        DADOS DO VEÍCULO
        Marca: TOYOTA
        Modelo: COROLLA XEI 2.0
        Placa: ABC1234
        
        VIGÊNCIA
        Início de Vigência: 05/02/2024
        Fim de Vigência: 05/02/2025
        
        DEMONSTRATIVO DE PRÊMIO
        Prêmio Total (R$): 8.610,12
        
        Parcelamento:
        2024 05/02/2024 717,51
        2024 05/03/2024 717,51
        2024 05/04/2024 717,51
        2024 05/05/2024 717,51
        2024 05/06/2024 717,51
        2024 05/07/2024 717,51
        2024 05/08/2024 717,51
        2024 05/09/2024 717,51
        2024 05/10/2024 717,51
        2024 05/11/2024 717,51
        2024 05/12/2024 717,51
        2025 05/01/2025 717,51
        
        VMR - Tabela FIPE
        emitido por LIBERTY SEGUROS S.A.
      `;
    } else if (fileName.includes('bradesco')) {
      return `
        BRADESCO SEGUROS S.A.
        
        DADOS DO CORRETOR
        Corretora XYZ Ltda
        
        Apólice: 0865.990.0244.306021
        Auto Prime - Cobertura Compreensiva
        
        Segurado: MARIA OLIVEIRA COSTA
        CPF: 987.654.321-00
        
        Veículo: HONDA CIVIC LX
        
        Vigência: 01/11/2023 a 01/11/2024
        Prêmio Total (R$): 3.245,67
        12 parcelas de R$ 270,47
        
        emitido por BRADESCO SEGUROS S.A.
      `;
    } else {
      return `
        PORTO SEGURO CIA DE SEGUROS GERAIS
        
        DADOS DO CORRETOR
        Corretora ABC Seguros
        
        Apólice 7849.123.4567
        
        Segurado: CARLOS PEREIRA LIMA
        Vigência de 15/03/2024 até 15/03/2025
        Prêmio Total (R$): 2.180,50
        Parcelamento em 10 parcelas de R$ 218,05
        
        emitido por PORTO SEGURO CIA DE SEGUROS GERAIS
      `;
    }
  }
}
