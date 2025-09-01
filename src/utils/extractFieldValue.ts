

export const extractFieldValue = (field: any): string | null => {
  console.log('🔍 Extraindo valor do campo:', field);
  
  if (!field) {
    console.log('❌ Campo é null/undefined');
    return null;
  }

  // 1. string simples - CORREÇÃO: verificar se toLowerCase existe
  if (typeof field === 'string') {
    if (field === 'undefined' || field.trim() === '') {
      console.log('❌ String vazia ou "undefined"');
      return null;
    }
    
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
    
    // Handle insurer object structure - PRIORIZAR EMPRESA
    if ('empresa' in field && field.empresa) {
      const empresaValue = typeof field.empresa === 'object' && field.empresa.value 
        ? field.empresa.value 
        : field.empresa;
      console.log('✅ Extraindo empresa do objeto:', empresaValue);
      return String(empresaValue);
    }
    
    if ('value' in field) {
      const v = field.value;
      console.log('🔍 Valor do objeto N8N:', v);
      
      // Handle nested value objects
      if (typeof v === 'object' && v !== null && 'value' in v) {
        if (typeof v.value === 'string' && v.value !== 'undefined' && v.value.trim() !== '') {
          console.log('✅ Valor aninhado do objeto N8N é válido:', v.value);
          return v.value;
        }
      } else if (typeof v === 'string' && v !== 'undefined' && v.trim() !== '') {
        console.log('✅ Valor do objeto N8N é válido:', v);
        return v;
      }
    }
    
    // Handle other object structures
    if ('name' in field && field.name) {
      const nameValue = typeof field.name === 'object' && field.name.value 
        ? field.name.value 
        : field.name;
      console.log('✅ Extraindo name do objeto:', nameValue);
      return String(nameValue);
    }

    // Handle categoria, cobertura, entidade objects - mas só se não tiver empresa
    for (const key of ['categoria', 'cobertura', 'entidade']) {
      if (key in field && field[key]) {
        const keyValue = typeof field[key] === 'object' && field[key].value 
          ? field[key].value 
          : field[key];
        console.log(`✅ Extraindo ${key} do objeto:`, keyValue);
        return String(keyValue);
      }
    }

    // If object has only one key, try to extract its value
    const keys = Object.keys(field);
    if (keys.length === 1) {
      const singleKey = keys[0];
      const singleValue = field[singleKey];
      
      if (typeof singleValue === 'object' && singleValue !== null && 'value' in singleValue) {
        if (typeof singleValue.value === 'string' && singleValue.value !== 'undefined' && singleValue.value.trim() !== '') {
          console.log(`✅ Valor único extraído de ${singleKey}:`, singleValue.value);
          return singleValue.value;
        }
      } else if (typeof singleValue === 'string' && singleValue !== 'undefined' && singleValue.trim() !== '') {
        console.log(`✅ Valor único string extraído de ${singleKey}:`, singleValue);
        return singleValue;
      }
    }

    console.log('⚠️ Objeto complexo encontrado, tentando extrair string válida:', field);
    // As a last resort, try to find any valid string value in the object
    const findValidString = (obj: any): string | null => {
      if (typeof obj === 'string' && obj !== 'undefined' && obj.trim() !== '') {
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
    console.log('❌ Não foi possível extrair valor válido do objeto, retornando null');
    return null;
  }

  // 3. Verificar se é um número (para documentos)
  if (typeof field === 'number') {
    console.log('✅ Campo é número:', field);
    return field.toString();
  }

  // CORREÇÃO: Conversão segura para string para outros tipos
  if (field !== null && field !== undefined) {
    const stringValue = String(field);
    if (stringValue !== 'undefined' && stringValue.trim() !== '') {
      console.log('✅ Campo convertido para string:', stringValue);
      return stringValue;
    }
  }

  console.log('❌ Campo não possui valor válido');
  return null;
};

export function inferTipoPorDocumento(doc: string | null): 'CPF' | 'CNPJ' | null {
  if (!doc) return null;
  
  // CORREÇÃO: Conversão segura para string antes de usar replace
  const docString = String(doc);
  const digits = docString.replace(/\D/g, '');
  
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

