
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
    keywords: ['auto', 'veículo', 'veiculo', 'carro', 'automóvel', 'automovel', 'rcf-v'],
    type: 'auto',
    commonValues: { min: 1500, max: 8000 }
  },
  {
    keywords: ['vida', 'life', 'pessoas', 'individual'],
    type: 'vida',
    commonValues: { min: 800, max: 5000 }
  },
  {
    keywords: ['saúde', 'saude', 'health', 'médico', 'medico', 'plano'],
    type: 'saude',
    commonValues: { min: 2000, max: 12000 }
  },
  {
    keywords: ['residencial', 'residência', 'residencia', 'casa', 'imóvel', 'imovel', 'patrimonial', 'habitacional'],
    type: 'patrimonial',
    commonValues: { min: 1000, max: 6000 }
  },
  {
    keywords: ['empresarial', 'empresa', 'comercial', 'negócio', 'negocio', 'corporativo'],
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

export class PolicyExtractor {
  static extractPolicyType(fileName: string, content?: string): string {
    const searchText = `${fileName} ${content || ''}`.toLowerCase();
    
    for (const policyType of POLICY_TYPES) {
      for (const keyword of policyType.keywords) {
        if (searchText.includes(keyword)) {
          return policyType.type;
        }
      }
    }
    
    // Fallback: analisar valor para determinar tipo
    return 'auto'; // Tipo padrão
  }

  static extractInsurer(fileName: string, content?: string): string {
    const searchText = `${fileName} ${content || ''}`.toLowerCase();
    
    for (const insurer of INSURERS) {
      if (searchText.includes(insurer.toLowerCase())) {
        return insurer;
      }
    }
    
    // Retornar seguradora aleatória baseada em probabilidade de mercado
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
    
    // Ajustar valores baseado na seguradora
    const insurerMultiplier = this.getInsurerMultiplier(insurer);
    const min = baseRange.min * insurerMultiplier;
    const max = baseRange.max * insurerMultiplier;
    
    // Gerar valor realista com distribuição normal
    const range = max - min;
    const mean = min + (range * 0.6); // Média tendendo para valores menores
    const stdDev = range * 0.3;
    
    // Aproximação de distribuição normal
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
}
