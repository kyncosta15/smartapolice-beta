import { ParsedPolicyData } from '@/utils/policyDataParser';

interface StructuredData {
  insuredName?: string;
  policyType?: string;
  insurer?: string;
  premium?: number;
  monthlyAmount?: number;
  startDate?: string;
  endDate?: string;
  policyNumber?: string;
  paymentFrequency?: string;
  status?: string;
  broker?: string;
  coverage?: string[];
  materialDamage?: number;
  bodilyInjury?: number;
  comprehensive?: boolean;
  installments?: any[];
}

export const convertStructuredDataToPolicy = (data: StructuredData): ParsedPolicyData => {

  return {
    id: crypto.randomUUID(),
    name: data.insuredName || 'Segurado não informado',
    type: data.policyType || 'auto',
    insurer: data.insurer || 'Seguradora não informada',
    premium: data.premium || 0,
    monthlyAmount: data.monthlyAmount || 0,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || new Date().toISOString().split('T')[0],
    policyNumber: data.policyNumber || 'N/A',
    paymentFrequency: data.paymentFrequency || 'mensal',
    status: data.status || 'active',
    extractedAt: new Date().toISOString(),
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.endDate || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',
    
    // Campos opcionais
    installments: data.installments || [],
    coberturas: [],
    entity: data.broker || 'Não informado',
    category: data.policyType === 'auto' ? 'Veicular' : 'Outros',
    coverage: data.coverage || [],
    totalCoverage: data.premium || 0,
    
    // Detalhes expandidos
    coverageDetails: {
      materialDamage: data.materialDamage,
      bodilyInjury: data.bodilyInjury,
      comprehensive: data.comprehensive
    }
  };
};
