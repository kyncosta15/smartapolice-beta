import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClaimsService } from '@/services/claims';
import { Claim, Assistance } from '@/types/claims';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Wrench,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Car,
  FileText,
  Loader2,
  X,
} from 'lucide-react';

interface TicketDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
  ticketType: 'sinistro' | 'assistencia';
}

export function TicketDetailsDrawer({
  open,
  onOpenChange,
  ticketId,
  ticketType,
}: TicketDetailsDrawerProps) {
  const [ticket, setTicket] = useState<Claim | Assistance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ticketId) {
      loadTicketDetails();
    }
  }, [open, ticketId]);

  const loadTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      if (ticketType === 'sinistro') {
        const claim = await ClaimsService.getClaimById(ticketId);
        setTicket(claim);
      } else {
        // Para assistências, buscar da mesma forma
        const assistance = await ClaimsService.getClaimById(ticketId);
        setTicket(assistance as any);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const isClaim = (t: Claim | Assistance): t is Claim => {
    return 'valor_estimado' in t;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'destructive';
      case 'em_regulacao':
      case 'em_analise':
        return 'secondary';
      case 'finalizado':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {ticketType === 'sinistro' ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <Wrench className="h-6 w-6 text-green-600" />
              )}
              <span>Detalhes do {ticketType === 'sinistro' ? 'Sinistro' : 'Assistência'}</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <div className="space-y-6">
            {/* Informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Protocolo</div>
                <div className="font-mono font-semibold text-lg">
                  {'ticket' in ticket ? ticket.ticket : `ASS-${ticket.id.slice(0, 8)}`}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={getStatusColor(ticket.status)} className="text-sm">
                  {ticket.status === 'aberto' && 'Aberto'}
                  {ticket.status === 'em_regulacao' && 'Em Regulação'}
                  {ticket.status === 'finalizado' && 'Finalizado'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informações do veículo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Car className="h-5 w-5" />
                <span>Veículo</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Placa</div>
                  <div className="font-semibold text-base">
                    {ticket.veiculo.placa}
                  </div>
                </div>
                {ticket.veiculo.marca && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Marca/Modelo</div>
                    <div className="font-medium">
                      {ticket.veiculo.marca} {ticket.veiculo.modelo}
                    </div>
                  </div>
                )}
                {ticket.veiculo.proprietario_nome && (
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-sm text-muted-foreground">Proprietário</div>
                    <div className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ticket.veiculo.proprietario_nome}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações específicas do sinistro */}
            {isClaim(ticket) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    <span>Informações do Sinistro</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ticket.valor_estimado && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Valor Estimado
                        </div>
                        <div className="font-semibold text-lg text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(ticket.valor_estimado)}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Data de Abertura
                      </div>
                      <div className="font-medium">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Última Atualização
                        </div>
                        <div className="font-medium">
                          {format(new Date(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Informações específicas da assistência */}
            {!isClaim(ticket) && 'tipo' in ticket && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    <span>Informações da Assistência</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Tipo de Assistência</div>
                      <Badge variant="secondary" className="text-sm">
                        {ticket.tipo === 'guincho' && 'Guincho'}
                        {ticket.tipo === 'vidro' && 'Vidro'}
                        {ticket.tipo === 'residencia' && 'Residência'}
                        {ticket.tipo === 'outro' && 'Outro'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Data de Solicitação
                      </div>
                      <div className="font-medium">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Ações */}
            <Separator />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum dado encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
