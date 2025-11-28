import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  Tag,
  Paperclip,
} from 'lucide-react';
import { EditTicketModal } from '@/components/tickets/EditTicketModal';
import { StatusStepperModal } from '@/components/sinistros/StatusStepperModal';
import { TicketDocumentsTab } from '@/components/sinistros/TicketDocumentsTab';
import { Ticket } from '@/types/tickets';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TicketDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
  ticketType: 'sinistro' | 'assistencia';
  onTicketUpdated?: () => void;
}

export function TicketDetailsDrawer({
  open,
  onOpenChange,
  ticketId,
  ticketType,
  onTicketUpdated,
}: TicketDetailsDrawerProps) {
  const [ticket, setTicket] = useState<Claim | Assistance | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [statusStepperOpen, setStatusStepperOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Função para formatar status removendo underscores e capitalizando
  const formatStatusLabel = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'destructive';
      case 'em_regulacao':
        return 'secondary';
      case 'finalizado':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em_regulacao':
        return 'Em Regulação';
      case 'finalizado':
        return 'Finalizado';
      case 'em_analise':
        return 'Em Análise';
      case 'em_andamento':
        return 'Em Andamento';
      default:
        return formatStatusLabel(status);
    }
  };

  const handleEditClick = () => {
    if (!ticket) return;

    const claim = ticket as Claim;
    
    // Converter para formato Ticket
    const ticketData: Ticket = {
      id: claim.id,
      protocol_code: claim.ticket,
      tipo: ticketType,
      subtipo: claim.subtipo as any,
      status: claim.status as any,
      data_evento: claim.data_evento || new Date().toISOString(),
      valor_estimado: claim.valor_estimado,
      localizacao: claim.localizacao || '',
      descricao: '',
      gravidade: 'media' as any,
      vehicle_id: claim.veiculo.id,
      empresa_id: '',
      origem: 'portal' as any,
      payload: {},
      created_at: claim.created_at,
      updated_at: claim.updated_at,
    };

    setEditingTicket(ticketData);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Recarregar os dados do ticket
    loadTicketDetails();
    
    // Invalidar queries
    queryClient.invalidateQueries({ queryKey: ['claims'] });
    
    // Notificar o pai para atualizar os dados
    if (onTicketUpdated) {
      onTicketUpdated();
    }
    
    toast({
      title: 'Sucesso',
      description: 'Ticket atualizado com sucesso!',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {ticketType === 'sinistro' ? (
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              ) : (
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Wrench className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              <span>Detalhes do {ticketType === 'sinistro' ? 'Sinistro' : 'Assistência'}</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Informações completas do registro
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando informações...</p>
          </div>
        ) : ticket ? (
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes" className="gap-2">
                <FileText className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Documentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 py-4">
              {/* Card com informações principais */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-6 space-y-4 border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Protocolo
                    </div>
                    <div className="font-mono font-bold text-xl text-foreground">
                      {'ticket' in ticket ? ticket.ticket : `ASS-${ticket.id.slice(0, 8)}`}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Status Atual
                    </div>
                    <Badge variant={getStatusColor(ticket.status)} className="text-sm font-semibold">
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Data de Abertura
                    </div>
                    <div className="font-medium text-base">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do veículo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Car className="h-5 w-5 text-primary" />
                  <span>Informações do Veículo</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border rounded-lg p-5">
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Placa</div>
                    <div className="font-bold text-lg tracking-wider">
                      {ticket.veiculo.placa}
                    </div>
                  </div>
                  {ticket.veiculo.marca && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Marca/Modelo</div>
                      <div className="font-semibold text-base">
                        {ticket.veiculo.marca} {ticket.veiculo.modelo}
                      </div>
                    </div>
                  )}
                  {ticket.veiculo.proprietario_nome && (
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Proprietário</div>
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {ticket.veiculo.proprietario_nome}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informações específicas do sinistro */}
              {isClaim(ticket) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Detalhes do Sinistro</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Valor estimado */}
                    {ticket.valor_estimado && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-5 space-y-2">
                        <div className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Valor Estimado do Sinistro
                        </div>
                        <div className="font-bold text-2xl text-green-700 dark:text-green-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(ticket.valor_estimado)}
                        </div>
                      </div>
                    )}

                    {/* Data do evento */}
                    {ticket.data_evento && (
                      <div className="bg-card border rounded-lg p-5 space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Data do Evento/Sinistro
                        </div>
                        <div className="font-semibold text-lg">
                          {format(new Date(ticket.data_evento), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    )}

                    {/* Subtipo */}
                    {ticket.subtipo && (
                      <div className="bg-card border rounded-lg p-5 space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          Tipo de Sinistro
                        </div>
                        <Badge variant="secondary" className="text-base font-semibold capitalize">
                          {ticket.subtipo.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}

                    {/* Localização */}
                    {ticket.localizacao && (
                      <div className="bg-card border rounded-lg p-5 space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Local do Sinistro
                        </div>
                        <div className="font-medium text-base">
                          {ticket.localizacao}
                        </div>
                      </div>
                    )}

                    {/* Última atualização */}
                    {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                      <div className="bg-card border rounded-lg p-5 space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Última Atualização
                        </div>
                        <div className="font-medium text-base">
                          {format(new Date(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    )}

                    {/* Gravidade */}
                    {ticket.gravidade && (
                      <div className="bg-card border rounded-lg p-5 space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Gravidade
                        </div>
                        <Badge variant="outline" className="text-base font-semibold capitalize">
                          {ticket.gravidade}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Descrição do sinistro */}
                  {ticket.descricao && (
                    <div className="bg-card border rounded-lg p-5 space-y-3 mt-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Descrição do Sinistro
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-md border">
                        {ticket.descricao}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Informações específicas da assistência */}
              {!isClaim(ticket) && 'tipo' in ticket && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Detalhes da Assistência</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border rounded-lg p-5 space-y-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Tipo de Assistência</div>
                      <Badge variant="secondary" className="text-base font-semibold">
                        {ticket.tipo === 'guincho' && 'Guincho'}
                        {ticket.tipo === 'vidro' && 'Vidro'}
                        {ticket.tipo === 'residencia' && 'Residência'}
                        {ticket.tipo === 'outro' && 'Outro'}
                      </Badge>
                    </div>
                    <div className="bg-card border rounded-lg p-5 space-y-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Data de Solicitação
                      </div>
                      <div className="font-semibold text-base">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    {/* Localização da assistência */}
                    {ticket.localizacao && (
                      <div className="bg-card border rounded-lg p-5 space-y-2 md:col-span-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Localização
                        </div>
                        <div className="font-medium text-base">
                          {ticket.localizacao}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descrição da assistência */}
                  {ticket.descricao && (
                    <div className="bg-card border rounded-lg p-5 space-y-3 mt-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Descrição da Assistência
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-md border">
                        {ticket.descricao}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <Separator />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setStatusStepperOpen(true)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Acompanhar Status
                </Button>
                <Button variant="default" onClick={handleEditClick}>
                  Editar Registro
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="py-4">
              <TicketDocumentsTab 
                ticketId={ticket.id}
                ticketType={ticketType}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground font-medium">
              Nenhum dado encontrado
            </p>
          </div>
        )}
      </DialogContent>

      {/* Modal de edição */}
      <EditTicketModal
        ticket={editingTicket}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de acompanhamento de status */}
      {ticket && (
        <StatusStepperModal
          open={statusStepperOpen}
          onOpenChange={setStatusStepperOpen}
          ticketId={ticket.id}
          ticketType={ticketType}
        />
      )}
    </Dialog>
  );
}
