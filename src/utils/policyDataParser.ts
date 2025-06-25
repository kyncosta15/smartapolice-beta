
export interface PolicyDataRaw {
  seguradora?: string;
  tipo?: string;
  inicio?: string;
  fim?: string;
  premio?: number;
  parcelas?: Array<{ valor: number; data: string }>;
  pagamento?: string;
  custo_mensal?: number;
  veiculo?: string;
  cobertura_total?: number;
  franquia?: number;
  sinistralidade?: number;
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
  vehicle?: string;
  totalCoverage?: number;
  deductible?: number;
  claimRate?: number;
  installments?: Array<{ valor: number; data: string }>; // Fixed: using Portuguese property names
  paymentMethod?: string;
  file?: File;
  extractedAt: string;
}

export class PolicyDataParser {
  static parseRobustPolicyData(raw: any): PolicyDataRaw {
    console.log('Parsing policyData:', raw);
    
    let str = '';
    if (typeof raw === 'string') {
      str = raw.trim();
      if ((str.startsWith('"') && str.endsWith('"')) ||
          (str.startsWith("'") && str.endsWith("'"))) {
        str = str.slice(1, -1);
      }
      str = str.replace(/\\"/g, '"').replace(/\\'/g, "'");
    } else if (typeof raw === 'object' && raw !== null) {
      return raw as PolicyDataRaw;
    } else {
      str = JSON.stringify(raw || {});
    }

    let policy: PolicyDataRaw = {};
    try {
      policy = JSON.parse(str);
      console.log('Successfully parsed policy data:', policy);
    } catch (err) {
      console.error('Failed to parse policyData:', err);
      policy = {};
    }

    return policy;
  }

  static normalizeType(tipo?: string): string {
    if (!tipo) return 'auto';
    
    const typeMap: { [key: string]: string } = {
      'auto': 'auto',
      'automovel': 'auto',
      'carro': 'auto',
      'vida': 'vida',
      'saude': 'saude',
      'saúde': 'saude',
      'empresarial': 'empresarial',
      'empresa': 'empresarial',
      'patrimonial': 'patrimonial',
      'residencial': 'patrimonial',
      'imovel': 'patrimonial',
      'imóvel': 'patrimonial'
    };
    
    return typeMap[tipo.toLowerCase()] || tipo.toLowerCase();
  }

  static generatePolicyNumber(type: string, insurer: string): string {
    const prefixes: { [key: string]: string } = {
      'auto': 'AUTO',
      'vida': 'VIDA',
      'saude': 'SAUDE',
      'patrimonial': 'PATRI',
      'empresarial': 'EMPR'
    };
    
    const prefix = prefixes[type] || 'POL';
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
    const type = this.normalizeType(rawData.tipo);
    const insurer = rawData.seguradora || 'Seguradora não informada';
    const premium = rawData.premio || 0;
    const monthlyAmount = rawData.custo_mensal || (premium / 12);
    const startDate = rawData.inicio || new Date().toISOString().split('T')[0];
    const endDate = rawData.fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const status = this.determineStatus(endDate);
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: rawData.veiculo || fileName.replace('.pdf', ''),
      type,
      insurer,
      premium,
      monthlyAmount,
      startDate,
      endDate,
      policyNumber: this.generatePolicyNumber(type, insurer),
      paymentFrequency: rawData.pagamento || 'mensal',
      status,
      vehicle: rawData.veiculo,
      totalCoverage: rawData.cobertura_total,
      deductible: rawData.franquia,
      claimRate: rawData.sinistralidade,
      installments: rawData.parcelas,
      paymentMethod: rawData.pagamento,
      file,
      extractedAt: new Date().toISOString()
    };
  }
}
