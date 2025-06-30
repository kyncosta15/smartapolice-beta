
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
  if (typeof field === 'object' && 'value' in field) {
    const v = field.value;
    console.log('🔍 Valor do objeto N8N:', v);
    if (typeof v === 'string' && v.toLowerCase() !== 'undefined' && v.trim() !== '') {
      console.log('✅ Valor do objeto N8N é válido:', v);
      return v;
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
