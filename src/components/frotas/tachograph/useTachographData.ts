import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, addYears, parseISO } from 'date-fns';

export interface TachographInspection {
  id: string;
  vehicle_id: string;
  inspection_date: string;
  valid_until: string;
  provider_name: string | null;
  certificate_number: string | null;
  cost: number;
  notes: string | null;
  attachments: any;
  created_at: string;
}

export interface TachographYearlyRecord {
  id: string;
  vehicle_id: string;
  year: number;
  summary: string | null;
  km_start: number | null;
  km_end: number | null;
  incidents: string | null;
  notes: string | null;
  created_at: string;
}

export type TachographStatus = 'OK' | 'ATENCAO' | 'VENCIDO';

export interface TachographStatusInfo {
  status: TachographStatus;
  lastInspection: TachographInspection | null;
  validUntil: string | null;
  remainingDays: number | null;
}

export function useTachographData(vehicleId: string) {
  const [inspections, setInspections] = useState<TachographInspection[]>([]);
  const [yearlyRecords, setYearlyRecords] = useState<TachographYearlyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [inspRes, yearRes] = await Promise.all([
      supabase
        .from('truck_tachograph_inspections')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('inspection_date', { ascending: false })
        .limit(20),
      supabase
        .from('truck_tachograph_yearly_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('year', { ascending: false }),
    ]);

    if (inspRes.data) setInspections(inspRes.data as TachographInspection[]);
    if (yearRes.data) setYearlyRecords(yearRes.data as TachographYearlyRecord[]);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusInfo = useCallback((): TachographStatusInfo => {
    const lastInspection = inspections[0] || null;
    if (!lastInspection) {
      return { status: 'VENCIDO', lastInspection: null, validUntil: null, remainingDays: null };
    }

    const validUntil = lastInspection.valid_until;
    const remainingDays = differenceInDays(parseISO(validUntil), new Date());

    let status: TachographStatus = 'OK';
    if (remainingDays <= 0) status = 'VENCIDO';
    else if (remainingDays <= 30) status = 'ATENCAO';

    return { status, lastInspection, validUntil, remainingDays };
  }, [inspections]);

  return { inspections, yearlyRecords, loading, fetchData, getStatusInfo };
}
