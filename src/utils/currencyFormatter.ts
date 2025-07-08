
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
    minimumFractionDigits = 2,  // Mudança aqui: padrão é 2 casas decimais
    maximumFractionDigits = 2,  // Mudança aqui: padrão é 2 casas decimais
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
export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value, {
    minimumFractionDigits: 2,  // Mudança aqui: sempre 2 casas decimais
    maximumFractionDigits: 2   // Mudança aqui: sempre 2 casas decimais
  });
};

// Função para converter string formatada para número
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};
