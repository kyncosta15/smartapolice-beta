import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Building, FileText, Tag, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { renderValueAsString } from '@/utils/renderValue';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: {
    name: string;
    insurer: string;
    value: number;
    dueDate: string;
    insertDate: string;
    type?: string;
    status?: string;
    policyNumber?: string;
  } | null;
}

// Parse YYYY-MM-DD evitando shift de timezone
const parseCalendarDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const clean = String(dateString).split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  if (!y || !m || !d) {
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(y, m - 1, d);
};

const formatDate = (dateString?: string): string => {
  const date = parseCalendarDate(dateString);
  if (!date) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

export function NewPolicyModal({ isOpen, onClose, policy }: NewPolicyModalProps) {
  if (!policy) return null;

  // Status calculado pela data de vencimento
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseCalendarDate(policy.dueDate);
  const diffMs = dueDate ? dueDate.getTime() - today.getTime() : 0;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = dueDate ? diffDays < 0 : false;
  const isExpiring = dueDate ? diffDays >= 0 && diffDays <= 30 : false;
  const daysAbs = Math.abs(diffDays);

  // Insertion date para timeline
  const insertDateFmt = formatDate(policy.insertDate);
  const dueDateFmt = formatDate(policy.dueDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border bg-card">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          {/* Linha decorativa de status no topo */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              isExpired
                ? 'bg-destructive'
                : isExpiring
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />

          <div className="flex items-center gap-2 mb-2">
            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Não Renovada
              </span>
            ) : isExpiring ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Vencendo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Vigente
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {isExpired ? 'Apólice expirada' : isExpiring ? 'Próxima do vencimento' : 'Apólice ativa'}
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground leading-tight">
            {policy.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {renderValueAsString(policy.insurer)}
            {policy.type && (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="capitalize">{policy.type}</span>
              </>
            )}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Banner de alerta para vencidas / vencendo */}
          {(isExpired || isExpiring) && (
            <div
              className={`flex items-center gap-3 p-3.5 rounded-lg border ${
                isExpired
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div
                className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-md ${
                  isExpired ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isExpired ? 'text-destructive' : 'text-amber-700 dark:text-amber-300'}`}>
                  {isExpired
                    ? `Apólice vencida há ${daysAbs} ${daysAbs === 1 ? 'dia' : 'dias'}`
                    : `Vence em ${daysAbs} ${daysAbs === 1 ? 'dia' : 'dias'}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isExpired
                    ? `Venceu em ${dueDateFmt} · Renovação pendente`
                    : `Vencimento em ${dueDateFmt}`}
                </p>
              </div>
              <Button
                size="sm"
                variant={isExpired ? 'destructive' : 'default'}
                className="shrink-0"
                onClick={onClose}
              >
                Renovar agora
              </Button>
            </div>
          )}

          {/* Grid 2x3 de campos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field icon={Building} label="Seguradora" value={renderValueAsString(policy.insurer) || '—'} />
            <Field icon={FileText} label="Número" value={policy.policyNumber || '—'} />
            <Field
              icon={DollarSign}
              label="Valor Total"
              value={formatCurrency(policy.value)}
            />
            <Field icon={Tag} label="Tipo" value={policy.type ? capitalize(policy.type) : '—'} />
            <Field icon={Calendar} label="Inserida" value={insertDateFmt} />
            <Field
              icon={Calendar}
              label="Vencimento"
              value={dueDateFmt}
              valueClassName={isExpired ? 'text-destructive' : isExpiring ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}
              labelClassName={isExpired ? 'text-destructive' : undefined}
            />
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="relative h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${
                  isExpired ? 'bg-destructive' : isExpiring ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: isExpired ? '100%' : isExpiring ? '85%' : '50%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground tabular-nums">{insertDateFmt}</span>
              <span className={`flex items-center gap-1 font-medium ${
                isExpired ? 'text-destructive' : isExpiring ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                <Clock className="h-3 w-3" />
                {isExpired
                  ? `Expirada · ${daysAbs} ${daysAbs === 1 ? 'dia' : 'dias'} atrás`
                  : isExpiring
                  ? `Vence em ${daysAbs} ${daysAbs === 1 ? 'dia' : 'dias'}`
                  : `${daysAbs} ${daysAbs === 1 ? 'dia restante' : 'dias restantes'}`}
              </span>
              <span className="text-muted-foreground tabular-nums">{dueDateFmt}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onClose}>
            Ver detalhes completos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Helpers =====

interface FieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}

function Field({ icon: Icon, label, value, valueClassName, labelClassName }: FieldProps) {
  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-1.5 text-xs ${labelClassName ?? 'text-muted-foreground'}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-sm font-semibold truncate ${valueClassName ?? 'text-foreground'}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
