
export interface InstallmentData {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
}

// Importar os novos tipos
import { PolicyStatus } from '@/types/policyStatus';

export interface ParsedPolicyData {
  id: string;
  name: string;
  type: string;
  insurer: string;
  premium: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  policyNumber: string;
  paymentFrequency: string;
  status: string;
  file?: File;
  extractedAt: string;
  
  // NOVOS CAMPOS ADICIONADOS
  expirationDate: string;    // ISO date
  policyStatus: PolicyStatus; // Status específico de renovação
  
  // Parcelas individuais
  installments: Array<{
    numero: number;
    valor: number;
    data: string;
    status: 'paga' | 'pendente';
  }>;
  
  // Campos expandidos
  insuredName?: string;
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  vehicleModel?: string;
  uf?: string;
  deductible?: number;
  
  // Coberturas do N8N com LMI - UPDATED
  coberturas?: Array<{
    descricao: string;
    lmi?: number;
  }>;
  
  // Análise de vencimentos
  overdueInstallments?: number;
  upcomingInstallments?: number;
  nextDueDate?: string;
  
  // Legacy fields for compatibility
  entity?: string;
  category?: string;
  coverage?: string[];
  totalCoverage?: number;
  
  // Additional missing properties
  claimRate?: number;
  pdfPath?: string;
  broker?: string;
  vehicleDetails?: {
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    usage?: string;
  };
  
  // Coverage details structure
  coverageDetails?: {
    materialDamage?: number;
    bodilyInjury?: number;
    comprehensive?: boolean;
  };
  
  // ADDED: Missing quantidade_parcelas property
  quantidade_parcelas?: number;
  
  // ADDED: Missing responsavel_nome property
  responsavel_nome?: string;
}
