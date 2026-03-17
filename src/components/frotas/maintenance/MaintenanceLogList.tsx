import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CalendarDays, Check, X, MapPin, Wrench as WrenchIcon, ShieldCheck } from 'lucide-react';
import { MaintenanceLog, MaintenanceType, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Props {
  logs: MaintenanceLog[];
  onEdit: (log: MaintenanceLog) => void;
  onDelete: (id: string) => void;
}

const REVISAO_TYPES: MaintenanceType[] = ['REVISAO', 'REVISAO_COMPLETA', 'PREVENTIVA', 'CORRETIVA'];

function parseExtraData(notes: string | null) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && parsed._extra) return parsed;
  } catch { /* not JSON */ }
  return null;
}

function getDisplayNotes(notes: string | null): string {
  const extra = parseExtraData(notes);
  if (extra) return extra.observacoes || '';
  return notes || '';
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
      {logs.map(log => {
        const extra = parseExtraData(log.notes);
        const displayNotes = getDisplayNotes(log.notes);
        const isRevisao = REVISAO_TYPES.includes(log.type);

        return (
          <div
            key={log.id}
            className="border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => onEdit(log)}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  log.realizada
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {log.realizada ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  log.realizada
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {log.realizada ? 'Realizada' : 'Pendente'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(log); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Extra details row */}
            {extra && (
              <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {isRevisao ? (
                  <>
                    {extra.local_revisao && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {extra.local_revisao}
                      </span>
                    )}
                    {extra.proxima_revisao_km && (
                      <span>Próx. revisão: {parseInt(extra.proxima_revisao_km).toLocaleString('pt-BR')} km</span>
                    )}
                    {extra.proxima_revisao_data && (
                      <span>Próx. data: {format(parseISO(extra.proxima_revisao_data), 'dd/MM/yyyy')}</span>
                    )}
                    {extra.itens_verificados && (
                      <span className="truncate max-w-[250px]" title={extra.itens_verificados}>
                        Itens: {extra.itens_verificados}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {extra.peca_substituida && (
                      <span className="flex items-center gap-1">
                        <WrenchIcon className="h-3 w-3" /> {extra.peca_substituida}
                      </span>
                    )}
                    {extra.prestador_servico && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {extra.prestador_servico}
                      </span>
                    )}
                    {extra.garantia_meses && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Garantia: {extra.garantia_meses} meses
                      </span>
                    )}
                  </>
                )}
                {displayNotes && (
                  <span className="truncate max-w-[200px] italic" title={displayNotes}>
                    {displayNotes}
                  </span>
                )}
              </div>
            )}
            {!extra && displayNotes && (
              <div className="mt-1 text-xs text-muted-foreground truncate italic" title={displayNotes}>
                {displayNotes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
