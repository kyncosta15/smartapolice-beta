
import { ExtractedPDFData } from '@/types/pdfUpload';

export interface PolicyDataRaw extends ExtractedPDFData {}

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
  vehicle?: string;
  totalCoverage?: number;
  deductible?: number;
  claimRate?: number;
  installments?: Array<{ valor: number; data: string }>;
  paymentMethod?: string;
  file?: File;
  extractedAt: string;
  // Novos campos do modelo expandido
  insuredName?: string;
  insuredCpf?: string;
  insuredEmail?: string;
  insuredPhone?: string;
  vehicleDetails?: {
    brand?: string;
    model?: string;
    year?: string;
    plate?: string;
    chassi?: string;
    fipeCode?: string;
    usage?: string;
    fuel?: string;
  };
  coverageDetails?: {
    materialDamage?: number;
    bodilyInjury?: number;
    moralDamage?: number;
    comprehensive?: boolean;
  };
  broker?: string;
  susepCode?: string;
}

export class PolicyDataParser {
  static parseRobustPolicyData(raw: any): PolicyDataRaw {
    console.log('Parsing enhanced policyData:', raw);
    
    if (typeof raw === 'object' && raw !== null) {
      return raw as PolicyDataRaw;
    }
    
    let str = '';
    if (typeof raw === 'string') {
      str = raw.trim();
      if ((str.startsWith('"') && str.endsWith('"')) ||
          (str.startsWith("'") && str.endsWith("'"))) {
        str = str.slice(1, -1);
      }
      str = str.replace(/\\"/g, '"').replace(/\\'/g, "'");
    } else {
      str = JSON.stringify(raw || {});
    }

    let policy: PolicyDataRaw = {};
    try {
      policy = JSON.parse(str);
      console.log('Successfully parsed enhanced policy data:', policy);
    } catch (err) {
      console.error('Failed to parse policyData:', err);
      policy = {};
    }

    return policy;
  }

  static normalizeType(tipo?: string, ramo?: string): string {
    const combined = `${tipo || ''} ${ramo || ''}`.toLowerCase();
    
    if (combined.includes('auto') || combined.includes('veic') || combined.includes('carro')) {
      return 'auto';
    }
    if (combined.includes('vida') || combined.includes('life')) {
      return 'vida';
    }
    if (combined.includes('saude') || combined.includes('saúde') || combined.includes('health')) {
      return 'saude';
    }
    if (combined.includes('resid') || combined.includes('patri') || combined.includes('casa')) {
      return 'patrimonial';
    }
    if (combined.includes('empres') || combined.includes('comercial') || combined.includes('corp')) {
      return 'empresarial';
    }
    
    return 'auto'; // fallback
  }

  static generatePolicyNumber(originalNumber?: string): string {
    if (originalNumber) return originalNumber;
    
    const prefix = 'POL';
    const number = Math.floor(Math.random() * 900000) + 100000;
    const year = new Date().getFullYear().toString().slice(-2);
    
    return `${prefix}-${year}${number}`;
  }

  static determineStatus(endDate: string): 'active' | 'expiring' | 'expired' {
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (end < now) return 'expired';
    if (end <= thirtyDaysFromNow) return 'expiring';
    return 'active';
  }

  static convertToParsedPolicy(rawData: PolicyDataRaw, fileName: string, file?: File): ParsedPolicyData {
    const type = this.normalizeType(rawData.tipo, rawData.ramo);
    const insurer = rawData.seguradora || 'Seguradora não informada';
    const premium = rawData.premio_total || 0;
    const monthlyAmount = rawData.valor_parcela || (premium / (rawData.parcelas || 12));
    const startDate = rawData.inicio || new Date().toISOString().split('T')[0];
    const endDate = rawData.fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const status = this.determineStatus(endDate);
    
    // Criar nome mais descritivo baseado nos dados extraídos
    let policyName = fileName.replace('.pdf', '');
    if (rawData.veiculo?.marca && rawData.veiculo?.modelo) {
      policyName = `${rawData.veiculo.marca} ${rawData.veiculo.modelo}`;
    } else if (rawData.nome_segurado) {
      policyName = `Apólice ${rawData.nome_segurado.split(' ')[0]}`;
    }
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: policyName,
      type,
      insurer,
      premium,
      monthlyAmount,
      startDate,
      endDate,
      policyNumber: this.generatePolicyNumber(rawData.numero_apolice),
      paymentFrequency: rawData.parcelas ? `${rawData.parcelas}x` : 'mensal',
      status,
      deductible: rawData.franquia,
      paymentMethod: rawData.forma_pagamento,
      file,
      extractedAt: new Date().toISOString(),
      // Campos expandidos
      insuredName: rawData.nome_segurado,
      insuredCpf: rawData.cpf_segurado,
      insuredEmail: rawData.email,
      insuredPhone: rawData.telefone,
      vehicleDetails: rawData.veiculo ? {
        brand: rawData.veiculo.marca,
        model: rawData.veiculo.modelo,
        year: rawData.veiculo.ano_modelo,
        plate: rawData.veiculo.placa,
        chassi: rawData.veiculo.chassi,
        fipeCode: rawData.veiculo.codigo_fipe,
        usage: rawData.veiculo.uso,
        fuel: rawData.veiculo.combustivel
      } : undefined,
      coverageDetails: {
        materialDamage: rawData.danos_materiais_terceiros,
        bodilyInjury: rawData.danos_corporais_terceiros,
        moralDamage: rawData.danos_morais,
        comprehensive: rawData.cobertura === 'Compreensiva'
      },
      broker: rawData.corretora,
      susepCode: rawData.susep
    };
  }
}
