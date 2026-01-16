
import { PolicyStatus } from '@/types/policyStatus';

// Mapeamento de cores para cada status (atualizado com cores mais visuais)
export const STATUS_COLORS: Record<string, string> = {
  vigente: "bg-success/20 text-success-foreground border-success/30 hover:bg-success/10",
  ativa: "bg-success/20 text-success-foreground border-success/30 hover:bg-success/10",
  aguardando_emissao: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/5", 
  nao_renovada: "bg-red-100 text-red-800 border-red-200 hover:bg-red-50",
  vencida: "bg-red-100 text-red-800 border-red-200 hover:bg-red-50",
  pendente_analise: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-50",
  vencendo: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-50",
  desconhecido: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-50"
};

// Função para formatar o texto do status
export const formatStatusText = (status: PolicyStatus | string): string => {
  const statusMap: Record<string, string> = {
    vigente: "ATIVA",
    ativa: "ATIVA", 
    aguardando_emissao: "EM RENOVAÇÃO",
    nao_renovada: "ANTIGA",
    antiga: "ANTIGA",
    vencida: "ANOS ANTERIORES",
    pendente_analise: "EM ANÁLISE",
    vencendo: "VENCENDO",
    desconhecido: "DESCONHECIDO"
  };
  
  return statusMap[status] || status.replace(/_/g, " ").toUpperCase();
};

// Função para obter a cor do gráfico (apenas a cor base)
export const getChartColor = (status: PolicyStatus | string): string => {
  const colorMap: Record<string, string> = {
    vigente: "#c4a574",    // Soft Fawn (success)
    ativa: "#c4a574",      // Soft Fawn (success)
    aguardando_emissao: "#0c1539",  // Prussian Blue (primary)
    nao_renovada: "#ef4444",        // Vermelho
    vencida: "#dc2626",             // Vermelho mais escuro
    pendente_analise: "#f59e0b",    // Amarelo/Laranja
    vencendo: "#f97316",            // Laranja
    desconhecido: "#6b7280"         // Cinza
  };
  return colorMap[status] || "#6b7280";
};
