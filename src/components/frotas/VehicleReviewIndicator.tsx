import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currencyFormatter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useFleetIndicators,
  invalidateFleetIndicatorsCache,
  type ReviewItem,
  type ScheduledRevision,
} from '@/contexts/FleetIndicatorsContext';

const tipoLabels: Record<string, string> = {
  basica: 'Revisão Básica',
  completa: 'Revisão Completa',
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  troca_oleo: 'Troca de Óleo',
  troca_pneus: 'Troca de Pneus',
  troca_freios: 'Troca de Freios',
  troca_filtros: 'Troca de Filtros',
  troca_bateria: 'Troca de Bateria',
  outra: 'Outra',
};

// Standalone (no provider) cache for backward compatibility
const localCache = new Map<
  string,
  { reviews: ReviewItem[]; scheduled: ScheduledRevision | null; ts: number }
>();
const CACHE_TTL = 60_000;

function parseDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function VehicleReviewIndicator({ vehicleId }: { vehicleId: string }) {
  const ctx = useFleetIndicators();
  const [localReviews, setLocalReviews] = useState<ReviewItem[] | null>(null);
  const [localScheduled, setLocalScheduled] = useState<ScheduledRevision | null>(null);

  useEffect(() => {
    if (ctx) return; // batch handles it
    const cached = localCache.get(vehicleId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setLocalReviews(cached.reviews);
      setLocalScheduled(cached.scheduled);
      return;
    }
    Promise.all([
      supabase
        .from('vehicle_reviews')
        .select('tipo, data_revisao, km_atual, valor')
        .eq('vehicle_id', vehicleId)
        .eq('realizada', true)
        .order('data_revisao', { ascending: false })
        .limit(3),
      supabase
        .from('frota_veiculos')
        .select('revisao_proxima_km, revisao_proxima_data')
        .eq('id', vehicleId)
        .maybeSingle(),
    ]).then(([reviewsRes, vehicleRes]) => {
      const reviewsData = (reviewsRes.data as ReviewItem[] | null) ?? [];
      const v = vehicleRes.data as { revisao_proxima_km: number | null; revisao_proxima_data: string | null } | null;
      const sched: ScheduledRevision | null =
        v && ((v.revisao_proxima_km && v.revisao_proxima_km > 0) || v.revisao_proxima_data)
          ? { km: v.revisao_proxima_km, data: v.revisao_proxima_data }
          : null;
      localCache.set(vehicleId, { reviews: reviewsData, scheduled: sched, ts: Date.now() });
      setLocalReviews(reviewsData);
      setLocalScheduled(sched);
    });
  }, [vehicleId, ctx]);

  // While batch is loading, show subtle skeleton placeholder so layout doesn't shift later
  if (ctx?.loading) {
    return <Skeleton className="h-3.5 w-3.5 rounded-sm" />;
  }

  const reviews = ctx ? ctx.reviewsByVehicle.get(vehicleId) || [] : (localReviews || []);
  const scheduled = ctx ? ctx.scheduledByVehicle.get(vehicleId) ?? null : localScheduled;

  const hasReviews = reviews.length > 0;
  const hasScheduled = !!scheduled;

  if (!hasReviews && !hasScheduled) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            <Wrench className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            {hasScheduled && (
              <div className="text-xs">
                <p className="font-medium">Próxima revisão</p>
                <p className="text-muted-foreground">
                  {scheduled!.km && scheduled!.km > 0
                    ? `${Number(scheduled!.km).toLocaleString('pt-BR')} km`
                    : scheduled!.data
                      ? parseDateBR(scheduled!.data)
                      : '—'}
                </p>
              </div>
            )}
            {hasReviews && (
              <>
                <p className="font-medium text-xs">Últimas revisões realizadas</p>
                {reviews.map((r, i) => (
                  <div key={i} className="text-xs border-t border-border pt-1">
                    <p className="font-medium">{tipoLabels[r.tipo] || r.tipo}</p>
                    <p className="text-muted-foreground">
                      {r.data_revisao ? parseDateBR(r.data_revisao) : '—'}
                      {r.km_atual != null && ` • ${Number(r.km_atual).toLocaleString('pt-BR')} km`}
                      {r.valor != null && ` • ${formatCurrency(Number(r.valor))}`}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Invalidate cache for a vehicle (call after saving a review) */
export function invalidateReviewCache(vehicleId?: string) {
  if (vehicleId) {
    localCache.delete(vehicleId);
  } else {
    localCache.clear();
  }
  invalidateFleetIndicatorsCache(vehicleId);
}
