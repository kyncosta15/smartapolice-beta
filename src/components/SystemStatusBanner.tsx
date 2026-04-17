import { AlertTriangle, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SystemStatusBannerProps {
  /** Mostra o banner também quando estiver "operacional" (badge verde discreto). */
  showWhenHealthy?: boolean;
  className?: string;
}

/**
 * Banner global que alerta o usuário sobre instabilidade do sistema em tempo real.
 * Substitui mensagens crípticas como "Failed to fetch" por avisos contextualizados.
 */
export function SystemStatusBanner({ showWhenHealthy = false, className }: SystemStatusBannerProps) {
  const { status, message, latencyMs, lastCheck, recheck } = useSystemStatus();

  // Esconder quando tudo OK (a menos que explicitamente solicitado)
  if (status === 'operational' && !showWhenHealthy) return null;
  if (status === 'checking') return null;

  const config = {
    operational: {
      icon: CheckCircle2,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      label: 'Sistema operacional',
    },
    degraded: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      label: 'Sistema instável',
    },
    offline: {
      icon: WifiOff,
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      iconColor: 'text-destructive',
      label: 'Sem conexão',
    },
    checking: {
      icon: RefreshCw,
      bg: 'bg-muted',
      border: 'border-border',
      text: 'text-muted-foreground',
      iconColor: 'text-muted-foreground',
      label: 'Verificando...',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full border-b px-4 py-2.5 flex items-center justify-between gap-3 text-sm',
        config.bg,
        config.border,
        config.text,
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={cn('h-4 w-4 shrink-0', config.iconColor)} />
        <div className="min-w-0">
          <span className="font-semibold">{config.label}:</span>{' '}
          <span className="opacity-90">{message}</span>
          {latencyMs !== null && status !== 'offline' && (
            <span className="opacity-60 ml-2 hidden sm:inline">({latencyMs}ms)</span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={recheck}
        className={cn('h-7 px-2 shrink-0', config.text, 'hover:bg-black/5 dark:hover:bg-white/10')}
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
        Verificar
      </Button>
    </div>
  );
}

/**
 * Indicador minimalista (chip) para usar dentro de cabeçalhos.
 */
export function SystemStatusChip() {
  const { status, message } = useSystemStatus();

  if (status === 'operational' || status === 'checking') return null;

  const config = {
    degraded: {
      bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
      icon: AlertTriangle,
      label: 'Instável',
    },
    offline: {
      bg: 'bg-destructive/15 text-destructive',
      icon: WifiOff,
      label: 'Offline',
    },
  }[status as 'degraded' | 'offline'];

  const Icon = config.icon;
  return (
    <div
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', config.bg)}
      title={message}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}
