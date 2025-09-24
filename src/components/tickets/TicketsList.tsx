import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Car, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Eye, 
  Edit, 
  AlertTriangle, 
  Wrench, 
  Clock,
  CheckCircle,
  XCircle,
  GitBranch
} from 'lucide-react';
import { useTicketsData } from '@/hooks/useTicketsData';
import { TicketStatus, Ticket } from '@/types/tickets';
import { StatusStepper, SINISTRO_STEPS, ASSISTENCIA_STEPS, StatusEvent } from '@/components/status-stepper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function TicketsList() {
  const { tickets, loading, updateTicketStatus } = useTicketsData();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Mock history para demonstração
  const mockHistory: StatusEvent[] = [
    {
      id: '1',
      ticket_id: '1',
      to_status: 'aberto',
      note: 'Sinistro reportado pelo segurado',
      changed_by: 'user1',
      created_at: new Date().toISOString(),
      user_name: 'João Silva'
    }
  ];

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'aberto':
        return <Clock className="h-4 w-4" />;
      case 'em_analise':
        return <AlertTriangle className="h-4 w-4" />;
      case 'finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'aberto':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'em_analise':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'finalizado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'sinistro') {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <Wrench className="h-5 w-5 text-blue-500" />;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string, note?: string) => {
    console.log('Mudando status do ticket:', ticketId, 'para:', newStatus, note);
    // Integração com o hook real
    if (selectedTicket) {
      setSelectedTicket({ ...selectedTicket, status: newStatus as TicketStatus });
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsStatusModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
        <p className="text-muted-foreground">
          Não foram encontrados tickets com os filtros aplicados.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const steps = ticket.tipo === 'sinistro' ? SINISTRO_STEPS : ASSISTENCIA_STEPS;
        
        return (
          <Card key={ticket.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-muted/10">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getTipoIcon(ticket.tipo)}
                    <div>
                      <h3 className="font-semibold text-xl">
                        {ticket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{ticket.id}
                      </h3>
                      {ticket.subtipo && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {ticket.subtipo.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <Badge className={cn("flex items-center gap-1 shrink-0", getStatusColor(ticket.status))}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Informações do Ticket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticket.vehicle && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="truncate">
                      {ticket.vehicle.placa} - {ticket.vehicle.marca} {ticket.vehicle.modelo}
                    </span>
                  </div>
                )}
                
                {ticket.data_evento && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span>
                      {format(new Date(ticket.data_evento), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {ticket.valor_estimado && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span>{formatCurrency(ticket.valor_estimado)}</span>
                  </div>
                )}

                {ticket.localizacao && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="truncate">{ticket.localizacao}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>
                    Criado em {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTicketClick(ticket)}
                  className="gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  Acompanhar Status
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-muted/50 transition-colors">
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-muted/50 transition-colors">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Modal da Esteira de Status Completa */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Esteira de Status - {selectedTicket?.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{selectedTicket?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <StatusStepper
                type={selectedTicket.tipo}
                currentStatus={selectedTicket.status}
                steps={selectedTicket.tipo === 'sinistro' ? SINISTRO_STEPS : ASSISTENCIA_STEPS}
                history={mockHistory}
                onChangeStatus={(status, note) => handleStatusChange(selectedTicket.id, status, note)}
                slaInfo={{
                  due_at: selectedTicket.sla_due_at,
                  isOverdue: selectedTicket.sla_due_at ? new Date(selectedTicket.sla_due_at) < new Date() : false
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}