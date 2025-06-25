
export interface PolicyBenchmark {
  type: string;
  insurer: string;
  referenceValue: number;
  maxMonthlyValue: number;
}

export interface SavingsBreakdown {
  aboveReference: number;
  duplicatedCoverage: number;
  underutilized: number;
  monthlyExcess: number;
  total: number;
}

export interface SavingsRecommendation {
  policyId: string;
  policyName: string;
  currentValue: number;
  recommendedValue: number;
  potentialSaving: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Benchmarks de referência por tipo de seguro
const DEFAULT_BENCHMARKS: PolicyBenchmark[] = [
  { type: 'auto', insurer: 'Porto Seguro', referenceValue: 2500, maxMonthlyValue: 400 },
  { type: 'auto', insurer: 'Bradesco Seguros', referenceValue: 2300, maxMonthlyValue: 380 },
  { type: 'auto', insurer: 'SulAmérica', referenceValue: 2600, maxMonthlyValue: 420 },
  { type: 'vida', insurer: 'Porto Seguro', referenceValue: 1800, maxMonthlyValue: 300 },
  { type: 'vida', insurer: 'Bradesco Seguros', referenceValue: 1700, maxMonthlyValue: 280 },
  { type: 'saude', insurer: 'SulAmérica', referenceValue: 3500, maxMonthlyValue: 500 },
  { type: 'saude', insurer: 'Bradesco Seguros', referenceValue: 3200, maxMonthlyValue: 480 },
  { type: 'patrimonial', insurer: 'Porto Seguro', referenceValue: 2000, maxMonthlyValue: 350 },
  { type: 'patrimonial', insurer: 'Allianz', referenceValue: 1900, maxMonthlyValue: 330 },
  { type: 'empresarial', insurer: 'Mapfre', referenceValue: 4500, maxMonthlyValue: 750 }
];

export class SavingsCalculator {
  private benchmarks: PolicyBenchmark[];
  private underutilizationRate: number = 0.8;

  constructor(customBenchmarks?: PolicyBenchmark[]) {
    this.benchmarks = customBenchmarks || DEFAULT_BENCHMARKS;
  }

  calculatePotentialSavings(policies: any[]): {
    breakdown: SavingsBreakdown;
    recommendations: SavingsRecommendation[];
  } {
    const breakdown: SavingsBreakdown = {
      aboveReference: 0,
      duplicatedCoverage: 0,
      underutilized: 0,
      monthlyExcess: 0,
      total: 0
    };

    const recommendations: SavingsRecommendation[] = [];

    // 1. Calcular valores acima do referencial
    policies.forEach(policy => {
      const benchmark = this.findBenchmark(policy.type, policy.insurer);
      if (benchmark && policy.premium > benchmark.referenceValue) {
        const saving = policy.premium - benchmark.referenceValue;
        breakdown.aboveReference += saving;
        
        recommendations.push({
          policyId: policy.id,
          policyName: policy.name,
          currentValue: policy.premium,
          recommendedValue: benchmark.referenceValue,
          potentialSaving: saving,
          reason: `Valor acima do benchmark da seguradora ${policy.insurer}`,
          priority: saving > 1000 ? 'high' : saving > 500 ? 'medium' : 'low'
        });
      }
    });

    // 2. Detectar coberturas duplicadas
    const duplicatedSavings = this.detectDuplicatedCoverage(policies);
    breakdown.duplicatedCoverage = duplicatedSavings.total;
    recommendations.push(...duplicatedSavings.recommendations);

    // 3. Identificar apólices subutilizadas
    const underutilizedSavings = this.detectUnderutilizedPolicies(policies);
    breakdown.underutilized = underutilizedSavings.total;
    recommendations.push(...underutilizedSavings.recommendations);

    // 4. Calcular excesso mensal
    policies.forEach(policy => {
      const benchmark = this.findBenchmark(policy.type, policy.insurer);
      const monthlyValue = policy.premium / 12;
      
      if (benchmark && monthlyValue > benchmark.maxMonthlyValue) {
        const saving = (monthlyValue - benchmark.maxMonthlyValue) * 12;
        breakdown.monthlyExcess += saving;
        
        recommendations.push({
          policyId: policy.id,
          policyName: policy.name,
          currentValue: policy.premium,
          recommendedValue: benchmark.maxMonthlyValue * 12,
          potentialSaving: saving,
          reason: `Valor mensal acima do recomendado para ${policy.type}`,
          priority: saving > 800 ? 'high' : saving > 400 ? 'medium' : 'low'
        });
      }
    });

    breakdown.total = breakdown.aboveReference + breakdown.duplicatedCoverage + 
                    breakdown.underutilized + breakdown.monthlyExcess;

    return { breakdown, recommendations };
  }

  private findBenchmark(type: string, insurer: string): PolicyBenchmark | undefined {
    return this.benchmarks.find(b => b.type === type && b.insurer === insurer) ||
           this.benchmarks.find(b => b.type === type);
  }

  private detectDuplicatedCoverage(policies: any[]): {
    total: number;
    recommendations: SavingsRecommendation[];
  } {
    const recommendations: SavingsRecommendation[] = [];
    let total = 0;

    // Agrupar por tipo de seguro
    const groupedPolicies = policies.reduce((acc, policy) => {
      if (!acc[policy.type]) acc[policy.type] = [];
      acc[policy.type].push(policy);
      return acc;
    }, {});

    // Verificar duplicatas em cada grupo
    Object.values(groupedPolicies).forEach((group: any[]) => {
      if (group.length > 1) {
        // Ordenar por valor (menor primeiro)
        group.sort((a, b) => a.premium - b.premium);
        
        // Considerar todas exceto a mais barata como duplicatas
        group.slice(1).forEach(policy => {
          const saving = policy.premium * 0.6; // 60% do valor como economia potencial
          total += saving;
          
          recommendations.push({
            policyId: policy.id,
            policyName: policy.name,
            currentValue: policy.premium,
            recommendedValue: policy.premium * 0.4,
            potentialSaving: saving,
            reason: `Possível cobertura duplicada em ${policy.type}`,
            priority: 'medium'
          });
        });
      }
    });

    return { total, recommendations };
  }

  private detectUnderutilizedPolicies(policies: any[]): {
    total: number;
    recommendations: SavingsRecommendation[];
  } {
    const recommendations: SavingsRecommendation[] = [];
    let total = 0;

    // Simular detecção de subutilização (em produção, seria baseado em dados históricos)
    policies.forEach(policy => {
      // Simular que 30% das apólices são subutilizadas
      const isUnderutilized = Math.random() < 0.3;
      
      if (isUnderutilized) {
        const saving = policy.premium * this.underutilizationRate;
        total += saving;
        
        recommendations.push({
          policyId: policy.id,
          policyName: policy.name,
          currentValue: policy.premium,
          recommendedValue: policy.premium * (1 - this.underutilizationRate),
          potentialSaving: saving,
          reason: 'Apólice com baixa utilização nos últimos 12 meses',
          priority: 'low'
        });
      }
    });

    return { total, recommendations };
  }

  setBenchmarks(benchmarks: PolicyBenchmark[]): void {
    this.benchmarks = benchmarks;
  }

  setUnderutilizationRate(rate: number): void {
    this.underutilizationRate = rate;
  }
}
