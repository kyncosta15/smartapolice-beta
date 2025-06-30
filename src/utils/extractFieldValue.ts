
export const extractFieldValue = (field: any): string | null => {
  if (!field) return null;

  // 1. string simples
  if (typeof field === 'string' && field.toLowerCase() !== 'undefined') {
    return field;
  }

  // 2. objeto do n8n: { value: '...'}
  if (typeof field === 'object' && 'value' in field) {
    const v = field.value;
    if (typeof v === 'string' && v.toLowerCase() !== 'undefined') return v;
  }

  return null;
};

export function inferTipoPorDocumento(doc: string | null): 'CPF' | 'CNPJ' | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) return 'CPF';
  if (digits.length === 14) return 'CNPJ';
  return null;
}
