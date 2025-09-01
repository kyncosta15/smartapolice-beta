
// CORREÇÃO COMPLETA: Função para extrair valores seguros de qualquer tipo de dado

export function extractFieldValue(value: any): string {
  // Se é null, undefined ou string vazia, retornar string vazia
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // Se já é string, retornar diretamente
  if (typeof value === 'string') {
    return value;
  }
  
  // Se é número, converter para string
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // Se é boolean, converter para string
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  // Se é um objeto do N8N com propriedades específicas
  if (value && typeof value === 'object') {
    // Verificar se é um objeto N8N com as propriedades esperadas
    if (value.empresa || value.categoria || value.cobertura || value.entidade) {
      // Extrair o primeiro valor disponível do objeto N8N
      return extractFieldValue(value.empresa || value.categoria || value.cobertura || value.entidade);
    }
    
    // Se tem uma propriedade 'value', usar ela
    if (value.value !== undefined) {
      return extractFieldValue(value.value);
    }
    
    // Se tem uma propriedade 'text', usar ela
    if (value.text !== undefined) {
      return extractFieldValue(value.text);
    }
    
    // Se tem uma propriedade 'name', usar ela
    if (value.name !== undefined) {
      return extractFieldValue(value.name);
    }
    
    // Se é um array, pegar o primeiro elemento
    if (Array.isArray(value) && value.length > 0) {
      return extractFieldValue(value[0]);
    }
    
    // Se é um objeto Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Para outros objetos, tentar converter para JSON e depois extrair uma representação útil
    try {
      const stringified = JSON.stringify(value);
      // Se o JSON é muito longo, retornar uma representação mais simples
      if (stringified.length > 100) {
        return '[Objeto Complexo]';
      }
      return stringified;
    } catch {
      return '[Objeto]';
    }
  }
  
  // Fallback: converter qualquer coisa para string
  try {
    return String(value);
  } catch {
    return '';
  }
}

// Função auxiliar para detectar tipo de documento baseado no valor extraído
export function inferDocumentType(documento: any): 'CPF' | 'CNPJ' {
  const docString = extractFieldValue(documento);
  
  if (!docString) return 'CPF';
  
  // Remover caracteres não numéricos
  const numbersOnly = docString.replace(/\D/g, '');
  
  // Se tem 14 dígitos, é CNPJ
  if (numbersOnly.length === 14) {
    return 'CNPJ';
  }
  
  // Caso contrário, assumir CPF
  return 'CPF';
}

// Função para extrair valores numéricos seguros
export function extractNumericValue(value: any): number {
  const stringValue = extractFieldValue(value);
  
  if (!stringValue) return 0;
  
  // Remover caracteres não numéricos exceto ponto e vírgula
  const cleanValue = stringValue.replace(/[^\d.,]/g, '');
  
  // Converter vírgula para ponto (formato brasileiro)
  const normalizedValue = cleanValue.replace(',', '.');
  
  const parsed = parseFloat(normalizedValue);
  
  return isNaN(parsed) ? 0 : parsed;
}
