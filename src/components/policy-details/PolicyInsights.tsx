import { Lightbulb, TrendingDown, ShieldAlert, CalendarRange } from 'lucide-react';

interface PolicyInsightsProps {
  policy: any;
  installmentsSummary: {
    total: number;
    pagas: number;
    atrasadas: number;
    valorTotal: number;
    valorPago: number;
  };
  totalPortfolioCost?: number;
}

export function PolicyInsights({ policy, installmentsSummary, totalPortfolioCost }: PolicyInsightsProps) {
  const insights: { icon: React.ReactNode; text: string; type: 'info' | 'warning' | 'success' }[] = [];

  const { atrasadas, valorTotal, pagas, total } = installmentsSummary;
  const premiumValue = policy.valor_premio ?? policy.premium ?? 0;

  // Insight: Parcelas em atraso impactam cobertura
  if (atrasadas > 0) {
    insights.push({
      icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      text: `${atrasadas} parcela${atrasadas > 1 ? 's' : ''} em atraso pode${atrasadas > 1 ? 'm' : ''} impactar sua cobertura.`,
      type: 'warning',
    });
  }

  // Insight: Progresso
  if (total > 0 && pagas > 0) {
    const pct = Math.round((pagas / total) * 100);
    if (pct >= 75) {
      insights.push({
        icon: <TrendingDown className="h-4 w-4 text-emerald-500" />,
        text: `Você já pagou ${pct}% das parcelas. Faltam apenas ${total - pagas}.`,
        type: 'success',
      });
    }
  }

  // Insight: Vigência próxima do fim
  const endDate = policy.data_fim_vigencia || policy.endDate;
  if (endDate) {
    const end = new Date(endDate + 'T00:00:00');
    const today = new Date();
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 30) {
      insights.push({
        icon: <CalendarRange className="h-4 w-4 text-amber-500" />,
        text: `A vigência desta apólice encerra em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}. Considere a renovação.`,
        type: 'warning',
      });
    }
  }

  // Insight: % do custo total do portfólio
  if (totalPortfolioCost && totalPortfolioCost > 0 && premiumValue > 0) {
    const pctPortfolio = Math.round((premiumValue / totalPortfolioCost) * 100);
    if (pctPortfolio >= 10) {
      insights.push({
        icon: <TrendingDown className="h-4 w-4 text-primary" />,
        text: `Esta apólice representa ${pctPortfolio}% do seu custo total em seguros.`,
        type: 'info',
      });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        Insights da apólice
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              insight.type === 'warning'
                ? 'bg-amber-500/5 border-amber-200'
                : insight.type === 'success'
                  ? 'bg-emerald-500/5 border-emerald-200'
                  : 'bg-primary/5 border-primary/20'
            }`}
          >
            <div className="pt-0.5 shrink-0">{insight.icon}</div>
            <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
