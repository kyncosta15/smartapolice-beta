// Função principal de formatação de moeda
export const formatCurrency = (
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
): string => {
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

// Versão compacta SEM abreviações (exibe valor completo, sem K/M)
export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Função para converter string formatada para número
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};
