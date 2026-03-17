import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CalendarDays } from 'lucide-react';
import { MaintenanceLog, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Props {
  logs: MaintenanceLog[];
  onEdit: (log: MaintenanceLog) => void;
  onDelete: (id: string) => void;
}

export default function MaintenanceLogList({ logs, onEdit, onDelete }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">Nenhum registro encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div
          key={log.id}
          className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-2 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{MAINTENANCE_TYPE_ICONS[log.type]}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm">{MAINTENANCE_TYPE_LABELS[log.type]}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(parseISO(log.performed_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-muted-foreground">{log.odometer_km.toLocaleString('pt-BR')} km</span>
            <span className="font-medium">{formatCurrency(log.cost)}</span>
            {log.notes && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={log.notes}>
                {log.notes}
              </span>
            )}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(log)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(log.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
