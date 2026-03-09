import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currencyFormatter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VehicleReview {
  tipo: string;
  data_revisao: string;
  km_atual: number | null;
  valor: number | null;
  realizada: boolean;
}

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

// Cache to avoid repeated queries
const reviewCache = new Map<string, { data: VehicleReview[] | null; ts: number }>();
const CACHE_TTL = 60_000; // 1 min

export function VehicleReviewIndicator({ vehicleId }: { vehicleId: string }) {
  const [reviews, setReviews] = useState<VehicleReview[] | null>(null);

  useEffect(() => {
    const cached = reviewCache.get(vehicleId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setReviews(cached.data);
      return;
    }

    supabase
      .from('vehicle_reviews')
      .select('tipo, data_revisao, km_atual, valor, realizada')
      .eq('vehicle_id', vehicleId)
      .eq('realizada', true)
      .order('data_revisao', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        const result = (data as VehicleReview[] | null) ?? [];
        reviewCache.set(vehicleId, { data: result, ts: Date.now() });
        setReviews(result);
      });
  }, [vehicleId]);

  if (!reviews || reviews.length === 0) return null;

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
            <p className="font-medium text-xs">Últimas revisões realizadas</p>
            {reviews.map((r, i) => (
              <div key={i} className="text-xs border-t border-border pt-1">
                <p className="font-medium">{tipoLabels[r.tipo] || r.tipo}</p>
                <p className="text-muted-foreground">
                  {r.data_revisao
                    ? format(new Date(r.data_revisao + 'T12:00:00'), 'dd/MM/yyyy')
                    : '—'}
                  {r.km_atual != null && ` • ${Number(r.km_atual).toLocaleString('pt-BR')} km`}
                  {r.valor != null && ` • ${formatCurrency(Number(r.valor))}`}
                </p>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Invalidate cache for a vehicle (call after saving a review) */
export function invalidateReviewCache(vehicleId?: string) {
  if (vehicleId) {
    reviewCache.delete(vehicleId);
  } else {
    reviewCache.clear();
  }
}
