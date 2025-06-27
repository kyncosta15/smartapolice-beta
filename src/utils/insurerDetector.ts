
import { INSURANCE_COMPANIES, INSURER_CONFIGS } from '@/constants/insuranceCompanies';
import { InsurerConfig } from '@/types/insurerConfig';

export class InsurerDetector {
  static detectInsuranceCompany(textoPdf: string): string {
    const textoLower = textoPdf.toLowerCase();
    
    // Primeiro, procurar na seção "emitido por" ou "DADOS DO CORRETOR"
    const emitidoPorMatch = textoLower.match(/emitido\s+por\s+([^.\n]+)/i);
    const dadosCorretorMatch = textoLower.match(/dados\s+do\s+corretor[^]*?([a-záêôãç\s&]+)/i);
    
    const searchSections = [
      emitidoPorMatch ? emitidoPorMatch[1] : '',
      dadosCorretorMatch ? dadosCorretorMatch[1] : '',
      textoLower // texto completo como fallback
    ];

    // Buscar por similaridade com os nomes das seguradoras
    for (const section of searchSections) {
      if (!section) continue;
      
      for (const seguradora of INSURANCE_COMPANIES) {
        const nomeNormalizado = seguradora.toLowerCase();
        
        // Busca exata
        if (section.includes(nomeNormalizado)) {
          console.log(`🎯 Seguradora detectada: ${seguradora}`);
          return seguradora;
        }
        
        // Busca por palavras-chave principais
        const palavrasChave = nomeNormalizado.split(' ');
        let matches = 0;
        for (const palavra of palavrasChave) {
          if (palavra.length > 3 && section.includes(palavra)) {
            matches++;
          }
        }
        
        // Se encontrou a maioria das palavras-chave
        if (matches > 0 && matches >= Math.ceil(palavrasChave.length / 2)) {
          console.log(`🎯 Seguradora detectada por similaridade: ${seguradora}`);
          return seguradora;
        }
      }
    }
    
    console.log('⚠️ Seguradora não identificada, usando fallback');
    return "Seguradora não identificada";
  }

  static getInsurerConfig(detectedInsurer: string): InsurerConfig {
    // Procurar configuração específica
    for (const config of INSURER_CONFIGS) {
      if (config.name.toLowerCase() === detectedInsurer.toLowerCase()) {
        return config;
      }
    }
    
    // Configuração genérica para seguradoras não mapeadas
    return {
      name: detectedInsurer,
      keywords: [detectedInsurer.toLowerCase()],
      patterns: {
        policyNumber: /(?:apólice|apolice|número|numero).*?([0-9.-]+)/i,
        annualPremium: /(?:prêmio|premio).*?total.*?(?:r\$)?\s*([\d.,]+)/i,
        monthlyPremium: /(?:parcela|mensal).*?(?:r\$)?\s*([\d.,]+)/i,
        startDate: /(?:início|inicio|vigência).*?(\d{2}\/\d{2}\/\d{4})/i,
        endDate: /(?:fim|final|até).*?(\d{2}\/\d{2}\/\d{4})/i,
        brokerSection: /(?:corretor|emitido\s+por).*?([a-záêôãç\s&]+)/i
      },
      defaultCategory: "Categoria Padrão",
      defaultCoverage: "Cobertura Básica"
    };
  }
}
