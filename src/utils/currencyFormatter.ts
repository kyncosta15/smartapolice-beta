
export const formatCurrency = (value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true
  } = options || {};

  return value.toLocaleString('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits
  });
};

export const formatCurrencyCompact = (value: number): string => {
  // Sempre mostrar o valor completo sem abreviações
  return formatCurrency(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};
