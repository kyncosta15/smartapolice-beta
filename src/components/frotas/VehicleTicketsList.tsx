import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wrench, Calendar, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ListSkeleton } from '@/components/ui/tab-skeletons';
import type { Ticket } from '@/types/tickets';

interface Props {
  tickets: Ticket[];
  loading: boolean;
}

const VIRTUALIZE_THRESHOLD = 30;

/** Card único de ticket — extraído para reuso entre render normal e virtualizado. */
function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              ticket.tipo === 'sinistro'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            )}
          >
            {ticket.tipo === 'sinistro' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Wrench className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm md:text-base capitalize">
                {ticket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'}
                {ticket.subtipo && ` - ${ticket.subtipo.replace('_', ' ')}`}
                {ticket.protocol_code && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    • {ticket.protocol_code}
                  </span>
                )}
              </h4>
              <Badge
                variant={
                  ticket.status === 'finalizado'
                    ? 'default'
                    : ticket.status === 'cancelado'
                    ? 'destructive'
                    : ticket.status === 'em_analise'
                    ? 'secondary'
                    : 'outline'
                }
                className="shrink-0"
              >
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>

            {ticket.descricao && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ticket.descricao}</p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {ticket.data_evento && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(ticket.data_evento), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
              {ticket.valor_estimado && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(ticket.valor_estimado)}
                </div>
              )}
              {ticket.localizacao && (
                <div className="flex items-center gap-1 truncate">📍 {ticket.localizacao}</div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3" />
              Criado em{' '}
              {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VehicleTicketsList({ tickets, loading }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    overscan: 5,
  });

  if (loading) {
    return <ListSkeleton items={3} />;
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Este veículo não possui sinistros ou assistências registrados.
          </p>
        </div>
      </Card>
    );
  }

  // Lista pequena: render direto (mais simples e performático).
  if (tickets.length < VIRTUALIZE_THRESHOLD) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Histórico de Ocorrências</h3>
          <Badge variant="secondary">{tickets.length} registro(s)</Badge>
        </div>
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </div>
    );
  }

  // Lista grande: virtualizada.
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Histórico de Ocorrências</h3>
        <Badge variant="secondary">{tickets.length} registro(s)</Badge>
      </div>

      <div ref={parentRef} className="max-h-[60vh] overflow-y-auto">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const ticket = tickets[vi.index];
            return (
              <div
                key={ticket.id}
                ref={virtualizer.measureElement}
                data-index={vi.index}
                className="pb-3"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                <TicketCard ticket={ticket} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
