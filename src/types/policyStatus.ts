
// Tipos de status das apólices (expandido)
export type PolicyStatus = 
  | "vigente"
  | "ativa"
  | "aguardando_emissao" 
  | "nao_renovada"
  | "vencida"
  | "pendente_analise"
  | "vencendo"
  | "desconhecido";

// Interface estendida da apólice com novos campos
export interface PolicyWithStatus {
  id: string;
  name: string;
  insurer: string;
  policyNumber: string;
  type: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  expirationDate: string;    // ISO date
  status: PolicyStatus;
  nosnum?: number;
  codfil?: number;
  // ... outros campos existentes
}
