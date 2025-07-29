
export const extractFieldValue = (field: any): string | null => {
  console.log('🔍 Extraindo valor do campo:', field);
  
  if (!field) {
    console.log('❌ Campo é null/undefined');
    return null;
  }

  // 1. string simples
  if (typeof field === 'string' && field.toLowerCase() !== 'undefined' && field.trim() !== '') {
    console.log('✅ Campo é string válida:', field);
    return field;
  }

  // 2. objeto do n8n: { value: '...'}
  if (typeof field === 'object' && field !== null) {
    // Handle N8N object with _type and value structure
    if ('_type' in field && '_type' in field && field._type === 'undefined') {
      console.log('⚠️ Campo N8N com _type undefined, retornando null');
      return null;
    }
    
    // Handle insurer object structure
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
      const nameValue = typeof field.name === 'object' && field.name.value 
        ? field.name.value 
        : field.name;
      console.log('✅ Extraindo name do objeto:', nameValue);
      return String(nameValue);
    }

    // Handle categoria, cobertura, entidade objects
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
        if (typeof singleValue.value === 'string' && singleValue.value.toLowerCase() !== 'undefined' && singleValue.value.trim() !== '') {
          console.log(`✅ Valor único extraído de ${singleKey}:`, singleValue.value);
          return singleValue.value;
        }
      } else if (typeof singleValue === 'string' && singleValue.toLowerCase() !== 'undefined' && singleValue.trim() !== '') {
        console.log(`✅ Valor único string extraído de ${singleKey}:`, singleValue);
        return singleValue;
      }
    }

    console.log('⚠️ Objeto complexo encontrado, convertendo para string:', field);
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
  }

  // 3. Verificar se é um número (para documentos)
  if (typeof field === 'number') {
    console.log('✅ Campo é número:', field);
    return field.toString();
  }

  console.log('❌ Campo não possui valor válido');
  return null;
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
