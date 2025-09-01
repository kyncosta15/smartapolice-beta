
/**
 * Extrator de dados seguro para lidar com diferentes formatos de dados
 * vindos do N8N e outras fontes
 */

export class SafeDataExtractor {
  /**
   * Extrai o nome do segurado de diferentes formatos de dados
   */
  static extractInsuredName(segurado: any): string | null {
    if (!segurado) return null;
    
    // Se é uma string simples
    if (typeof segurado === 'string') {
      return segurado.trim();
    }
    
    // Se é um objeto com propriedade 'nome'
    if (typeof segurado === 'object' && segurado.nome) {
      return typeof segurado.nome === 'string' ? segurado.nome.trim() : null;
    }
    
    // Se é um objeto com propriedade 'name'
    if (typeof segurado === 'object' && segurado.name) {
      return typeof segurado.name === 'string' ? segurado.name.trim() : null;
    }
    
    // Se é um objeto com propriedade 'value'
    if (typeof segurado === 'object' && segurado.value) {
      if (typeof segurado.value === 'string') {
        return segurado.value.trim();
      }
      // Recursão para objetos aninhados
      return this.extractInsuredName(segurado.value);
    }
    
    console.warn('⚠️ Formato de segurado não reconhecido:', segurado);
    return null;
  }

  /**
   * Extrai o nome da seguradora de diferentes formatos, priorizando 'empresa'
   */
  static extractInsurerName(seguradora: any): string | null {
    if (!seguradora) return null;
    
    // Se é uma string simples
    if (typeof seguradora === 'string') {
      return seguradora.trim();
    }
    
    // Se é um objeto, tentar extrair campos na ordem de prioridade
    if (typeof seguradora === 'object') {
      // Prioridade 1: empresa
      if (seguradora.empresa) {
        if (typeof seguradora.empresa === 'string') {
          return seguradora.empresa.trim();
        }
        if (typeof seguradora.empresa === 'object' && seguradora.empresa.value) {
          return String(seguradora.empresa.value).trim();
        }
      }
      
      // Prioridade 2: name
      if (seguradora.name) {
        if (typeof seguradora.name === 'string') {
          return seguradora.name.trim();
        }
        if (typeof seguradora.name === 'object' && seguradora.name.value) {
          return String(seguradora.name.value).trim();
        }
      }
      
      // Prioridade 3: value
      if (seguradora.value) {
        if (typeof seguradora.value === 'string') {
          return seguradora.value.trim();
        }
        // Recursão para objetos aninhados
        const extracted = this.extractInsurerName(seguradora.value);
        if (extracted) return extracted;
      }
      
      // Prioridade 4: categoria, cobertura, entidade (estrutura N8N específica)
      const fallbackFields = ['categoria', 'cobertura', 'entidade'];
      for (const field of fallbackFields) {
        if (seguradora[field]) {
          if (typeof seguradora[field] === 'string') {
            return seguradora[field].trim();
          }
          if (typeof seguradora[field] === 'object' && seguradora[field].value) {
            return String(seguradora[field].value).trim();
          }
        }
      }
    }
    
    console.warn('⚠️ Formato de seguradora não reconhecido:', seguradora);
    return null;
  }

  /**
   * Extrai número da apólice de diferentes formatos
   */
  static extractPolicyNumber(data: any): string | null {
    if (!data) return null;
    
    // Campos possíveis para número da apólice
    const fields = ['numero_apolice', 'apolice', 'policy_number', 'policyNumber'];
    
    for (const field of fields) {
      if (data[field]) {
        if (typeof data[field] === 'string') {
          return data[field].trim();
        }
        if (typeof data[field] === 'number') {
          return data[field].toString();
        }
        // Se é objeto, tentar extrair value
        if (typeof data[field] === 'object' && data[field].value) {
          return data[field].value.toString();
        }
      }
    }
    
    return null;
  }

  /**
   * Normaliza dados financeiros
   */
  static extractFinancialValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(numericValue) ? 0 : numericValue;
    }
    if (typeof value === 'object' && value !== null) {
      // Tentar extrair de propriedades comuns
      const fields = ['value', 'amount', 'valor', 'premio'];
      for (const field of fields) {
        if (value[field] !== undefined) {
          return this.extractFinancialValue(value[field]);
        }
      }
    }
    return 0;
  }
}
