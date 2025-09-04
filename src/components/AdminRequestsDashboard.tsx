import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  CheckCircle2, 
  XCircle,
  FileText,
  User,
  Calendar,
  Ticket,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';

interface AdminRequest {
  id: string;
  protocol_code: string;
  colaborador: string;
  cpf: string;
  tipo: 'inclusao' | 'exclusao';
  status: string;
  submitted_at: string;
  qtd_itens: number;
}

const fetcher = async (url: string) => {
  const { data, error } = await supabase.functions.invoke(url.replace('/functions/v1/', ''), {
    method: 'GET'
  });
  if (error) throw error;
  return data;
};

export const AdminRequestsDashboard = () => {
  const { user } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // SWR para dados do administrador
  const { data: requestsRes, mutate: mutateRequests } = useSWR('adm-requests-list', fetcher);
  const { data: detailRes, mutate: mutateDetail } = useSWR(
    selectedRequestId ? `rh-requests-detail/${selectedRequestId}` : null,
    fetcher
  );

  // Realtime
  const mutateAll = useCallback(() => {
    mutateRequests();
    if (selectedRequestId) mutateDetail();
  }, [mutateRequests, mutateDetail, selectedRequestId]);

  useRealtime(mutateAll, [
    { table: 'requests' },
    { table: 'tickets' }
  ]);

  const requests: AdminRequest[] = requestsRes?.data ?? [];
  const requestDetail = detailRes?.data ?? null;

  // Handlers
  const handleViewRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDrawerOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequestId) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('adm-approve-request', {
        body: { 
          requestId: selectedRequestId, 
          note: approveNote || undefined 
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao aprovar');
      }

      if (!data.ok) {
        throw new Error(data.error?.message || 'Erro ao aprovar');
      }

      toast.success('Solicitação aprovada e convertida em ticket!');
      setApproveNote('');
      setIsDrawerOpen(false);
      mutateAll();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.message || 'Falha ao aprovar. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedRequestId) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('adm-requests-decline', {
        body: { 
          requestId: selectedRequestId, 
          reason: declineReason || undefined 
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao recusar');
      }

      if (!data.ok) {
        throw new Error(data.error?.message || 'Erro ao recusar');
      }

      toast.success('Solicitação recusada pela Administração.');
      setDeclineReason('');
      setIsDrawerOpen(false);
      mutateAll();
    } catch (error: any) {
      console.error('Erro ao recusar:', error);
      toast.error(error.message || 'Falha ao recusar. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      aprovado_rh: { label: 'Aprovado pelo RH', className: 'bg-green-100 text-green-800' },
      em_validacao_adm: { label: 'Em Análise', className: 'bg-orange-100 text-orange-800' },
      aprovado_adm: { label: 'Aprovado (Ticket)', className: 'bg-blue-100 text-blue-800' },
      recusado_adm: { label: 'Recusado pela Adm', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant="outline">
        {tipo === 'inclusao' ? 'Inclusão' : 'Exclusão'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Solicitações aprovadas pelo RH para decisão final</p>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Solicitações para Aprovação Final ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
              <p className="text-muted-foreground">
                As solicitações aprovadas pelo RH aparecerão aqui para sua aprovação final.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Protocolo</th>
                    <th className="text-left py-3 px-4">Colaborador</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Itens</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium text-primary">
                          {request.protocol_code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{request.colaborador}</p>
                          <p className="text-sm text-muted-foreground">
                            CPF: {request.cpf}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getTipoBadge(request.tipo)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(request.submitted_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {request.qtd_itens} {request.qtd_itens === 1 ? 'item' : 'itens'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Analisar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer de Análise */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Análise Final - Protocolo {requestDetail?.protocol_code}
            </DrawerTitle>
            <div className="text-sm text-muted-foreground">
              Status: {requestDetail && getStatusBadge(requestDetail.status)}
            </div>
          </DrawerHeader>
          
          <div className="p-4 space-y-6 max-h-[70vh] overflow-auto">
            {requestDetail ? (
              <>
                {/* Informações do Colaborador */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Colaborador
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Nome:</strong> {requestDetail.employee.full_name}</p>
                    <p><strong>CPF:</strong> {requestDetail.employee.cpf}</p>
                    {requestDetail.employee.email && (
                      <p><strong>E-mail:</strong> {requestDetail.employee.email}</p>
                    )}
                    {requestDetail.employee.phone && (
                      <p><strong>Telefone:</strong> {requestDetail.employee.phone}</p>
                    )}
                  </div>
                </div>

                {/* Solicitação */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Detalhes da Solicitação
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Tipo:</strong> {requestDetail.kind === 'inclusao' ? 'Inclusão de Beneficiário' : 'Exclusão de Beneficiário'}</p>
                    <p><strong>Data de envio:</strong> {new Date(requestDetail.submitted_at).toLocaleString('pt-BR')}</p>
                    <p><strong>Quantidade de itens:</strong> {requestDetail.request_items.length}</p>
                  </div>
                </div>

                {/* Itens detalhados */}
                <div>
                  <h3 className="font-semibold mb-3">Itens da Solicitação</h3>
                  <div className="space-y-3">
                    {requestDetail.request_items.map((item: any, index: number) => (
                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.target === 'titular' ? 'Titular' : 'Dependente'}
                              {item.dependent_name && ` - ${item.dependent_name}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ação: <span className="font-medium">{item.action === 'incluir' ? 'Incluir' : 'Excluir'}</span>
                            </p>
                            {item.notes && (
                              <p className="text-sm mt-1">
                                <strong>Observações:</strong> {item.notes}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trilha de aprovações */}
                {requestDetail.approvals && requestDetail.approvals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Histórico de Aprovações</h3>
                    <div className="space-y-2">
                      {requestDetail.approvals.map((approval: any) => (
                        <div key={approval.id} className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {approval.role === 'rh' ? 'RH' : 'Administração'} - {approval.decision === 'aprovado' ? 'Aprovado' : 'Recusado'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(approval.decided_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <Badge className={approval.decision === 'aprovado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {approval.decision === 'aprovado' ? 'Aprovado' : 'Recusado'}
                            </Badge>
                          </div>
                          {approval.note && (
                            <p className="text-sm mt-2 p-2 bg-white rounded">
                              <strong>Observação:</strong> {approval.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p>Carregando detalhes...</p>
              </div>
            )}
          </div>

          <DrawerFooter className="flex justify-between">
            <div className="flex gap-2">
              {requestDetail && requestDetail.status === 'aprovado_rh' && (
                <>
                  {/* Botão Recusar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isProcessing}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Recusar solicitação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação marcará a solicitação como recusada pela Administração.
                          Deseja informar um motivo?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Textarea
                          placeholder="Motivo da recusa..."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          maxLength={2000}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeclineRequest} disabled={isProcessing}>
                          {isProcessing ? 'Recusando...' : 'Recusar Solicitação'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Botão Aprovar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isProcessing}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar e Converter em Ticket
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Converter em Ticket?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ao aprovar, esta solicitação será convertida em um ticket e enviada para o sistema de processamento.
                          Deseja adicionar uma observação?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Textarea
                          placeholder="Observação para o ticket (opcional)"
                          value={approveNote}
                          onChange={(e) => setApproveNote(e.target.value)}
                          maxLength={2000}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveRequest} disabled={isProcessing}>
                          {isProcessing ? 'Processando...' : 'Aprovar e Converter'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};