import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  Link as LinkIcon, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Download,
  Copy,
  User,
  Calendar,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import useSWR from 'swr';

interface Request {
  id: string;
  protocol_code: string;
  colaborador: string;
  cpf: string;
  tipo: 'inclusao' | 'exclusao';
  status: 'recebido' | 'em_validacao' | 'concluido' | 'recusado';
  submitted_at: string;
  qtd_itens: number;
}

interface RequestDetail {
  id: string;
  protocol_code: string;
  kind: string;
  status: string;
  submitted_at: string;
  metadata: any;
  employee: {
    full_name: string;
    cpf: string;
    email?: string;
    phone?: string;
  };
  request_items: Array<{
    id: string;
    target: string;
    action: string;
    notes?: string;
    dependent_id?: string;
  }>;
  files: Array<{
    id: string;
    original_name: string;
    mime_type: string;
    size: number;
    path: string;
  }>;
}

interface KPIs {
  total: number;
  recebidos: number;
  em_validacao: number;
  concluidos: number;
  recusados: number;
  tickets: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const RequestsNewDashboard = () => {
  const { user } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  // SWR para dados
  const { data: requestsRes, mutate: mutateRequests } = useSWR('/functions/v1/rh-requests-list', fetcher);
  const { data: kpisRes, mutate: mutateKpis } = useSWR('/functions/v1/rh-requests-kpis', fetcher);
  const { data: detailRes, mutate: mutateDetail } = useSWR(
    selectedRequestId ? `/functions/v1/rh-requests-detail/${selectedRequestId}` : null,
    fetcher
  );

  // Realtime
  const mutateAll = useCallback(() => {
    mutateRequests();
    mutateKpis();
    if (selectedRequestId) mutateDetail();
  }, [mutateRequests, mutateKpis, mutateDetail, selectedRequestId]);

  useRealtime(mutateAll, [
    { table: 'requests' },
    { table: 'tickets' }
  ]);

  const requests: Request[] = requestsRes?.data ?? [];
  const kpis: KPIs = kpisRes?.data ?? { total: 0, recebidos: 0, em_validacao: 0, concluidos: 0, recusados: 0, tickets: 0 };
  const requestDetail: RequestDetail | null = detailRes?.data ?? null;

  // Handlers
  const handleViewRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDrawerOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequestId) return;
    
    try {
      const response = await fetch('/functions/v1/rh-approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequestId, 
          note: approveNote || undefined 
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || 'Erro ao aprovar');
      }

      toast.success('Solicitação aprovada e enviada ao backoffice!');
      setApproveNote('');
      setIsDrawerOpen(false);
      mutateAll();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.message || 'Falha ao aprovar. Tente novamente.');
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedRequestId) return;
    
    try {
      const response = await fetch('/functions/v1/rh-requests-decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequestId, 
          reason: declineReason || undefined 
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error?.message || 'Erro ao recusar');
      }

      toast.success('Solicitação recusada.');
      setDeclineReason('');
      setIsDrawerOpen(false);
      mutateAll();
    } catch (error: any) {
      console.error('Erro ao recusar:', error);
      toast.error(error.message || 'Falha ao recusar. Tente novamente.');
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      recebido: { label: 'Recebido', className: 'bg-blue-100 text-blue-800' },
      em_validacao: { label: 'Em Validação', className: 'bg-orange-100 text-orange-800' },
      concluido: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
      recusado: { label: 'Recusado', className: 'bg-red-100 text-red-800' }
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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicLink = `${baseUrl}/solicitacao`;
  const whatsappMessage = `Olá! Para incluir ou excluir beneficiários do seu plano, acesse este link seguro: ${publicLink}. Informe seu CPF e nome, siga os passos e, ao final, você receberá o protocolo.`;

  const canTakeAction = (status: string) => {
    return status === 'recebido' || status === 'em_validacao';
  };

  return (
    <div className="space-y-6">
      {/* Título e botão Link */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard da Corretora — Solicitações</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de beneficiários</p>
        </div>
        
        <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Link Público de Solicitações</DialogTitle>
              <DialogDescription>
                Envie este link pelo WhatsApp para os colaboradores.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">URL</label>
                <div className="flex gap-2 mt-2">
                  <input 
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50" 
                    value={publicLink} 
                    readOnly 
                  />
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(publicLink, 'Link copiado!')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">💡 Mensagem sugerida para WhatsApp:</p>
                <textarea 
                  className="w-full p-3 border rounded-md bg-gray-50 min-h-[100px] text-sm" 
                  value={whatsappMessage} 
                  readOnly 
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(whatsappMessage, 'Mensagem copiada!')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Mensagem
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.recebidos}</p>
                <p className="text-sm text-muted-foreground">Recebidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.em_validacao}</p>
                <p className="text-sm text-muted-foreground">Em Validação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.concluidos}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.recusados}</p>
                <p className="text-sm text-muted-foreground">Recusados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.tickets}</p>
                <p className="text-sm text-muted-foreground">Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação por aqui</h3>
              <p className="text-muted-foreground">
                As solicitações aparecerão automaticamente assim que forem enviadas pelos colaboradores.
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
                        <span className="font-mono text-sm font-medium">
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
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(request.submitted_at).toLocaleTimeString('pt-BR')}
                          </span>
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
                          Ver
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

      {/* Drawer de Detalhes */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Protocolo {requestDetail?.protocol_code}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Status: {requestDetail && getStatusBadge(requestDetail.status)}
            </p>
          </DrawerHeader>
          
          <div className="p-4 space-y-6 max-h-[70vh] overflow-auto">
            {requestDetail ? (
              <>
                {/* Colaborador */}
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
                    Solicitação
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Tipo:</strong> {requestDetail.kind === 'inclusao' ? 'Inclusão' : 'Exclusão'}</p>
                    <p><strong>Data de envio:</strong> {new Date(requestDetail.submitted_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {/* Itens */}
                <div>
                  <h3 className="font-semibold mb-3">Itens</h3>
                  <div className="space-y-2">
                    {requestDetail.request_items.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <p><strong>Alvo:</strong> {item.target === 'titular' ? 'Titular' : 'Dependente'}</p>
                        <p><strong>Ação:</strong> {item.action === 'incluir' ? 'Incluir' : 'Excluir'}</p>
                        {item.notes && <p><strong>Observações:</strong> {item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anexos */}
                {requestDetail.files.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Anexos</h3>
                    <div className="space-y-2">
                      {requestDetail.files.map((file) => (
                        <div key={file.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{file.original_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.mime_type} • {Math.round(file.size / 1024)} KB
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
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
              {requestDetail && canTakeAction(requestDetail.status) && (
                <>
                  {/* Botão Recusar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Recusar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Recusar solicitação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação marcará o protocolo como Recusado.
                          Deseja informar um motivo? (opcional)
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Textarea
                          placeholder="Motivo da recusa (opcional)"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          maxLength={2000}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeclineRequest}>
                          Recusar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Botão Aprovar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>Aprovar e Enviar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Aprovar solicitação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ao aprovar, esta solicitação será enviada ao backoffice como um ticket, 
                          e o status mudará para Em Validação.
                          Você deseja adicionar uma observação para o backoffice? (opcional)
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Textarea
                          placeholder="Observação para o backoffice (opcional)"
                          value={approveNote}
                          onChange={(e) => setApproveNote(e.target.value)}
                          maxLength={2000}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveRequest}>
                          Aprovar e Enviar
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