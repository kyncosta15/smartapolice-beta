import React from 'react';
import { HardHat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VehicleAssignmentIndicatorProps {
  hasAssignmentInfo?: boolean;
  responsibleName?: string | null;
  worksiteName?: string | null;
  worksiteStartDate?: string | null;
}

export function VehicleAssignmentIndicator({
  hasAssignmentInfo,
  responsibleName,
  worksiteName,
  worksiteStartDate,
}: VehicleAssignmentIndicatorProps) {
  if (!hasAssignmentInfo) return null;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
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
            <HardHat className="h-4 w-4 text-amber-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p><span className="font-semibold">Responsável:</span> {responsibleName || '-'}</p>
            <p><span className="font-semibold">Obra:</span> {worksiteName || '-'}</p>
            <p><span className="font-semibold">Desde:</span> {formatDate(worksiteStartDate)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
