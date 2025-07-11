
import { PolicyStatus } from '@/types/policyStatus';

// Mapeamento de cores para cada status (expandido)
export const STATUS_COLORS: Record<string, string> = {
  vigente: "bg-green-100 text-green-800 border-green-200",
  ativa: "bg-green-100 text-green-800 border-green-200",
  aguardando_emissao: "bg-blue-100 text-blue-800 border-blue-200", 
  nao_renovada: "bg-red-100 text-red-800 border-red-200",
  vencida: "bg-red-100 text-red-800 border-red-200",
  pendente_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
  vencendo: "bg-orange-100 text-orange-800 border-orange-200",
  desconhecido: "bg-gray-100 text-gray-800 border-gray-200"
};

// Função para formatar o texto do status
export const formatStatusText = (status: PolicyStatus | string): string => {
  const statusMap: Record<string, string> = {
    vigente: "VIGENTE",
    ativa: "ATIVA", 
    aguardando_emissao: "AGUARDANDO EMISSÃO",
    nao_renovada: "NÃO RENOVADA",
    vencida: "VENCIDA",
    pendente_analise: "PENDENTE ANÁLISE",
    vencendo: "VENCENDO",
    desconhecido: "DESCONHECIDO"
  };
  
  return statusMap[status] || status.replace(/_/g, " ").toUpperCase();
};

// Função para obter a cor do gráfico (apenas a cor base)
export const getChartColor = (status: PolicyStatus | string): string => {
  const colorMap: Record<string, string> = {
    vigente: "#10b981",
    ativa: "#10b981",
    aguardando_emissao: "#3b82f6", 
    nao_renovada: "#ef4444",
    vencida: "#ef4444",
    pendente_analise: "#f59e0b",
    vencendo: "#f97316",
    desconhecido: "#6b7280"
  };
  return colorMap[status] || "#6b7280";
};
