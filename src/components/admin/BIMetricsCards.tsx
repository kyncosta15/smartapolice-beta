import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { BIMetrics } from '@/hooks/useCorpNuvemBIMetrics';

interface BIMetricsCardsProps {
  metrics: BIMetrics | null;
  loading: boolean;
  year: number;
}

export function BIMetricsCards({ metrics, loading, year }: BIMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'PRODUÇÃO TOTAL',
      value: metrics.producao_total,
      change: -1.6,
      color: 'bg-[#0052A3]',
      textColor: 'text-white',
      year: year.toString()
    },
    {
      title: 'NOVOS',
      value: metrics.novos,
      change: -21.3,
      color: 'bg-[#0078D4]',
      textColor: 'text-white'
    },
    {
      title: 'RENOVAÇÕES',
      value: metrics.renovacoes,
      change: 13.1,
      color: 'bg-[#10b981]',
      textColor: 'text-white'
    },
    {
      title: 'FATURAS',
      value: metrics.faturas,
      change: 0,
      color: 'bg-[#E5E7EB]',
      textColor: 'text-gray-800'
    },
    {
      title: 'ENDOSSOS',
      value: metrics.endossos,
      change: 0,
      color: 'bg-[#9CA3AF]',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.color} border-0`}>
          <CardContent className="p-3 md:p-4">
            <div className={`text-xs font-semibold ${card.textColor} mb-1`}>
              {card.title}
              {card.year && (
                <span className="ml-2 opacity-90">{card.year}</span>
              )}
            </div>
            <div className={`text-2xl md:text-3xl font-bold ${card.textColor} mb-1`}>
              {card.value.toLocaleString('pt-BR')}
            </div>
            <div className={`flex items-center gap-1 text-xs ${card.textColor}`}>
              {card.change !== 0 && (
                <>
                  {card.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-semibold">
                    {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                  </span>
                  <span className={`ml-1 ${card.change > 0 ? 'rotate-180' : ''}`}>
                    {card.change > 0 ? '▲' : '▼'}
                  </span>
                </>
              )}
              {card.change === 0 && (
                <span className="font-semibold">0%</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
