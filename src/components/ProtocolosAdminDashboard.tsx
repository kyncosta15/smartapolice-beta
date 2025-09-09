import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  CheckCircle2, 
  XCircle,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ColaboradorSubmissao } from '@/hooks/useSmartBeneficiosData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProtocolosAdminDashboardProps {
  submissoes: ColaboradorSubmissao[];
  isLoading: boolean;
}

interface TicketDetail {
  id: string;
  protocol_code: string;
  status: string;
  request_id: string;
  payload: any;
  rh_note?: string;
  external_ref?: string;
}

export const ProtocolosAdminDashboard = ({ submissoes, isLoading }: ProtocolosAdminDashboardProps) => {
  const [selectedProtocol, setSelectedProtocol] = useState<ColaboradorSubmissao | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recebida':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Recebida</Badge>;
      case 'processada':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Processada</Badge>;
      case 'erro':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
      case 'em_validacao':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Em Validação</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = async (protocolo: ColaboradorSubmissao) => {
    setSelectedProtocol(protocolo);
    
    // Buscar o ticket correspondente se existir
    if (protocolo.numero_protocolo) {
      try {
        const { data: ticket, error } = await supabase
          .from('request_tickets')
          .select('*')
          .eq('protocol_code', protocolo.numero_protocolo)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar ticket:', error);
        } else if (ticket) {
          setTicketDetail(ticket);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do ticket:', error);
      }
    }
    
    setIsDetailModalOpen(true);
  };

  const handleApproveTicket = async () => {
    if (!ticketDetail || !selectedProtocol) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/functions/v1/corretora-approve-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: ticketDetail.id,
          action: 'approve',
          note: approveNote || undefined 
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || 'Erro ao aprovar');
      }

      toast.success('Ticket aprovado com sucesso!');
      setApproveNote('');
      setIsDetailModalOpen(false);
      setSelectedProtocol(null);
      setTicketDetail(null);
    } catch (error: any) {
      console.error('Erro ao aprovar ticket:', error);
      toast.error(error.message || 'Erro ao aprovar ticket. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTicket = async () => {
    if (!ticketDetail || !selectedProtocol) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/functions/v1/corretora-approve-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: ticketDetail.id,
          action: 'reject',
          note: declineReason || undefined 
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || 'Erro ao rejeitar');
      }

      toast.success('Ticket rejeitado.');
      setDeclineReason('');
      setIsDetailModalOpen(false);
      setSelectedProtocol(null);
      setTicketDetail(null);
    } catch (error: any) {
      console.error('Erro ao rejeitar ticket:', error);
      toast.error(error.message || 'Erro ao rejeitar ticket. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const protocolosRecentes = submissoes
    .filter(s => s.numero_protocolo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const estatisticas = {
    total: submissoes.filter(s => s.numero_protocolo).length,
    recebidas: submissoes.filter(s => s.status === 'recebida').length,
    processadas: submissoes.filter(s => s.status === 'processada').length,
    erros: submissoes.filter(s => s.status === 'erro').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Carregando protocolos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Lista de Protocolos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Protocolos Gerados para Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {protocolosRecentes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhum protocolo gerado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {protocolosRecentes.map((submissao) => (
                <Card key={submissao.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-white/80 via-white/60 to-blue-50/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="absolute inset-[1px] bg-white/90 backdrop-blur-sm rounded-lg" />
                  
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        {/* Protocol header with modern badge */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <span className="font-mono text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {submissao.numero_protocolo}
                            </span>
                            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-30" />
                          </div>
                          {getStatusBadge(submissao.status)}
                        </div>
                        
                        {/* Info grid with modern styling */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50">
                            <div className="p-1.5 rounded-lg bg-blue-500/10">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {submissao.dados_preenchidos?.nome || "Nome não informado"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/50">
                            <div className="p-1.5 rounded-lg bg-purple-500/10">
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700 text-sm">
                              {new Date(submissao.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>

                          {submissao.dados_preenchidos?.cpf && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100/50">
                              <div className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full shadow-sm">
                                CPF: {submissao.dados_preenchidos.cpf}
                              </div>
                            </div>
                          )}
                        </div>

                        {submissao.observacoes && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100/50">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {submissao.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Modern action button */}
                      <div className="ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(submissao)}
                          className="group/btn relative overflow-hidden border-2 border-blue-200 hover:border-blue-400 bg-white/80 backdrop-blur-sm hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                          <Eye className="h-4 w-4 mr-2 text-blue-600 group-hover/btn:text-blue-700 transition-colors" />
                          <span className="relative font-medium">Ver Detalhes</span>
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
              Protocolo {selectedProtocol?.numero_protocolo}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProtocol && (
            <div className="space-y-6">
              {/* Informações do Protocolo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedProtocol.status)}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                      <p className="text-sm">
                        {new Date(selectedProtocol.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {selectedProtocol.data_protocolo && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data do Protocolo</label>
                        <p className="text-sm">
                          {new Date(selectedProtocol.data_protocolo).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados do Colaborador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProtocol.dados_preenchidos?.nome && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <p className="text-sm font-medium">
                          {selectedProtocol.dados_preenchidos.nome}
                        </p>
                      </div>
                    )}
                    
                    {selectedProtocol.dados_preenchidos?.cpf && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CPF</label>
                        <p className="text-sm">
                          {selectedProtocol.dados_preenchidos.cpf}
                        </p>
                      </div>
                    )}

                    {selectedProtocol.dados_preenchidos?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <p className="text-sm">
                          {selectedProtocol.dados_preenchidos.email}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Dados Preenchidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados Preenchidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(selectedProtocol.dados_preenchidos, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Detalhes do Ticket (se existir) */}
              {ticketDetail && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detalhes do Ticket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status do Ticket</label>
                        <div className="mt-1">{getStatusBadge(ticketDetail.status)}</div>
                      </div>
                      
                      {ticketDetail.external_ref && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Referência Externa</label>
                          <p className="text-sm">{ticketDetail.external_ref}</p>
                        </div>
                      )}
                    </div>

                    {ticketDetail.rh_note && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nota do RH</label>
                        <p className="text-sm bg-blue-50 p-3 rounded-lg">
                          {ticketDetail.rh_note}
                        </p>
                      </div>
                    )}

                    {/* Ações de Aprovação/Rejeição */}
                    {(ticketDetail.status === 'aberto' || ticketDetail.status === 'em_validacao') && (
                      <div className="border-t pt-4 space-y-4">
                        <h4 className="font-medium">Ações de Administrador</h4>
                        
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
                              placeholder="Explique o motivo da rejeição..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={handleApproveTicket}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {isProcessing ? 'Aprovando...' : 'Aprovar Ticket'}
                            </Button>

                            <Button
                              onClick={handleRejectTicket}
                              disabled={isProcessing}
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {isProcessing ? 'Rejeitando...' : 'Rejeitar Ticket'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedProtocol.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedProtocol.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};