
// Tipos de status das apólices
export type PolicyStatus = 
  | "vigente"
  | "aguardando_emissao" 
  | "nao_renovada"
  | "pendente_analise";

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
  // ... outros campos existentes
}
