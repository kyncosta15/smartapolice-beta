import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Progress } from '@/components/ui/progress';

interface PolicySmartHeaderProps {
  policy: any;
  installmentsSummary: {
    total: number;
    pagas: number;
    atrasadas: number;
    pendentes: number;
    valorTotal: number;
    valorPago: number;
    proximaParcela: { data: string; valor: number } | null;
  };
}

export function PolicySmartHeader({ policy, installmentsSummary }: PolicySmartHeaderProps) {
  const { total, pagas, atrasadas, pendentes, valorTotal, valorPago, proximaParcela } = installmentsSummary;
  
  const percentPago = valorTotal > 0 ? Math.round((valorPago / valorTotal) * 100) : 0;
  
  // Determine overall status
  const overallStatus = atrasadas > 0 
    ? (atrasadas >= 3 ? 'critical' : 'attention')
    : 'ok';
  
  const statusConfig = {
    ok: {
      label: 'Em dia',
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      message: total > 0 
        ? `Todas as ${pagas} parcelas pagas estão em dia.`
        : 'Nenhuma parcela registrada.',
    },
    attention: {
      label: 'Atenção',
      color: 'bg-amber-500/10 text-amber-700 border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      message: `Você possui ${atrasadas} parcela${atrasadas > 1 ? 's' : ''} em atraso que exige${atrasadas > 1 ? 'm' : ''} atenção imediata.`,
    },
    critical: {
      label: 'Crítico',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      message: `${atrasadas} parcelas em atraso — risco de impacto na cobertura do seguro.`,
    },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  const premiumValue = policy.valor_premio ?? policy.premium ?? 0;

  const formatDateBR = (d: string) => {
    if (!d) return '';
    const clean = d.split('T')[0];
    const [y, m, day] = clean.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="space-y-5">
      {/* Status + Dynamic Message */}
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl ${overallStatus === 'ok' ? 'bg-emerald-500/10' : overallStatus === 'attention' ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
          <StatusIcon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-foreground">Resumo da sua apólice hoje</h2>
            <Badge className={`${config.color} border text-xs font-semibold`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.message}
          </p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Prêmio Total</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(premiumValue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Já Pago</p>
          <p className="text-base font-bold text-emerald-600">{percentPago}%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Parcelas</p>
          <p className="text-base font-bold text-foreground">{pagas}/{total}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Próximo Vcto</p>
          <p className="text-sm font-bold text-foreground">
            {proximaParcela ? formatDateBR(proximaParcela.data) : '—'}
          </p>
          {proximaParcela && (
            <p className="text-[11px] text-muted-foreground">{formatCurrency(proximaParcela.valor)}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Progresso do pagamento
            </span>
            <span className="font-semibold text-foreground">{formatCurrency(valorPago)} / {formatCurrency(valorTotal)}</span>
          </div>
          <Progress value={percentPago} className="h-2.5 bg-muted" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{pagas} parcela{pagas !== 1 ? 's' : ''} paga{pagas !== 1 ? 's' : ''}</span>
            <span>{total - pagas} restante{total - pagas !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
