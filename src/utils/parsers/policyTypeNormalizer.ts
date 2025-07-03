
export class PolicyTypeNormalizer {
  private static readonly TYPE_MAP: { [key: string]: string } = {
    'auto': 'auto',
    'automóvel': 'auto',
    'automovel': 'auto',
    'veicular': 'auto',
    'veiculos': 'auto',
    'vida': 'vida',
    'saúde': 'saude',
    'saude': 'saude',
    'residencial': 'patrimonial',
    'patrimonial': 'patrimonial',
    'empresarial': 'empresarial',
    'acidentes pessoais': 'acidentes_pessoais',
    'acidentes pessoais - estagiário': 'acidentes_pessoais',
    'acidentes pessoais - estagiario': 'acidentes_pessoais'
  };

  static normalizeType(tipo: string): string {
    const normalized = tipo.toLowerCase().trim();
    
    // Verificar se contém "acidentes pessoais" em qualquer variação
    if (normalized.includes('acidentes pessoais')) {
      return 'acidentes_pessoais';
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
