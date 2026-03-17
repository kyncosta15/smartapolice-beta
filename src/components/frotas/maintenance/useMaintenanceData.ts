import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceLog, MaintenanceRule, MaintenanceType, MaintenanceStatus, MaintenanceStatusInfo } from './types';
import { differenceInDays, addMonths, parseISO } from 'date-fns';

export function useMaintenanceData(vehicleId: string) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MaintenanceType | 'ALL'>('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [logsRes, rulesRes] = await Promise.all([
      supabase
        .from('vehicle_maintenance_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_date', { ascending: false })
        .order('odometer_km', { ascending: false })
        .limit(50),
      supabase
        .from('vehicle_maintenance_rules')
        .select('*')
        .eq('vehicle_id', vehicleId),
    ]);

    if (logsRes.data) setLogs(logsRes.data as MaintenanceLog[]);
    if (rulesRes.data) setRules(rulesRes.data as MaintenanceRule[]);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  const getStatusInfo = useCallback((type: MaintenanceType): MaintenanceStatusInfo => {
    const rule = rules.find(r => r.type === type);
    const typeLogs = logs.filter(l => l.type === type);
    const lastLog = typeLogs[0]; // already sorted desc

    const lastDate = lastLog?.performed_date || null;
    const lastKm = lastLog?.odometer_km ?? null;

    // Get current km from the most recent log across all types
    const allKmValues = logs.map(l => l.odometer_km).filter(Boolean);
    const currentKm = allKmValues.length > 0 ? Math.max(...allKmValues) : lastKm;

    let nextDueKm: number | null = null;
    let remainingKm: number | null = null;
    let nextDueDate: string | null = null;
    let remainingDays: number | null = null;
    let status: MaintenanceStatus = 'OK';

    if (rule && lastLog) {
      if (rule.due_every_km && lastKm !== null) {
        nextDueKm = lastKm + rule.due_every_km;
        remainingKm = currentKm !== null ? nextDueKm - currentKm : null;
      }
      if (rule.due_every_months && lastDate) {
        const nextDate = addMonths(parseISO(lastDate), rule.due_every_months);
        nextDueDate = nextDate.toISOString().split('T')[0];
        remainingDays = differenceInDays(nextDate, new Date());
      }

      // Calculate status
      const isOverdueKm = remainingKm !== null && remainingKm <= 0;
      const isOverdueDate = remainingDays !== null && remainingDays <= 0;
      const isAlertKm = remainingKm !== null && rule.alert_before_km !== null && remainingKm <= rule.alert_before_km;
      const isAlertDate = remainingDays !== null && rule.alert_before_days !== null && remainingDays <= rule.alert_before_days;

      if (isOverdueKm || isOverdueDate) {
        status = 'VENCIDO';
      } else if (isAlertKm || isAlertDate) {
        status = 'ATENCAO';
      }
    }

    return {
      type,
      lastDate,
      lastKm,
      nextDueKm,
      remainingKm,
      nextDueDate,
      remainingDays,
      status,
      hasRule: !!rule,
    };
  }, [logs, rules]);

  return { logs: filteredLogs, allLogs: logs, rules, loading, filter, setFilter, fetchData, getStatusInfo };
}
