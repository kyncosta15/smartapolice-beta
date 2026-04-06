import { CheckCircle2, AlertTriangle, Clock, Circle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface TimelineItem {
  numero: number;
  valor: number;
  vencimento: string;
  status: 'pago' | 'vencido' | 'a vencer';
}

interface PolicyInstallmentTimelineProps {
  installments: TimelineItem[];
}

export function PolicyInstallmentTimeline({ installments }: PolicyInstallmentTimelineProps) {
  if (installments.length === 0) return null;

  const formatDateBR = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  const statusConfig = {
    pago: {
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      lineClass: 'bg-emerald-300',
      bgClass: '',
      label: 'Pago',
      badgeClass: 'bg-emerald-500/10 text-emerald-700',
    },
    vencido: {
      icon: AlertTriangle,
      iconClass: 'text-destructive',
      lineClass: 'bg-destructive/30',
      bgClass: 'bg-destructive/5',
      label: 'Atrasado',
      badgeClass: 'bg-destructive/10 text-destructive',
    },
    'a vencer': {
      icon: Clock,
      iconClass: 'text-muted-foreground',
      lineClass: 'bg-border',
      bgClass: '',
      label: 'Pendente',
      badgeClass: 'bg-muted text-muted-foreground',
    },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">Cronograma de Parcelas</h3>
      <div className="relative space-y-0">
        {installments.map((inst, i) => {
          const config = statusConfig[inst.status] || statusConfig['a vencer'];
          const Icon = config.icon;
          const isLast = i === installments.length - 1;

          return (
            <div key={i} className={`flex gap-3 ${config.bgClass} rounded-lg`}>
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center w-6 shrink-0">
                <Icon className={`h-4.5 w-4.5 ${config.iconClass} shrink-0 z-10 bg-background`} />
                {!isLast && <div className={`w-px flex-1 ${config.lineClass} min-h-[20px]`} />}
              </div>

              {/* Content */}
              <div className={`flex items-center justify-between flex-1 pb-3 min-w-0 ${!isLast ? '' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Parcela {inst.numero}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateBR(inst.vencimento)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-foreground">{formatCurrency(inst.valor)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
