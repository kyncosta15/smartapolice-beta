
export class PolicyTypeNormalizer {
  private static readonly TYPE_MAP: { [key: string]: string } = {
    'auto': 'auto',
    'automovel': 'auto',
    'veicular': 'auto',
    'veiculos': 'auto',
    'vida': 'vida',
    'saude': 'saude',
    'residencial': 'patrimonial',
    'patrimonial': 'patrimonial',
    'empresarial': 'empresarial',
    'acidentes pessoais': 'acidentes_pessoais',
    'acidentes pessoais - estagiario': 'acidentes_pessoais',
    'garantia': 'garantia_obrigacoes',
    'garantia de obrigacoes': 'garantia_obrigacoes',
    'garantia obrigacoes': 'garantia_obrigacoes',
    'seguro garantia': 'garantia_obrigacoes'
  };

  private static sanitizeType(tipo: string): string {
    return tipo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  static normalizeType(tipo: string): string {
    const normalized = this.sanitizeType(tipo || '');

    if (!normalized) return 'auto';

    if (normalized.includes('acidentes pessoais')) {
      return 'acidentes_pessoais';
    }

    if (normalized.includes('empresarial')) {
      return 'empresarial';
    }

    if (normalized.includes('garantia')) {
      return 'garantia_obrigacoes';
    }
    
    return this.TYPE_MAP[normalized] || 'auto';
  }

  static determineStatus(endDate: string): 'active' | 'expiring' | 'expired' {
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (end < now) return 'expired';
    if (end <= thirtyDaysFromNow) return 'expiring';
    return 'active';
  }
}
