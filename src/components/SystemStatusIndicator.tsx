import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useSystemStatus, type ServiceStatus } from '@/hooks/useSystemStatus';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SystemStatusIndicatorProps {
  className?: string;
  /** Mostra o rótulo ao lado do ícone (default: true) */
  showLabel?: boolean;
}

const statusConfig: Record<ServiceStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    label: 'Operacional',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    label: 'Degradado',
  },
  offline: {
    icon: XCircle,
    color: 'text-destructive',
    label: 'Indisponível',
  },
  checking: {
    icon: Loader2,
    color: 'text-muted-foreground',
    label: 'Verificando',
  },
};

const overallLabel: Record<ServiceStatus, string> = {
  operational: 'Sistemas operacionais',
  degraded: 'Degradação parcial',
  offline: 'Sistema indisponível',
  checking: 'Verificando...',
};

const serviceLabels = {
  auth: 'Autenticação',
  database: 'Banco de Dados',
  edgeFunctions: 'Funções do Servidor',
} as const;

/**
 * Indicador discreto e expansível com o status de cada serviço (Auth, DB, Edge).
 * Clicar abre um popover detalhado com latência e botão de re-verificação manual.
 */
export function SystemStatusIndicator({ className, showLabel = true }: SystemStatusIndicatorProps) {
  const { status, auth, database, edgeFunctions, lastCheck, recheck } = useSystemStatus();
  const overall = statusConfig[status];
  const OverallIcon = overall.icon;

  const services = [
    { key: 'auth', label: serviceLabels.auth, check: auth },
    { key: 'database', label: serviceLabels.database, check: database },
    { key: 'edgeFunctions', label: serviceLabels.edgeFunctions, check: edgeFunctions },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
            className,
          )}
          title="Ver status do sistema"
        >
          <OverallIcon
            className={cn('h-3.5 w-3.5', overall.color, status === 'checking' && 'animate-spin')}
          />
          {showLabel && <span>{overallLabel[status]}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Status do Sistema</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={recheck}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        </div>

        <div className="divide-y">
          {services.map(({ key, label, check }) => {
            const cfg = statusConfig[check.status];
            const Icon = cfg.icon;
            return (
              <div key={key} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {check.message}
                  </span>
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      cfg.color,
                      check.status === 'checking' && 'animate-spin',
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {lastCheck && (
          <div className="px-4 py-2 border-t text-[11px] text-muted-foreground">
            Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
