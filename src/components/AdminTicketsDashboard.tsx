import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  CheckCircle2, 
  XCircle,
  FileText,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Ticket {
  id: string;
  protocol_code: string;
  status: string;
  request_id: string;
  payload: any;
  rh_note?: string;
  external_ref?: string;
  created_at: string;
  updated_at: string;
}

export const AdminTicketsDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar tickets:', error);
        toast.error('Erro ao carregar tickets');
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto':
        return <Badge variant="info"><Clock className="h-3 w-3 mr-1" />Recebida</Badge>;
      case 'processada':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Processada</Badge>;
      case 'erro':
        return <Badge variant="error"><AlertTriangle className="h-3 w-3 mr-1" />Com Erro</Badge>;
      case 'aprovado':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const handleApproveTicket = async () => {
    if (!selectedTicket) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('corretora-approve-ticket', {
        body: { 
          ticketId: selectedTicket.id,
          action: 'approve',
          note: approveNote || undefined 
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao aprovar');
      }

      if (!data.ok) {
        throw new Error(data.error?.message || 'Erro ao aprovar');
      }

      toast.success('Ticket aprovado com sucesso!');
      setApproveNote('');
      setIsDetailModalOpen(false);
      setSelectedTicket(null);
      await loadTickets(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao aprovar ticket:', error);
      toast.error(error.message || 'Erro ao aprovar ticket. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTicket = async () => {
    if (!selectedTicket) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('corretora-approve-ticket', {
        body: { 
          ticketId: selectedTicket.id,
          action: 'reject',
          note: declineReason || undefined 
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao rejeitar');
      }

      if (!data.ok) {
        throw new Error(data.error?.message || 'Erro ao rejeitar');
      }

      toast.success('Ticket rejeitado.');
      setDeclineReason('');
      setIsDetailModalOpen(false);
      setSelectedTicket(null);
      await loadTickets(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao rejeitar ticket:', error);
      toast.error(error.message || 'Erro ao rejeitar ticket. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const estatisticas = {
    total: tickets.length,
    recebidas: tickets.filter(t => t.status === 'aberto').length,
    processadas: tickets.filter(t => t.status === 'processada' || t.status === 'aprovado').length,
    erros: tickets.filter(t => t.status === 'erro' || t.status === 'rejeitado').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Carregando tickets...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de atualizar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Tickets</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadTickets}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
                <p className="text-sm text-muted-foreground">Total de Protocolos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.recebidas}</p>
                <p className="text-sm text-muted-foreground">Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.processadas}</p>
                <p className="text-sm text-muted-foreground">Processadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{estatisticas.erros}</p>
                <p className="text-sm text-muted-foreground">Com Erro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tickets para Aprovação Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhum ticket encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-blue-600">
                            {ticket.protocol_code}
                          </span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {ticket.payload?.employee?.full_name || 'Nome não informado'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(ticket.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>

                          {ticket.payload?.employee?.cpf && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                CPF: {ticket.payload.employee.cpf}
                              </span>
                            </div>
                          )}
                        </div>

                        {ticket.payload?.metadata?.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {ticket.payload.metadata.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket {selectedTicket?.protocol_code}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* Informações do Ticket */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações do Ticket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Criado em</label>
                      <p className="text-sm">
                        {new Date(selectedTicket.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {selectedTicket.external_ref && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Referência Externa</label>
                        <p className="text-sm">{selectedTicket.external_ref}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados do Colaborador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedTicket.payload?.employee?.full_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <p className="text-sm font-medium">
                          {selectedTicket.payload.employee.full_name}
                        </p>
                      </div>
                    )}
                    
                    {selectedTicket.payload?.employee?.cpf && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CPF</label>
                        <p className="text-sm">
                          {selectedTicket.payload.employee.cpf}
                        </p>
                      </div>
                    )}

                    {selectedTicket.payload?.employee?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <p className="text-sm">
                          {selectedTicket.payload.employee.phone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes da Solicitação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes da Solicitação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <p className="text-sm">
                      {selectedTicket.payload?.kind === 'inclusao' ? 'Inclusão de Beneficiário' : 'Exclusão de Beneficiário'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Canal</label>
                    <p className="text-sm">
                      {selectedTicket.payload?.channel === 'form' ? 'Formulário Web' : selectedTicket.payload?.channel}
                    </p>
                  </div>

                  {selectedTicket.payload?.metadata?.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {selectedTicket.payload.metadata.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações de Aprovação/Rejeição */}
              {selectedTicket.status === 'aberto' && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Ações de Corretora</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Nota de Aprovação (opcional)
                      </label>
                      <Textarea
                        value={approveNote}
                        onChange={(e) => setApproveNote(e.target.value)}
                        placeholder="Adicione uma nota sobre a aprovação..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Motivo da Rejeição (opcional)
                      </label>
                      <Textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Motivo da rejeição..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleRejectTicket}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processando...' : 'Rejeitar'}
                      </Button>

                      <Button
                        onClick={handleApproveTicket}
                        disabled={isProcessing}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processando...' : 'Aprovar e Processar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};