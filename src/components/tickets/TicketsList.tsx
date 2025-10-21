import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  GitBranch,
  Trash2
} from 'lucide-react';
import { useTicketsData } from '@/hooks/useTicketsData';
import { TicketStatus, Ticket } from '@/types/tickets';
import { StatusStepper, SINISTRO_STEPS, ASSISTENCIA_STEPS, StatusEvent } from '@/components/status-stepper';
import { CompactStatusStepper } from '@/components/status-stepper/CompactStatusStepper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';

interface TicketsListProps {
  onDeleteClaim?: (id: string) => Promise<void>;
  onDeleteAssistance?: (id: string) => Promise<void>;
}

export function TicketsList({ onDeleteClaim, onDeleteAssistance }: TicketsListProps = {}) {
  const { tickets, loading, updateTicketStatus } = useTicketsData();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

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

  const handleDetailsClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const toggleSelectTicket = (ticketId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map(t => t.id)));
    }
  };

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete = ticketToDelete ? [ticketToDelete] : Array.from(selectedIds);
      
      for (const id of idsToDelete) {
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) continue;

        if (ticket.tipo === 'sinistro') {
          if (onDeleteClaim) {
            await onDeleteClaim(id);
          } else {
            await ClaimsService.deleteClaim(id);
          }
        } else {
          if (onDeleteAssistance) {
            await onDeleteAssistance(id);
          } else {
            await ClaimsService.deleteAssistance(id);
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: `${idsToDelete.length} registro(s) deletado(s) com sucesso.`,
      });

      setSelectedIds(new Set());
      setTicketToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar os registros.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
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
      {/* Bulk actions bar */}
      {tickets.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === tickets.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedIds.size > 0 
                ? `${selectedIds.size} selecionado(s)` 
                : 'Selecionar todos'}
            </span>
          </div>
          
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletar {selectedIds.size} registro(s)
            </Button>
          )}
        </div>
      )}

      {tickets.map((ticket) => {
        const steps = ticket.tipo === 'sinistro' ? SINISTRO_STEPS : ASSISTENCIA_STEPS;
        
        return (
          <Card key={ticket.id} className={cn(
            "overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-muted/10",
            selectedIds.has(ticket.id) && "border-primary ring-2 ring-primary/20"
          )}>
            <div className="p-6 space-y-6">
              {/* Header with checkbox */}
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedIds.has(ticket.id)}
                  onCheckedChange={() => toggleSelectTicket(ticket.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getTipoIcon(ticket.tipo)}
                      <div>
                        <h3 className="font-semibold text-xl">
                          {ticket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{ticket.id.slice(0, 8)}
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
                  onClick={() => handleDetailsClick(ticket)}
                  className="gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
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
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteClick(ticket.id)}
                  className="gap-2 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Modal da Esteira de Status Completa */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="w-[95vw] max-w-sm sm:max-w-md md:max-w-lg max-h-[92vh] h-[92vh] overflow-hidden p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col">
          <DialogHeader className="px-3 py-2.5 border-b bg-background/95 backdrop-blur-sm flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="truncate text-xs sm:text-sm">
                {selectedTicket?.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{selectedTicket?.id?.slice(-8)}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="flex-1 overflow-hidden">
              <CompactStatusStepper
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
          
          {/* Rodapé com botão fechar */}
          <div className="border-t bg-muted/20 p-3 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsStatusModalOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.tipo === 'sinistro' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Wrench className="h-5 w-5 text-blue-600" />
              )}
              Detalhes - {selectedTicket?.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{selectedTicket?.id?.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              {selectedTicket.vehicle && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Informações do Veículo
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-medium">{selectedTicket.vehicle.placa}</p>
                    </div>
                    {selectedTicket.vehicle.marca && (
                      <div>
                        <p className="text-sm text-muted-foreground">Marca</p>
                        <p className="font-medium">{selectedTicket.vehicle.marca}</p>
                      </div>
                    )}
                    {selectedTicket.vehicle.modelo && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Modelo</p>
                        <p className="font-medium">{selectedTicket.vehicle.modelo}</p>
                      </div>
                    )}
                    {selectedTicket.vehicle.status_seguro && (
                      <div>
                        <p className="text-sm text-muted-foreground">Status Seguro</p>
                        <p className="font-medium capitalize">{selectedTicket.vehicle.status_seguro}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detalhes do Sinistro/Assistência */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {selectedTicket.tipo === 'sinistro' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Wrench className="h-5 w-5 text-blue-600" />
                  )}
                  Detalhes do {selectedTicket.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'}
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  {selectedTicket.subtipo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium capitalize">{selectedTicket.subtipo.replace('_', ' ')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={cn("inline-flex", getStatusColor(selectedTicket.status))}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {selectedTicket.data_evento && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Evento</p>
                      <p className="font-medium">
                        {format(new Date(selectedTicket.data_evento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedTicket.valor_estimado && (
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Estimado</p>
                      <p className="font-medium">{formatCurrency(selectedTicket.valor_estimado)}</p>
                    </div>
                  )}
                  {selectedTicket.localizacao && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Localização</p>
                      <p className="font-medium">{selectedTicket.localizacao}</p>
                    </div>
                  )}
                  {selectedTicket.protocol_code && (
                    <div>
                      <p className="text-sm text-muted-foreground">Protocolo</p>
                      <p className="font-medium">{selectedTicket.protocol_code}</p>
                    </div>
                  )}
                </div>

                {selectedTicket.descricao && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.descricao}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {ticketToDelete 
                ? 'Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.'
                : `Tem certeza que deseja deletar ${selectedIds.size} registro(s)? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}