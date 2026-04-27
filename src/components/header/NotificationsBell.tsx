import { Bell, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { cn } from '@/lib/utils';

interface NotificationsBellProps {
  /** Callback do dashboard para mudar a seção ativa quando o usuário clica numa notificação. */
  onNavigateSection?: (section: string) => void;
}

/**
 * Sino de notificações global do header.
 *
 * Mostra um badge com o total de itens (cap em 9+) e abre um popover com a lista
 * — atualmente focado em apólices próximas do vencimento. O popover é leve:
 * cabeçalho, lista (até 5 itens) e link "Ver todas". Sem som, sem polling agressivo
 * (cache de 2 min via React Query).
 */
export function NotificationsBell({ onNavigateSection }: NotificationsBellProps) {
  const { data, isLoading } = useGlobalNotifications();
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-xl border-border hover:bg-accent"
          aria-label={`Notificações${total > 0 ? ` (${total} novas)` : ''}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {total > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 inline-flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
                'bg-destructive text-destructive-foreground ring-2 ring-background',
              )}
              aria-hidden
            >
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
            <span className="text-[11px] text-muted-foreground font-medium">
              {total === 0
                ? 'Tudo em dia'
                : `${total} ${total === 1 ? 'item' : 'itens'}`}
            </span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="size-6 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Nenhuma apólice vencendo nos próximos 30 dias.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigateSection?.(item.section)}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:bg-accent"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                        <Calendar className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigateSection?.('policies')}
            className="w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-accent transition-colors border-t border-border flex items-center justify-center gap-1.5"
          >
            Ver todas as apólices
            <ArrowRight className="size-3" />
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
