import React from 'react';
import { Shield, CheckCircle2, DollarSign, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PolicyKPIsProps {
  total: number;
  vigentes: number;
  premioMensalTotal: number;
  proximoVencimento?: { name: string; date: string } | null;
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (raw?: string) => {
  if (!raw) return '—';
  const d = String(raw).slice(0, 10).split('-');
  if (d.length !== 3) return raw;
  return `${d[2]}/${d[1]}/${d[0]}`;
};

interface KpiProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tone: 'primary' | 'emerald' | 'amber' | 'sky';
}

const toneMap: Record<KpiProps['tone'], string> = {
  primary: 'text-primary bg-primary/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  sky: 'text-sky-500 bg-sky-500/10',
};

const Kpi: React.FC<KpiProps> = ({ label, value, hint, icon: Icon, tone }) => (
  <div className="rounded-xl border border-border bg-card p-2.5 sm:p-4 flex items-start gap-2 sm:gap-3 hover:border-primary/30 transition-colors min-w-0">
    <div
      className={cn(
        'h-7 w-7 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0',
        toneMap[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-muted-foreground uppercase leading-tight">
        {label}
      </div>
      <div
        className="text-sm sm:text-xl font-bold text-foreground tabular-nums leading-tight break-words"
        title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[10px] sm:text-xs text-muted-foreground truncate" title={hint}>
          {hint}
        </div>
      )}
    </div>
  </div>
);

export const PolicyKPIs: React.FC<PolicyKPIsProps> = ({
  total,
  vigentes,
  premioMensalTotal,
  proximoVencimento,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi label="Total" value={total} icon={Shield} tone="primary" hint="Apólices cadastradas" />
      <Kpi
        label="Vigentes"
        value={vigentes}
        icon={CheckCircle2}
        tone="emerald"
        hint={total > 0 ? `${Math.round((vigentes / total) * 100)}% da carteira` : undefined}
      />
      <Kpi
        label="Prêmio mensal"
        value={fmtBRL(premioMensalTotal)}
        icon={DollarSign}
        tone="sky"
        hint="Soma de todas as apólices vigentes"
      />
      <Kpi
        label="Próximo vencimento"
        value={proximoVencimento ? fmtDate(proximoVencimento.date) : '—'}
        icon={CalendarClock}
        tone="amber"
        hint={proximoVencimento?.name}
      />
    </div>
  );
};
