import { DynamicPDFData } from '@/types/pdfUpload';

export interface InstallmentData {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
}

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
  status: 'active' | 'expiring' | 'expired';
  file?: File;
  extractedAt?: string;
  
  // Updated to use proper InstallmentData type
  installments: InstallmentData[];
  
  // Campos expandidos opcionais
  insuredName?: string;
  vehicleDetails?: {
    brand?: string;
    model?: string;
    year?: string;
    plate?: string;
    usage?: string;
  };
  broker?: string;
  
  // Informações de cobertura
  coverageDetails?: {
    materialDamage?: number;
    bodilyInjury?: number;
    comprehensive?: boolean;
  };

  // Legacy fields for compatibility
  entity?: string;
  category?: string;
  coverage?: string[];
  deductible?: number;
  limits?: string;
  totalCoverage?: number;
}
