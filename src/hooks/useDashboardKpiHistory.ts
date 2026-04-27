import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Linha bruta retornada pela RPC `get_dashboard_kpi_history`.
 * (mês, total de apólices ativas no mês, prêmio mensal do mês)
 */
export interface KpiHistoryRow {
  month_start: string; // 'YYYY-MM-DD'
  total_policies: number;
  monthly_premium: number;
}

/**
 * Calcula a variação percentual entre o último ponto e o anterior.
 * Retorna `null` quando não há base válida para comparação (ex.: anterior = 0).
 */
function pctDelta(series: number[]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return last === 0 ? 0 : null;
  return ((last - prev) / prev) * 100;
}

export interface KpiHistorySeries {
  /** Pontos brutos para sparkline (ordem cronológica) */
  points: number[];
  /** Variação percentual mês atual vs. mês anterior. Pode ser null. */
  deltaPct: number | null;
}

export interface KpiHistoryData {
  rows: KpiHistoryRow[];
  totalPolicies: KpiHistorySeries;
  monthlyPremium: KpiHistorySeries;
  /** Soma rolante 12m terminando em cada mês (proxy do "Custo Anual"). */
  annualCost: KpiHistorySeries;
}

/**
 * Hook que busca a série histórica dos KPIs do dashboard via RPC.
 * Usado para alimentar sparklines e indicadores de variação % nos cards.
 *
 * Requisitos:
 * - Usuário autenticado (a RPC retorna vazio para anônimo)
 * - Série gerada server-side filtrando por `policies.user_id = auth.uid()`
 */
export function useDashboardKpiHistory(months: number = 6) {
  return useQuery<KpiHistoryData>({
    queryKey: ['dashboard-kpi-history', months],
    staleTime: 5 * 60 * 1000, // 5 min — dado histórico muda pouco
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpi_history', {
        _months: months,
      });

      if (error) {
        // Erro silencioso: dashboard segue funcionando sem sparkline
        console.warn('[useDashboardKpiHistory] RPC failed:', error.message);
        return {
          rows: [],
          totalPolicies: { points: [], deltaPct: null },
          monthlyPremium: { points: [], deltaPct: null },
          annualCost: { points: [], deltaPct: null },
        };
      }

      const rows = (data ?? []) as KpiHistoryRow[];

      const totalSeries = rows.map((r) => Number(r.total_policies) || 0);
      const premiumSeries = rows.map((r) => Number(r.monthly_premium) || 0);

      // Custo anual: soma rolante 12m (cap pelo tamanho disponível)
      const annualSeries = rows.map((_, idx) => {
        const start = Math.max(0, idx - 11);
        return premiumSeries.slice(start, idx + 1).reduce((acc, v) => acc + v, 0);
      });

      return {
        rows,
        totalPolicies: { points: totalSeries, deltaPct: pctDelta(totalSeries) },
        monthlyPremium: { points: premiumSeries, deltaPct: pctDelta(premiumSeries) },
        annualCost: { points: annualSeries, deltaPct: pctDelta(annualSeries) },
      };
    },
  });
}
