import { InstallmentData } from '@/types/dynamicPolicyTypes';

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
  
  // Coberturas do N8N - ADICIONADO
  coberturas?: string[];
  
  // Análise de vencimentos
  overdueInstallments?: number;
  upcomingInstallments?: number;
  nextDueDate?: string;
  
  // Legacy fields for compatibility
  entity?: string;
  category?: string;
  coverage?: string[];
  totalCoverage?: number;
}
