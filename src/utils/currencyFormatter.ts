
// Função principal de formatação de moeda
export const formatCurrency = (
  value: number | undefined | null,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
): string => {
  // Validação para evitar erro com undefined/null
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options || {};

  return value.toLocaleString('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits
  });
};

// Versão compacta que agora mostra valor completo sem abreviações
export const formatCurrencyCompact = (value: number | undefined | null): string => {
  return formatCurrency(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para converter string formatada para número
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};
