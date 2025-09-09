/**
 * SISTEMA ROBUSTO DE CONVERSÃO DE DADOS PARA REACT
 * Garante que NUNCA um objeto seja passado para componentes React
 */

export interface SafeValue {
  value: string;
  original: any;
  converted: boolean;
}

/**
 * Converte qualquer valor para string de forma segura para React
 */
export function safeConvert(value: any): SafeValue {
  if (value === null || value === undefined) {
    return {
      value: 'Não informado',
      original: value,
      converted: true
    };
  }

  if (typeof value === 'string') {
    return {
      value: value.trim() || 'Não informado',
      original: value,
      converted: false
    };
  }

  if (typeof value === 'number') {
    return {
      value: value.toString(),
      original: value,
      converted: true
    };
  }

  if (typeof value === 'boolean') {
    return {
      value: value ? 'Sim' : 'Não',
      original: value,
      converted: true
    };
  }

  if (Array.isArray(value)) {
    const stringValues = value
      .map(item => safeConvert(item).value)
      .filter(v => v !== 'Não informado')
      .join(', ');
    
    return {
      value: stringValues || 'Lista vazia',
      original: value,
      converted: true
    };
  }

  // Objeto - extrair valores conhecidos
  if (typeof value === 'object') {
    const knownFields = [
      'empresa', 'categoria', 'cobertura', 'entidade',
      'nome', 'name', 'descricao', 'value', 'razaoSocial'
    ];

    for (const field of knownFields) {
      if (value[field] && value[field] !== null && value[field] !== undefined) {
        const fieldResult = safeConvert(value[field]);
        if (fieldResult.value !== 'Não informado') {
          return {
            value: fieldResult.value,
            original: value,
            converted: true
          };
        }
      }
    }

    // Tentar extrair qualquer string válida
    try {
      const allValues = Object.values(value)
        .filter(v => v !== null && v !== undefined)
        .map(v => safeConvert(v).value)
        .filter(v => v !== 'Não informado');

      if (allValues.length > 0) {
        return {
          value: allValues[0], // Pegar o primeiro valor válido
          original: value,
          converted: true
        };
      }
    } catch (error) {
      console.warn('Erro ao processar objeto:', error);
    }

    return {
      value: 'Dados não disponíveis',
      original: value,
      converted: true
    };
  }

  // Fallback final
  try {
    return {
      value: String(value),
      original: value,
      converted: true
    };
  } catch (error) {
    return {
      value: 'Erro na conversão',
      original: value,
      converted: true
    };
  }
}

/**
 * Converte para string simples (compatibilidade)
 */
export function safeString(value: any): string {
  return safeConvert(value).value;
}

/**
 * Converte um objeto completo para formato seguro
 */
export function safeConvertObject<T extends Record<string, any>>(obj: T): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>;
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = safeString(obj[key]);
    }
  }
  
  return result;
}

/**
 * Converte uma lista de objetos
 */
export function safeConvertArray<T extends Record<string, any>>(arr: T[]): Array<Record<keyof T, string>> {
  return arr.map(item => safeConvertObject(item));
}

/**
 * Validador para garantir que não há objetos
 */
export function validateNoObjects(data: any): boolean {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    console.error('OBJETO DETECTADO - NÃO DEVE SER RENDERIZADO:', data);
    return false;
  }
  
  if (Array.isArray(data)) {
    return data.every(item => validateNoObjects(item));
  }
  
  return true;
}