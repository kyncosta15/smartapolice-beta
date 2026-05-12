import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface ReviewItem {
  tipo: string;
  data_revisao: string;
  km_atual: number | null;
  valor: number | null;
}

export interface ScheduledRevision {
  km: number | null;
  data: string | null;
}

export interface TachoStatus {
  inspectionDate: string;
  validUntil: string;
  providerName: string | null;
  certificateNumber: string | null;
  daysRemaining: number;
  status: 'ok' | 'attention' | 'expired';
}

interface FleetIndicatorsValue {
  loading: boolean;
  reviewsByVehicle: Map<string, ReviewItem[]>;
  scheduledByVehicle: Map<string, ScheduledRevision | null>;
  tachoByVehicle: Map<string, TachoStatus | null>;
  invalidate: () => void;
}

const FleetIndicatorsContext = createContext<FleetIndicatorsValue | null>(null);

// Module-level cache keyed by vehicle id batches
const cache = {
  reviews: new Map<string, ReviewItem[]>(),
  scheduled: new Map<string, ScheduledRevision | null>(),
  tacho: new Map<string, TachoStatus | null>(),
  ts: new Map<string, number>(),
};
const CACHE_TTL = 60_000;

function isTruck(categoria?: string | null): boolean {
  if (!categoria) return false;
  return ['caminhao', 'caminhão', 'CAMINHAO', 'Caminhão'].includes(categoria);
}

interface ProviderProps {
  vehicles: { id: string; categoria?: string | null }[];
  children: React.ReactNode;
}

export function FleetIndicatorsProvider({ vehicles, children }: ProviderProps) {
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  const ids = useMemo(() => vehicles.map(v => v.id).sort(), [vehicles]);
  const truckIds = useMemo(
    () => vehicles.filter(v => isTruck(v.categoria)).map(v => v.id),
    [vehicles]
  );
  const idsKey = ids.join(',');

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    // Determine which ids need refresh
    const now = Date.now();
    const stale = ids.filter(id => {
      const ts = cache.ts.get(id);
      return !ts || now - ts > CACHE_TTL;
    });

    if (stale.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const staleTrucks = stale.filter(id => truckIds.includes(id));

    Promise.all([
      supabase
        .from('vehicle_reviews')
        .select('vehicle_id, tipo, data_revisao, km_atual, valor')
        .in('vehicle_id', stale)
        .eq('realizada', true)
        .order('data_revisao', { ascending: false }),
      supabase
        .from('frota_veiculos')
        .select('id, revisao_proxima_km, revisao_proxima_data')
        .in('id', stale),
      staleTrucks.length > 0
        ? supabase
            .from('truck_tachograph_inspections')
            .select('vehicle_id, inspection_date, valid_until, provider_name, certificate_number')
            .in('vehicle_id', staleTrucks)
            .order('inspection_date', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]).then(([reviewsRes, vehiclesRes, tachoRes]) => {
      // Reviews: group by vehicle, take top 3
      const reviewsMap = new Map<string, ReviewItem[]>();
      (reviewsRes.data || []).forEach((r: any) => {
        const list = reviewsMap.get(r.vehicle_id) || [];
        if (list.length < 3) {
          list.push({
            tipo: r.tipo,
            data_revisao: r.data_revisao,
            km_atual: r.km_atual,
            valor: r.valor,
          });
        }
        reviewsMap.set(r.vehicle_id, list);
      });

      // Scheduled
      const scheduledMap = new Map<string, ScheduledRevision | null>();
      (vehiclesRes.data || []).forEach((v: any) => {
        const has = (v.revisao_proxima_km && v.revisao_proxima_km > 0) || v.revisao_proxima_data;
        scheduledMap.set(
          v.id,
          has ? { km: v.revisao_proxima_km, data: v.revisao_proxima_data } : null
        );
      });

      // Tacho: latest per vehicle
      const tachoMap = new Map<string, TachoStatus | null>();
      const today = new Date();
      (tachoRes.data || []).forEach((row: any) => {
        if (tachoMap.has(row.vehicle_id)) return; // ordered desc, first wins
        const validUntil = new Date(row.valid_until + 'T00:00:00');
        const days = differenceInDays(validUntil, today);
        tachoMap.set(row.vehicle_id, {
          inspectionDate: row.inspection_date,
          validUntil: row.valid_until,
          providerName: row.provider_name,
          certificateNumber: row.certificate_number,
          daysRemaining: days,
          status: days < 0 ? 'expired' : days <= 30 ? 'attention' : 'ok',
        });
      });

      // Persist into cache for every stale id (even if empty)
      stale.forEach(id => {
        cache.reviews.set(id, reviewsMap.get(id) || []);
        cache.scheduled.set(id, scheduledMap.get(id) ?? null);
        cache.ts.set(id, now);
      });
      staleTrucks.forEach(id => {
        cache.tacho.set(id, tachoMap.get(id) ?? null);
      });

      setLoading(false);
      setVersion(v => v + 1);
    }).catch(() => {
      setLoading(false);
    });
  }, [idsKey]);

  const value = useMemo<FleetIndicatorsValue>(() => {
    const reviewsByVehicle = new Map<string, ReviewItem[]>();
    const scheduledByVehicle = new Map<string, ScheduledRevision | null>();
    const tachoByVehicle = new Map<string, TachoStatus | null>();
    ids.forEach(id => {
      reviewsByVehicle.set(id, cache.reviews.get(id) || []);
      scheduledByVehicle.set(id, cache.scheduled.get(id) ?? null);
      if (cache.tacho.has(id)) tachoByVehicle.set(id, cache.tacho.get(id) ?? null);
    });
    return {
      loading,
      reviewsByVehicle,
      scheduledByVehicle,
      tachoByVehicle,
      invalidate: () => {
        cache.ts.clear();
        setVersion(v => v + 1);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, loading, version]);

  return (
    <FleetIndicatorsContext.Provider value={value}>
      {children}
    </FleetIndicatorsContext.Provider>
  );
}

export function useFleetIndicators(): FleetIndicatorsValue | null {
  return useContext(FleetIndicatorsContext);
}

export function invalidateFleetIndicatorsCache(vehicleId?: string) {
  if (vehicleId) {
    cache.reviews.delete(vehicleId);
    cache.scheduled.delete(vehicleId);
    cache.tacho.delete(vehicleId);
    cache.ts.delete(vehicleId);
  } else {
    cache.reviews.clear();
    cache.scheduled.clear();
    cache.tacho.clear();
    cache.ts.clear();
  }
}
