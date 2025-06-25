
export interface PolicyType {
  keywords: string[];
  type: string;
  commonValues: {
    min: number;
    max: number;
  };
}

export const POLICY_TYPES: PolicyType[] = [
  {
    keywords: ['auto', 'veículo', 'veiculo', 'carro', 'automóvel', 'automovel', 'rcf-v', 'seguro auto', 'veicular'],
    type: 'auto',
    commonValues: { min: 1500, max: 8000 }
  },
  {
    keywords: ['vida', 'life', 'pessoas', 'individual', 'seguro de vida'],
    type: 'vida',
    commonValues: { min: 800, max: 5000 }
  },
  {
    keywords: ['saúde', 'saude', 'health', 'médico', 'medico', 'plano', 'seguro saude'],
    type: 'saude',
    commonValues: { min: 2000, max: 12000 }
  },
  {
    keywords: ['residencial', 'residência', 'residencia', 'casa', 'imóvel', 'imovel', 'patrimonial', 'habitacional', 'seguro residencial'],
    type: 'patrimonial',
    commonValues: { min: 1000, max: 6000 }
  },
  {
    keywords: ['empresarial', 'empresa', 'comercial', 'negócio', 'negocio', 'corporativo', 'seguro empresarial'],
    type: 'empresarial',
    commonValues: { min: 3000, max: 15000 }
  }
];

export const INSURERS = [
  'Porto Seguro',
  'Bradesco Seguros',
  'SulAmérica',
  'Allianz',
  'Mapfre',
  'Zurich',
  'Itaú Seguros',
  'Tokio Marine',
  'Liberty Seguros',
  'HDI Seguros'
];

export interface ExtractedPolicyData {
  type: string;
  insurer: string;
  premium: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  policyNumber: string;
  paymentFrequency: 'mensal' | 'anual' | 'semestral' | 'trimestral';
}

export class PolicyExtractor {
  static extractPolicyType(fileName: string, content?: string): string {
    const searchText = `${fileName} ${content || ''}`.toLowerCase();
    
    // Primeiro, tentar identificar por palavras-chave específicas
    for (const policyType of POLICY_TYPES) {
      for (const keyword of policyType.keywords) {
        if (searchText.includes(keyword)) {
          return policyType.type;
        }
      }
    }
    
    // Se não encontrou por palavras-chave, tentar identificar por contexto
    if (searchText.includes('veic') || searchText.includes('auto') || searchText.includes('carro')) {
      return 'auto';
    }
    
    if (searchText.includes('casa') || searchText.includes('resid') || searchText.includes('patri')) {
      return 'patrimonial';
    }
    
    // Fallback padrão
    return 'auto';
  }

  static extractInsurer(fileName: string, content?: string): string {
    const searchText = `${fileName} ${content || ''}`.toLowerCase();
    
    for (const insurer of INSURERS) {
      if (searchText.includes(insurer.toLowerCase())) {
        return insurer;
      }
    }
    
    // Distribuição por market share
    const marketShare = [
      { insurer: 'Porto Seguro', weight: 0.25 },
      { insurer: 'Bradesco Seguros', weight: 0.20 },
      { insurer: 'SulAmérica', weight: 0.15 },
      { insurer: 'Allianz', weight: 0.12 },
      { insurer: 'Mapfre', weight: 0.10 },
      { insurer: 'Zurich', weight: 0.08 },
      { insurer: 'Itaú Seguros', weight: 0.05 },
      { insurer: 'Tokio Marine', weight: 0.03 },
      { insurer: 'Liberty Seguros', weight: 0.02 }
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const { insurer, weight } of marketShare) {
      cumulative += weight;
      if (random <= cumulative) {
        return insurer;
      }
    }
    
    return 'Porto Seguro';
  }

  static generateRealisticPremium(type: string, insurer: string): number {
    const policyType = POLICY_TYPES.find(pt => pt.type === type);
    const baseRange = policyType?.commonValues || { min: 1000, max: 5000 };
    
    const insurerMultiplier = this.getInsurerMultiplier(insurer);
    const min = baseRange.min * insurerMultiplier;
    const max = baseRange.max * insurerMultiplier;
    
    const range = max - min;
    const mean = min + (range * 0.6);
    const stdDev = range * 0.3;
    
    let value = mean + (Math.random() + Math.random() - 1) * stdDev;
    value = Math.max(min, Math.min(max, value));
    
    return Math.round(value);
  }

  private static getInsurerMultiplier(insurer: string): number {
    const multipliers: { [key: string]: number } = {
      'Porto Seguro': 1.0,
      'Bradesco Seguros': 0.95,
      'SulAmérica': 1.05,
      'Allianz': 1.10,
      'Mapfre': 0.90,
      'Zurich': 1.15,
      'Itaú Seguros': 0.98,
      'Tokio Marine': 1.08,
      'Liberty Seguros': 0.92,
      'HDI Seguros': 1.02
    };
    
    return multipliers[insurer] || 1.0;
  }

  static generatePolicyNumber(type: string): string {
    const prefixes: { [key: string]: string } = {
      'auto': 'AUTO',
      'vida': 'VIDA',
      'saude': 'SAUDE',
      'patrimonial': 'PATRI',
      'empresarial': 'EMPR'
    };
    
    const prefix = prefixes[type] || 'APOLICE';
    const number = Math.floor(Math.random() * 900000) + 100000;
    const year = new Date().getFullYear().toString().slice(-2);
    
    return `${prefix}-${year}${number}`;
  }

  static generatePolicyDates(): { startDate: string; endDate: string } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  static determinePaymentFrequency(premium: number): 'mensal' | 'anual' | 'semestral' | 'trimestral' {
    // Lógica simples baseada no valor
    if (premium > 10000) return 'anual';
    if (premium > 5000) return 'semestral';
    if (premium > 2000) return 'trimestral';
    return 'mensal';
  }

  static calculateMonthlyAmount(premium: number, frequency: string): number {
    const multipliers: { [key: string]: number } = {
      'mensal': 1,
      'trimestral': 1 / 3,
      'semestral': 1 / 6,
      'anual': 1 / 12
    };
    
    return Math.round(premium * (multipliers[frequency] || 1));
  }

  static extractCompletePolicy(fileName: string, content?: string): ExtractedPolicyData {
    const type = this.extractPolicyType(fileName, content);
    const insurer = this.extractInsurer(fileName, content);
    const premium = this.generateRealisticPremium(type, insurer);
    const { startDate, endDate } = this.generatePolicyDates();
    const policyNumber = this.generatePolicyNumber(type);
    const paymentFrequency = this.determinePaymentFrequency(premium);
    const monthlyAmount = this.calculateMonthlyAmount(premium, paymentFrequency);

    return {
      type,
      insurer,
      premium,
      monthlyAmount,
      startDate,
      endDate,
      policyNumber,
      paymentFrequency
    };
  }
}
