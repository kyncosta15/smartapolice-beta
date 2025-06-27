
import { INSURANCE_COMPANIES, INSURER_CONFIGS } from '@/constants/insuranceCompanies';
import { InsurerConfig } from '@/types/insurerConfig';

export class InsurerDetector {
  static detectInsuranceCompany(textoPdf: string): string {
    const textoLower = textoPdf.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    console.log('🔍 Analisando texto para detectar seguradora...');
    
    // 1. Priorizar seções específicas com ordem de prioridade
    const searchSections = this.extractPriorityTextSections(textoLower);
    
    // 2. Buscar por correspondência exata primeiro
    for (const section of searchSections) {
      if (!section.text.trim()) continue;
      
      console.log(`🎯 Analisando seção: ${section.name}`);
      
      for (const seguradora of INSURANCE_COMPANIES) {
        const nomeNormalizado = seguradora.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Busca exata por nome completo
        if (section.text.includes(nomeNormalizado)) {
          console.log(`✅ Seguradora detectada (exata): ${seguradora} na seção ${section.name}`);
          return seguradora;
        }
        
        // Busca por palavras-chave principais
        const palavrasChave = this.extractKeywords(nomeNormalizado);
        const matchScore = this.calculateMatchScore(section.text, palavrasChave);
        
        if (matchScore >= 0.7) {
          console.log(`✅ Seguradora detectada (similaridade ${matchScore.toFixed(2)}): ${seguradora}`);
          return seguradora;
        }
      }
    }
    
    // 3. Fallback: busca fuzzy no texto completo
    const fuzzyResult = this.performFuzzyMatching(textoLower);
    if (fuzzyResult) {
      console.log(`✅ Seguradora detectada (fuzzy): ${fuzzyResult}`);
      return fuzzyResult;
    }
    
    console.log('⚠️ Seguradora não identificada');
    return "Seguradora não identificada";
  }

  private static extractPriorityTextSections(texto: string): Array<{name: string, text: string}> {
    const sections = [];
    
    // Seção 1: "emitido por" - maior prioridade
    const emitidoPorMatch = texto.match(/emitido\s+por\s+([^\n.]{5,100})/i);
    if (emitidoPorMatch) {
      sections.push({
        name: 'emitido_por',
        text: emitidoPorMatch[1].trim()
      });
    }
    
    // Seção 2: Dados do corretor
    const dadosCorretorMatch = texto.match(/dados\s+do\s+corretor[^]*?([a-z\s&.-]{10,150})/i);
    if (dadosCorretorMatch) {
      sections.push({
        name: 'dados_corretor',
        text: dadosCorretorMatch[1].trim()
      });
    }
    
    // Seção 3: Cabeçalho do documento (primeiras 500 chars)
    sections.push({
      name: 'cabecalho',
      text: texto.substring(0, 500)
    });
    
    // Seção 4: Busca por padrões de CNPJ associados
    const cnpjPattern = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
    const cnpjMatches = texto.match(cnpjPattern);
    if (cnpjMatches) {
      // Extrair contexto ao redor dos CNPJs
      cnpjMatches.forEach((cnpj, index) => {
        const cnpjIndex = texto.indexOf(cnpj);
        const context = texto.substring(Math.max(0, cnpjIndex - 100), cnpjIndex + 200);
        sections.push({
          name: `contexto_cnpj_${index}`,
          text: context
        });
      });
    }
    
    return sections;
  }

  private static extractKeywords(nomeSeguradora: string): string[] {
    // Remover palavras comuns e focar nas distintivas
    const stopWords = ['seguros', 'seguradora', 'cia', 'companhia', 'ltda', 's.a.', 'sa'];
    const palavras = nomeSeguradora.split(/\s+/).filter(palavra => 
      palavra.length > 2 && !stopWords.includes(palavra.toLowerCase())
    );
    
    return palavras;
  }

  private static calculateMatchScore(texto: string, palavrasChave: string[]): number {
    if (palavrasChave.length === 0) return 0;
    
    let matchCount = 0;
    let totalWeight = 0;
    
    palavrasChave.forEach(palavra => {
      const weight = palavra.length > 4 ? 2 : 1; // Palavras maiores têm peso maior
      totalWeight += weight;
      
      if (texto.includes(palavra)) {
        matchCount += weight;
      }
    });
    
    return matchCount / totalWeight;
  }

  private static performFuzzyMatching(texto: string): string | null {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const seguradora of INSURANCE_COMPANIES) {
      const nomeNormalizado = seguradora.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const score = this.calculateLevenshteinSimilarity(texto, nomeNormalizado);
      
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = seguradora;
      }
    }
    
    return bestMatch;
  }

  private static calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  static getInsurerConfig(detectedInsurer: string): InsurerConfig {
    // Procurar configuração específica
    for (const config of INSURER_CONFIGS) {
      if (config.name.toLowerCase() === detectedInsurer.toLowerCase()) {
        return config;
      }
    }
    
    // Configuração dinâmica para seguradoras não mapeadas
    return {
      name: detectedInsurer,
      keywords: [detectedInsurer.toLowerCase()],
      patterns: {
        policyNumber: /(?:apólice|apolice|número|numero|n[°º])\s*:?\s*([0-9.-]+)/i,
        annualPremium: /(?:prêmio|premio)\s*(?:total|anual)?\s*(?:\(r\$\))?\s*:?\s*([\d.,]+)/i,
        monthlyPremium: /(?:parcela|mensal|mês)\s*(?:\(r\$\))?\s*:?\s*([\d.,]+)/i,
        startDate: /(?:início|inicio|vigência|de)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        endDate: /(?:fim|final|até|término)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        insuredName: /(?:segurado|nome)\s*:?\s*([a-záêôãçàéíóúü\s]+)/i,
        brokerSection: /(?:corretor|corretora|emitido\s+por)\s*:?\s*([a-záêôãçàéíóúü\s&.-]+)/i
      },
      defaultCategory: "Categoria Padrão",
      defaultCoverage: "Cobertura Básica"
    };
  }
}
