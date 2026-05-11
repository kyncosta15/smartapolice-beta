import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MaintenanceType, MaintenanceStatusInfo, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import { format, parseISO } from 'date-fns';

interface Props {
  getStatusInfo: (type: MaintenanceType) => MaintenanceStatusInfo;
  types: MaintenanceType[];
}

const STATUS_STYLES: Record<string, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ATENCAO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VENCIDO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  OK: 'Em dia',
  ATENCAO: 'Atenção',
  VENCIDO: 'Vencido',
};

export default function MaintenanceStatusCards({ getStatusInfo, types }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {types.map(type => {
        const info = getStatusInfo(type);
        return (
          <Card key={type} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                {MAINTENANCE_TYPE_ICONS[type]} {MAINTENANCE_TYPE_LABELS[type]}
              </span>
              {(info.lastDate || info.nextDueKm !== null || info.nextDueDate) && (
                <Badge className={`text-[10px] px-1.5 py-0.5 ${STATUS_STYLES[info.status]}`}>
                  {STATUS_LABELS[info.status]}
                </Badge>
              )}
            </div>

            {(info.lastDate || info.nextDueKm !== null || info.nextDueDate) ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                {info.lastDate && (
                  <p>
                    Última: {format(parseISO(info.lastDate), 'dd/MM/yyyy')}
                    {info.lastKm !== null && ` • ${info.lastKm.toLocaleString('pt-BR')} km`}
                  </p>
                )}
                {info.nextDueKm !== null && (
                  <p>
                    Próx. KM: {info.nextDueKm.toLocaleString('pt-BR')} km
                    {info.remainingKm !== null && (
                      <span className={info.remainingKm <= 0 ? ' text-destructive font-medium' : ''}>
                        {' '}({info.remainingKm > 0 ? `faltam ${info.remainingKm.toLocaleString('pt-BR')} km` : 'vencido'})
                      </span>
                    )}
                  </p>
                )}
                {info.nextDueDate && (
                  <p>
                    Próx. Data: {format(parseISO(info.nextDueDate), 'dd/MM/yyyy')}
                    {info.remainingDays !== null && (
                      <span className={info.remainingDays <= 0 ? ' text-destructive font-medium' : ''}>
                        {' '}({info.remainingDays > 0 ? `faltam ${info.remainingDays} dias` : 'vencido'})
                      </span>
                    )}
                  </p>
                )}
                {!info.hasRule && !info.lastDate && (
                  <p className="text-muted-foreground/60 italic">Sem regra configurada</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">Nenhum registro</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
