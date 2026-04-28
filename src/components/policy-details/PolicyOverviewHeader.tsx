import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PolicyOverviewHeaderProps {
  policy: any;
  onDelete: () => void;
  onEdit?: () => void;
  onRenew?: () => void;
  onDownloadPdf?: () => void;
}

/**
 * Cabeçalho compacto e elegante (light/dark) — inspirado no design de referência.
 * Usa tokens semânticos do design system (sem cores hard-coded).
 */
export const PolicyOverviewHeader: React.FC<PolicyOverviewHeaderProps> = ({
  policy,
  onDelete,
  onEdit,
  onRenew,
  onDownloadPdf,
}) => {
  // Datas (parse manual para não sofrer com timezone)
  const parseDate = (raw?: string | null): Date | null => {
    if (!raw) return null;
    const clean = String(raw).split('T')[0];
    const [y, m, d] = clean.split('-').map((p) => parseInt(p, 10));
    if (!y || !m || !d) {
      // Fallback: já em DD/MM/YYYY
      const parts = String(raw).split('/');
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
        if (dd && mm && yyyy) return new Date(yyyy, mm - 1, dd);
      }
      return null;
    }
    return new Date(y, m - 1, d);
  };
  const fmt = (d?: Date | null) =>
    d
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      : '—';

  const start = parseDate(
    policy?.startDate || policy?.inicio_vigencia || policy?.inicio || policy?.inicioVigencia,
  );
  const end = parseDate(
    policy?.endDate || policy?.fim_vigencia || policy?.fim || policy?.fimVigencia,
  );

  // Progresso de vigência
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let pct = 0;
  let elapsed = 0;
  let remaining = 0;
  let totalDays = 0;
  if (start && end && end.getTime() > start.getTime()) {
    totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    elapsed = Math.max(0, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    remaining = Math.max(0, totalDays - elapsed);
    pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  }

  // Status
  const expired = end ? end.getTime() < today.getTime() : false;
  const expiringSoon = !expired && remaining > 0 && remaining <= 30;
  const statusLabel = expired ? 'Vencida' : expiringSoon ? 'Vencendo' : 'Vigente';
  const statusTone = expired
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : expiringSoon
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

  const dotTone = expired
    ? 'bg-destructive'
    : expiringSoon
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const barTone = expired
    ? 'bg-destructive'
    : expiringSoon
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const title = policy?.name || policy?.segurado || 'Apólice';
  const policyNumber = policy?.policyNumber || policy?.numero_apolice || '—';
  const tipo = policy?.tipo_seguro || policy?.type || 'Seguro';
  const seguradora = policy?.seguradora || policy?.insurer || '—';

  return (
    <div className="space-y-4">
      {/* Topo: status + nº apólice + ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border',
                statusTone,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', dotTone)} />
              {statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Apólice nº <span className="font-mono text-foreground/80">{policyNumber}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tipo} · {seguradora}
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onDownloadPdf && (
            <Button variant="outline" size="sm" onClick={onDownloadPdf} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {onRenew && (
            <Button size="sm" onClick={onRenew} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Renovar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            aria-label="Excluir apólice"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Card de Vigência com progresso */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Vigência
          </span>
          {start && end && (
            <span
              className={cn(
                'text-xs font-semibold',
                expired
                  ? 'text-destructive'
                  : expiringSoon
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {expired ? `Vencida há ${Math.abs(remaining || 0)} dias` : `${elapsed} dias decorridos`}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-4 mb-2">
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Início
            </div>
            <div className="text-sm font-semibold text-foreground">{fmt(start)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Fim
            </div>
            <div className="text-sm font-semibold text-foreground">{fmt(end)}</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barTone)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {start && end && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            {expired ? 'Apólice vencida' : `${remaining} dias restantes`}
          </div>
        )}
      </div>
    </div>
  );
};
