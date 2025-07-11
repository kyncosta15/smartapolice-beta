
import { PolicyStatus } from '@/types/policyStatus';

// Mapeamento de cores para cada status
export const STATUS_COLORS: Record<PolicyStatus, string> = {
  vigente: "bg-green-100 text-green-800 border-green-200",
  aguardando_emissao: "bg-blue-100 text-blue-800 border-blue-200", 
  nao_renovada: "bg-red-100 text-red-800 border-red-200",
  pendente_analise: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

// Função para formatar o texto do status
export const formatStatusText = (status: PolicyStatus): string => {
  return status.replace(/_/g, " ").toUpperCase();
};

// Função para obter a cor do gráfico (apenas a cor base)
export const getChartColor = (status: PolicyStatus): string => {
  const colorMap = {
    vigente: "#10b981",
    aguardando_emissao: "#3b82f6", 
    nao_renovada: "#ef4444",
    pendente_analise: "#f59e0b"
  };
  return colorMap[status];
};
