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
function computeDelta(series: number[]): { deltaPct: number | null; deltaStatus: 'ok' | 'insufficient' | 'baseline-zero' } {
  // Considera "histórico real" apenas pontos com valor > 0 — assim um KPI que só
  // começou a ter dados no mês corrente é tratado como insuficiente, e não como
  // um pico de +infinito%.
  const nonZero = series.filter((v) => v > 0);
  if (series.length < 2 || nonZero.length < 2) {
    return { deltaPct: null, deltaStatus: 'insufficient' };
  }
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) {
    return { deltaPct: null, deltaStatus: 'baseline-zero' };
  }
  return { deltaPct: ((last - prev) / prev) * 100, deltaStatus: 'ok' };
}

export interface KpiHistorySeries {
  /** Pontos brutos para sparkline (ordem cronológica) */
  points: number[];
  /** Variação percentual mês atual vs. mês anterior. Pode ser null. */
  deltaPct: number | null;
  /**
   * Motivo pelo qual o delta é insuficiente/inútil (quando aplicável).
   * - 'ok': delta é confiável
   * - 'insufficient': menos de 2 meses com dado real (>0)
   * - 'baseline-zero': mês anterior era 0 — variação % matematicamente infinita/inútil
   */
  deltaStatus: 'ok' | 'insufficient' | 'baseline-zero';
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
        const empty = { points: [], deltaPct: null, deltaStatus: 'insufficient' as const };
        return {
          rows: [],
          totalPolicies: empty,
          monthlyPremium: empty,
          annualCost: empty,
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
        totalPolicies: { points: totalSeries, ...computeDelta(totalSeries) },
        monthlyPremium: { points: premiumSeries, ...computeDelta(premiumSeries) },
        annualCost: { points: annualSeries, ...computeDelta(annualSeries) },
      };
    },
  });
}
