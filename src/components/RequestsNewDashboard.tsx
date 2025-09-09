import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Link as LinkIcon, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Copy,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Request {
  id: string;
  numero_protocolo: string;
  colaborador: string;
  cpf: string;
  status: 'recebida' | 'processando' | 'concluida' | 'rejeitada';
  created_at: string;
  dados_preenchidos: any;
}

interface KPIs {
  total: number;
  recebidos: number;
  em_validacao: number;
  concluidos: number;
  recusados: number;
  tickets: number;
}

export const RequestsNewDashboard = () => {
  const { user } = useAuth();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ total: 0, recebidos: 0, em_validacao: 0, concluidos: 0, recusados: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);

  // Função para buscar dados das submissões
  const fetchRequests = useCallback(async () => {
    try {
      const { data: userCompany } = await supabase
        .from('users')
        .select('company')
        .eq('id', user?.id)
        .single();

      if (!userCompany?.company) return;

      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userCompany.company)
        .single();

      if (!empresa?.id) return;

      const { data: submissoes, error } = await supabase
        .from('colaborador_submissoes')
        .select(`
          *,
          colaborador_links!inner(
            titulo,
            empresa_id
          )
        `)
        .eq('colaborador_links.empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar submissões:', error);
        return;
      }

      const formattedRequests: Request[] = (submissoes || []).map((sub: any) => ({
        id: sub.id,
        numero_protocolo: sub.numero_protocolo || 'N/A',
        colaborador: sub.dados_preenchidos?.nome || 'Nome não informado',
        cpf: sub.dados_preenchidos?.cpf || '',
        status: sub.status,
        created_at: sub.created_at,
        dados_preenchidos: sub.dados_preenchidos
      }));

      setRequests(formattedRequests);

      // Calcular KPIs
      const total = formattedRequests.length;
      const recebidos = formattedRequests.filter(r => r.status === 'recebida').length;
      const em_validacao = formattedRequests.filter(r => r.status === 'processando').length;
      const concluidos = formattedRequests.filter(r => r.status === 'concluida').length;
      const recusados = formattedRequests.filter(r => r.status === 'rejeitada').length;

      // Buscar tickets
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

      setKpis({
        total,
        recebidos,
        em_validacao,
        concluidos,
        recusados,
        tickets: ticketsCount || 0
      });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id, fetchRequests]);

  // Realtime
  useRealtime(fetchRequests, [
    { table: 'colaborador_submissoes' },
    { table: 'tickets' }
  ]);

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('colaborador_submissoes')
        .update({ 
          status: 'concluida'
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(error.message || 'Erro ao aprovar');
      }

      toast.success('Solicitação aprovada com sucesso!');
      fetchRequests();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.message || 'Falha ao aprovar. Tente novamente.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('colaborador_submissoes')
        .update({ 
          status: 'rejeitada'
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(error.message || 'Erro ao recusar');
      }

      toast.success('Solicitação recusada.');
      fetchRequests();
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
      recebida: { label: 'Recebida', className: 'bg-blue-100 text-blue-800' },
      processando: { label: 'Processando', className: 'bg-orange-100 text-orange-800' },
      concluida: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
      rejeitada: { label: 'Rejeitada', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicLink = `${baseUrl}/solicitacao`;
  const whatsappMessage = `Olá! Para incluir ou excluir beneficiários do seu plano, acesse este link seguro: ${publicLink}. Informe seu CPF e nome, siga os passos e, ao final, você receberá o protocolo.`;

  const canTakeAction = (status: string) => {
    return status === 'recebida' || status === 'processando';
  };

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard da Corretora — Solicitações</h1>
            <p className="text-muted-foreground">Gerencie as solicitações de beneficiários</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

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
                    <th className="text-left py-3 px-4">CPF</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium">
                          {request.numero_protocolo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{request.colaborador}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-muted-foreground">
                          {request.cpf}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(request.created_at).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </td>
                       <td className="py-3 px-4">
                         {getStatusBadge(request.status)}
                       </td>
                       <td className="py-3 px-4">
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleViewDetails(request)}
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           {canTakeAction(request.status) && (
                             <>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleApproveRequest(request.id)}
                               >
                                 <CheckCircle2 className="h-4 w-4 mr-1" />
                                 Aprovar
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleDeclineRequest(request.id)}
                               >
                                 <XCircle className="h-4 w-4 mr-1" />
                                 Recusar
                               </Button>
                             </>
                           )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           )}
         </CardContent>
       </Card>
       
       {/* Modal de Detalhes da Solicitação */}
       <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>Detalhes da Solicitação</DialogTitle>
             <DialogDescription>
               Informações completas sobre a solicitação de beneficiários
             </DialogDescription>
           </DialogHeader>
           {selectedRequest && (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Protocolo</label>
                   <p className="font-mono font-medium">{selectedRequest.numero_protocolo}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
                   <div className="mt-1">
                     {getStatusBadge(selectedRequest.status)}
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Colaborador</label>
                   <p className="font-medium">{selectedRequest.colaborador}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">CPF</label>
                   <p className="font-medium">{selectedRequest.cpf}</p>
                 </div>
               </div>

               <div>
                 <label className="text-sm font-medium text-muted-foreground">Data da Solicitação</label>
                 <p className="font-medium">
                   {new Date(selectedRequest.created_at).toLocaleDateString('pt-BR')} às {' '}
                   {new Date(selectedRequest.created_at).toLocaleTimeString('pt-BR')}
                 </p>
               </div>

               {selectedRequest.dados_preenchidos && (
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Dados Preenchidos</label>
                   <div className="mt-2 p-3 bg-gray-50 rounded-md">
                     <pre className="text-sm whitespace-pre-wrap">
                       {JSON.stringify(selectedRequest.dados_preenchidos, null, 2)}
                     </pre>
                   </div>
                 </div>
               )}

               {canTakeAction(selectedRequest.status) && (
                 <div className="flex gap-2 pt-4 border-t">
                   <Button
                     onClick={() => {
                       handleApproveRequest(selectedRequest.id);
                       setIsDetailsModalOpen(false);
                     }}
                     className="flex-1"
                   >
                     <CheckCircle2 className="h-4 w-4 mr-2" />
                     Aprovar Solicitação
                   </Button>
                   <Button
                     variant="destructive"
                     onClick={() => {
                       handleDeclineRequest(selectedRequest.id);
                       setIsDetailsModalOpen(false);
                     }}
                     className="flex-1"
                   >
                     <XCircle className="h-4 w-4 mr-2" />
                     Recusar Solicitação
                   </Button>
                 </div>
               )}
             </div>
           )}
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="ghost">Fechar</Button>
             </DialogClose>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
  );
};