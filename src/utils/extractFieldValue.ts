
// Safety function to ensure all values are converted to strings for React rendering
export function safeStringValue(value: any): string {
  if (value === null || value === undefined) {
    return 'Não informado';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'object') {
    try {
      // Try to extract meaningful values from object
      const values = Object.values(value).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        return values.map(v => String(v)).join(' - ');
      }
    } catch (error) {
      console.warn('Error processing object value:', error);
    }
  }
  
  // Fallback - convert to string
  return String(value);
}

export const extractFieldValue = (field: any): string | null => {
  console.log('🔍 Extraindo valor do campo:', field);
  
  if (!field) {
    console.log('❌ Campo é null/undefined');
    return null;
  }

  // 1. string simples
  if (typeof field === 'string' && field.toLowerCase() !== 'undefined' && field.trim() !== '') {
    // Verificar se é um JSON string que precisa ser parseado
    if (field.startsWith('{') && field.endsWith('}')) {
      try {
        const parsed = JSON.parse(field);
        console.log('🔧 String JSON detectada, parseando:', parsed);
        return extractFieldValue(parsed); // Recursão para processar o objeto parseado
      } catch (e) {
        console.log('⚠️ Falha ao parsear JSON, retornando string original:', field);
        return field;
      }
    }
    console.log('✅ Campo é string válida:', field);
    return field;
  }

  // 2. objeto do n8n: { value: '...'}
  if (typeof field === 'object' && field !== null) {
    // Handle N8N object with _type and value structure
    if ('_type' in field && field._type === 'undefined') {
      console.log('⚠️ Campo N8N com _type undefined, retornando null');
      return null;
    }
    
    // Handle the specific N8N structure: {empresa, categoria, cobertura, entidade}
    if ('empresa' in field && field.empresa) {
      const empresaValue = extractFieldValue(field.empresa);
      if (empresaValue) {
        console.log('✅ Extraindo empresa do objeto:', empresaValue);
        return empresaValue;
      }
    }
    
    if ('categoria' in field && field.categoria) {
      const categoriaValue = extractFieldValue(field.categoria);
      if (categoriaValue) {
        console.log('✅ Extraindo categoria do objeto:', categoriaValue);
        return categoriaValue;
      }
    }
    
    if ('cobertura' in field && field.cobertura) {
      const coberturaValue = extractFieldValue(field.cobertura);
      if (coberturaValue) {
        console.log('✅ Extraindo cobertura do objeto:', coberturaValue);
        return coberturaValue;
      }
    }
    
    if ('entidade' in field && field.entidade) {
      const entidadeValue = extractFieldValue(field.entidade);
      if (entidadeValue) {
        console.log('✅ Extraindo entidade do objeto:', entidadeValue);
        return entidadeValue;
      }
    }
    
    if ('value' in field) {
      const v = field.value;
      console.log('🔍 Valor do objeto N8N:', v);
      
      // Handle nested value objects
      if (typeof v === 'object' && v !== null && 'value' in v) {
        if (typeof v.value === 'string' && v.value.toLowerCase() !== 'undefined' && v.value.trim() !== '') {
          console.log('✅ Valor aninhado do objeto N8N é válido:', v.value);
          return v.value;
        }
      } else if (typeof v === 'string' && v.toLowerCase() !== 'undefined' && v.trim() !== '') {
        console.log('✅ Valor do objeto N8N é válido:', v);
        return v;
      }
    }
    
    // Handle other object structures
    if ('name' in field && field.name) {
      const nameValue = extractFieldValue(field.name);
      if (nameValue) {
        console.log('✅ Extraindo name do objeto:', nameValue);
        return nameValue;
      }
    }

    // If object has only one key, try to extract its value
    const keys = Object.keys(field);
    if (keys.length === 1) {
      const singleKey = keys[0];
      const singleValue = field[singleKey];
      
      const extractedValue = extractFieldValue(singleValue);
      if (extractedValue) {
        console.log(`✅ Valor único extraído de ${singleKey}:`, extractedValue);
        return extractedValue;
      }
    }

    console.log('⚠️ Objeto complexo encontrado, tentando extrair string válida:', field);
    // As a last resort, try to find any valid string value in the object
    const findValidString = (obj: any): string | null => {
      if (typeof obj === 'string' && obj.toLowerCase() !== 'undefined' && obj.trim() !== '') {
        return obj;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          const result = findValidString(value);
          if (result) return result;
        }
      }
      return null;
    };
    
    const foundString = findValidString(field);
    if (foundString) {
      console.log('✅ String válida encontrada no objeto:', foundString);
      return foundString;
    }
    
    // Se chegou até aqui, não conseguiu extrair nada válido
    console.log('❌ Não foi possível extrair valor válido do objeto, retornando "Não informado"');
    return 'Não informado';
  }

  // 3. Verificar se é um número (para documentos)
  if (typeof field === 'number') {
    console.log('✅ Campo é número:', field);
    return field.toString();
  }

  console.log('❌ Campo não possui valor válido, retornando "Não informado"');
  return 'Não informado';
};

export function inferTipoPorDocumento(doc: string | null): 'CPF' | 'CNPJ' | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  console.log('🔍 Inferindo tipo por documento. Dígitos:', digits, 'Tamanho:', digits.length);
  if (digits.length === 11) {
    console.log('✅ Documento identificado como CPF');
    return 'CPF';
  }
  if (digits.length === 14) {
    console.log('✅ Documento identificado como CNPJ');
    return 'CNPJ';
  }
  console.log('⚠️ Documento com tamanho inválido para CPF/CNPJ');
  return null;
}
