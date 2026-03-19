import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gauge } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TachoStatus {
  inspectionDate: string;
  validUntil: string;
  providerName: string | null;
  certificateNumber: string | null;
  daysRemaining: number;
  status: 'ok' | 'attention' | 'expired';
}

const tachoCache = new Map<string, { data: TachoStatus | null; ts: number }>();
const CACHE_TTL = 60_000;

function isTruck(categoria?: string | null): boolean {
  if (!categoria) return false;
  return ['caminhao', 'caminhão', 'CAMINHAO', 'Caminhão'].includes(categoria);
}

export function VehicleTachographIndicator({
  vehicleId,
  categoria,
}: {
  vehicleId: string;
  categoria?: string | null;
}) {
  const [status, setStatus] = useState<TachoStatus | null>(null);

  useEffect(() => {
    if (!isTruck(categoria)) return;

    const cached = tachoCache.get(vehicleId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setStatus(cached.data);
      return;
    }

    supabase
      .from('truck_tachograph_inspections')
      .select('inspection_date, valid_until, provider_name, certificate_number')
      .eq('vehicle_id', vehicleId)
      .order('inspection_date', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          tachoCache.set(vehicleId, { data: null, ts: Date.now() });
          setStatus(null);
          return;
        }
        const row = data[0];
        const today = new Date();
        const validUntil = new Date(row.valid_until + 'T00:00:00');
        const days = differenceInDays(validUntil, today);

        const result: TachoStatus = {
          inspectionDate: row.inspection_date,
          validUntil: row.valid_until,
          providerName: row.provider_name,
          certificateNumber: row.certificate_number,
          daysRemaining: days,
          status: days < 0 ? 'expired' : days <= 30 ? 'attention' : 'ok',
        };
        tachoCache.set(vehicleId, { data: result, ts: Date.now() });
        setStatus(result);
      });
  }, [vehicleId, categoria]);

  if (!isTruck(categoria) || !status) return null;

  const colorClass =
    status.status === 'expired'
      ? 'text-destructive'
      : status.status === 'attention'
        ? 'text-yellow-500'
        : 'text-emerald-600 dark:text-emerald-400';

  const statusLabel =
    status.status === 'expired'
      ? `Vencido há ${Math.abs(status.daysRemaining)} dias`
      : status.status === 'attention'
        ? `Vence em ${status.daysRemaining} dias`
        : `OK — vence em ${status.daysRemaining} dias`;

  const fmtDate = (d: string) => {
    try {
      return format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return d;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            <Gauge className={`h-3.5 w-3.5 ${colorClass}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Tacógrafo — {statusLabel}</p>
            <p>
              <span className="text-muted-foreground">Última vistoria:</span>{' '}
              {fmtDate(status.inspectionDate)}
            </p>
            <p>
              <span className="text-muted-foreground">Validade:</span>{' '}
              {fmtDate(status.validUntil)}
            </p>
            {status.providerName && (
              <p>
                <span className="text-muted-foreground">Fornecedor:</span>{' '}
                {status.providerName}
              </p>
            )}
            {status.certificateNumber && (
              <p>
                <span className="text-muted-foreground">Certificado:</span>{' '}
                {status.certificateNumber}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function invalidateTachoCache(vehicleId?: string) {
  if (vehicleId) {
    tachoCache.delete(vehicleId);
  } else {
    tachoCache.clear();
  }
}
