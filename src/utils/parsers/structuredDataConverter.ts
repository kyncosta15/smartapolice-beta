
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

export const convertStructuredData = (data: any, fileName: string, file: File): ParsedPolicyData => {
  return {
    id: crypto.randomUUID(),
    name: data.informacoes_gerais?.segurado || fileName.replace('.pdf', ''),
    type: 'auto',
    insurer: data.seguradora || 'Seguradora não informada',
    premium: Number(data.informacoes_gerais?.valor_premio) || 0,
    monthlyAmount: Number(data.informacoes_gerais?.custo_mensal) || 0,
    startDate: data.vigencia?.inicio || new Date().toISOString().split('T')[0],
    endDate: data.vigencia?.fim || new Date().toISOString().split('T')[0],
    policyNumber: data.informacoes_gerais?.numero_apolice || 'N/A',
    paymentFrequency: 'mensal',
    status: 'vigente',
    file,
    extractedAt: new Date().toISOString(),
    
    // NOVOS CAMPOS OBRIGATÓRIOS
    expirationDate: data.vigencia?.fim || new Date().toISOString().split('T')[0],
    policyStatus: 'vigente',
    
    // Campos opcionais
    installments: [],
    coberturas: data.coberturas || [],
    entity: data.corretora || 'Não informado',
    category: 'Veicular',
    coverage: data.coberturas?.map((c: any) => c.descricao) || [],
    totalCoverage: Number(data.informacoes_gerais?.valor_premio) || 0
  };
};

export class StructuredDataConverter {
  static convertStructuredData = convertStructuredData;
  static convertStructuredDataToPolicy = convertStructuredDataToPolicy;
}
