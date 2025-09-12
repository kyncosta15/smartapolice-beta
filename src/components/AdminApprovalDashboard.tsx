import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Ticket,
  FileText,
  Shield,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface RequestDetail {
  id: string;
  protocol_code: string;
  kind: string;
  status: string;
  submitted_at: string;
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
    dependent_name?: string;
  }>;
  approvals?: Array<{
    id: string;
    role: string;
    decision: string;
    decided_at: string;
    note?: string;
  }>;
}

export const AdminApprovalDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AdminRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    tipo: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Verificar permissões - só admin pode ver
  const canApprove = profile?.role && ['admin', 'administrador', 'corretora_admin'].includes(profile.role);

  const fetchRequests = useCallback(async () => {
    if (!user?.id || !canApprove) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Buscando solicitações Admin...');

      const { data, error } = await supabase.functions.invoke('adm-requests-list');

      if (error) {
        console.error('❌ Erro ao buscar solicitações admin:', error);
        throw error;
      }

      if (!data?.ok || !data?.data) {
        throw new Error(data?.error?.message || 'Erro desconhecido');
      }

      console.log('📊 Solicitações admin recebidas:', data.data.length);
      setRequests(data.data);
    } catch (error) {
      console.error('💥 Erro ao carregar solicitações admin:', error);
      toast.error('Erro ao carregar solicitações: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, canApprove]);

  const fetchRequestDetail = useCallback(async (requestId: string) => {
    try {
      setIsLoadingDetail(true);
      console.log('🔍 Buscando detalhes da solicitação:', requestId);

      const { data, error } = await supabase.functions.invoke('rh-requests-detail', {
        body: { requestId }
      });

      if (error) {
        throw error;
      }

      if (!data?.ok || !data?.data) {
        throw new Error(data?.error?.message || 'Erro ao carregar detalhes');
      }

      setSelectedRequest(data.data);
    } catch (error) {
      console.error('💥 Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes: ' + (error as Error).message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Hook para carregar dados
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime
  useEffect(() => {
    if (!user?.id || !canApprove) return;

    const channel = supabase
      .channel('admin-requests-realtime')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'requests' },
          () => {
            console.log('🔄 Atualização automática - Admin requests');
            fetchRequests();
          })
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          () => {
            console.log('🔄 Atualização automática - Tickets');
            fetchRequests();
          })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, canApprove, fetchRequests]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = requests;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(req => 
        req.protocol_code.toLowerCase().includes(search) ||
        req.colaborador.toLowerCase().includes(search) ||
        req.cpf.includes(search)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (filters.tipo !== 'all') {
      filtered = filtered.filter(req => req.tipo === filters.tipo);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(req => 
        new Date(req.submitted_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(req => 
        new Date(req.submitted_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filters]);

  const handleViewRequest = async (requestId: string) => {
    await fetchRequestDetail(requestId);
  };

  const handleApproveRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      console.log('🚀 Iniciando aprovação da solicitação:', requestId);

      const { data, error } = await supabase.functions.invoke('adm-approve-request', {
        body: {
          requestId: requestId,
          note: ''
        }
      });

      console.log('📨 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro ao aprovar solicitação');
      }

      if (!data?.ok) {
        console.error('❌ Resposta negativa da edge function:', data);
        throw new Error(data?.error?.message || 'Erro ao aprovar solicitação');
      }

      console.log('✅ Aprovação processada com sucesso!');
      toast.success('Solicitação aprovada e convertida em ticket!');
      fetchRequests(); // Atualizar lista
      
      // Aguardar um pouco e mostrar detalhes
      setTimeout(async () => {
        await fetchRequestDetail(requestId);
      }, 500);
    } catch (error: any) {
      console.error('💥 Erro no processo de aprovação:', error);
      toast.error(error.message || 'Falha ao aprovar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('adm-requests-decline', {
        body: {
          requestId: requestId,
          reason: 'Recusado pelo Administrador'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao recusar solicitação');
      }

      if (!data?.ok) {
        throw new Error(data?.error?.message || 'Erro ao recusar solicitação');
      }

      toast.success('Solicitação recusada pela Administração.');
      fetchRequests(); // Atualizar lista
      
      // Aguardar um pouco e mostrar detalhes
      setTimeout(async () => {
        await fetchRequestDetail(requestId);
      }, 500);
    } catch (error: any) {
      console.error('Erro ao recusar:', error);
      toast.error(error.message || 'Falha ao recusar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {

    setIsProcessing(true);
    try {
      console.log('🚀 Iniciando aprovação da solicitação:', selectedRequest.id);
      console.log('📝 Status atual da solicitação:', selectedRequest.status);
      console.log('📋 Dados da solicitação:', selectedRequest);

      const { data, error } = await supabase.functions.invoke('adm-approve-request', {
        body: {
          requestId: selectedRequest.id,
          note: approvalNote || undefined
        }
      });

      console.log('📨 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro ao aprovar solicitação');
      }

      if (!data?.ok) {
        console.error('❌ Resposta negativa da edge function:', data);
        throw new Error(data?.error?.message || 'Erro ao aprovar solicitação');
      }

      console.log('✅ Aprovação processada com sucesso!');
      toast.success('Solicitação aprovada e convertida em ticket!');
      setShowApprovalDialog(false);
      setApprovalNote('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error('💥 Erro no processo de aprovação:', error);
      toast.error(error.message || 'Falha ao aprovar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('adm-requests-decline', {
        body: {
          requestId: selectedRequest.id,
          reason: declineReason || undefined
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao recusar solicitação');
      }

      if (!data?.ok) {
        throw new Error(data?.error?.message || 'Erro ao recusar solicitação');
      }

      toast.success('Solicitação recusada pela Administração.');
      setShowDeclineDialog(false);
      setDeclineReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Erro ao recusar:', error);
      toast.error(error.message || 'Falha ao recusar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      aguardando_aprovacao: { variant: 'secondary' as const, label: 'Aguardando Aprovação', icon: AlertTriangle },
      aprovado_rh: { variant: 'default' as const, label: 'Aprovado pelo RH', icon: CheckCircle },
      em_validacao_adm: { variant: 'secondary' as const, label: 'Aguardando Análise', icon: AlertTriangle },
      aprovado_adm: { variant: 'outline' as const, label: 'Aprovado (Ticket)', icon: Ticket },
      recusado_adm: { variant: 'destructive' as const, label: 'Recusado pela Adm', icon: XCircle }
    };

    const config = variants[status as keyof typeof variants] || { 
      variant: 'secondary' as const, 
      label: status, 
      icon: FileText 
    };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant={tipo === 'inclusao' ? 'default' : 'secondary'}>
        {tipo === 'inclusao' ? 'Inclusão' : 'Exclusão'}
      </Badge>
    );
  };

  // Estatísticas
  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === 'aprovado_rh' || r.status === 'aguardando_aprovacao').length,
    em_analise: requests.filter(r => r.status === 'em_validacao_adm').length,
    aprovados: requests.filter(r => r.status === 'aprovado_adm').length,
    recusados: requests.filter(r => r.status === 'recusado_adm').length
  };

  if (!canApprove) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portal Administrativo - Aprovação Final</h1>
          <p className="text-muted-foreground">
            Solicitações aguardando decisão final
          </p>
        </div>
        <Badge variant="outline" className="bg-red-50">
          <Shield className="h-4 w-4 mr-2" />
          Admin - {profile?.company || 'RCaldas Corretora'}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.em_analise}</p>
                <p className="text-sm text-muted-foreground">Em Análise</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.aprovados}</p>
                <p className="text-sm text-muted-foreground">Tickets Criados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.recusados}</p>
                <p className="text-sm text-muted-foreground">Recusados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome ou CPF..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                <SelectItem value="aprovado_rh">Aprovado pelo RH</SelectItem>
                <SelectItem value="em_validacao_adm">Em Análise Admin</SelectItem>
                <SelectItem value="aprovado_adm">Aprovado (Ticket)</SelectItem>
                <SelectItem value="recusado_adm">Recusado pela Adm</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="inclusao">Inclusão</SelectItem>
                <SelectItem value="exclusao">Exclusão</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              placeholder="Data inicial"
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              placeholder="Data final"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            Solicitações para Aprovação Final ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Protocolo</TableHead>
                   <TableHead>Informações</TableHead>
                   <TableHead>Tipo</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm text-primary">
                      {request.protocol_code}
                    </TableCell>
                     <TableCell>
                       <div className="flex flex-col gap-1">
                         <span className="font-medium text-sm">{request.colaborador}</span>
                         <span className="text-xs text-muted-foreground">CPF: {request.cpf}</span>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <span>{format(new Date(request.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                           <span>•</span>
                           <span>{request.qtd_itens} {request.qtd_itens === 1 ? 'item' : 'itens'}</span>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>{getTipoBadge(request.tipo)}</TableCell>
                     <TableCell>{getStatusBadge(request.status)}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleViewRequest(request.id)}
                           disabled={isLoadingDetail}
                           className="h-8 w-8 p-0"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         
                         {(request.status === 'aprovado_rh' || request.status === 'aguardando_aprovacao') && (
                           <>
             <Button 
               variant="default" 
               size="sm"
               onClick={() => handleApproveRequest(request.id)}
               disabled={isProcessing}
               className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
             >
               {isProcessing ? (
                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
               ) : (
                 <CheckCircle className="h-4 w-4" />
               )}
             </Button>
             <Button 
               variant="destructive" 
               size="sm"
               onClick={() => handleDeclineRequest(request.id)}
               disabled={isProcessing}
               className="h-8 w-8 p-0"
             >
               {isProcessing ? (
                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
               ) : (
                 <XCircle className="h-4 w-4" />
               )}
             </Button>
                           </>
                         )}
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Nenhuma solicitação pendente para aprovação
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                As solicitações aguardando aprovação aparecerão aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedRequest && !showApprovalDialog && !showDeclineDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análise Final - Protocolo {selectedRequest?.protocol_code}</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados do Colaborador
                    </h3>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>Nome:</strong> {selectedRequest.employee.full_name}</p>
                      <p><strong>CPF:</strong> {selectedRequest.employee.cpf}</p>
                      {selectedRequest.employee.email && (
                        <p><strong>Email:</strong> {selectedRequest.employee.email}</p>
                      )}
                      {selectedRequest.employee.phone && (
                        <p><strong>Telefone:</strong> {selectedRequest.employee.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Detalhes da Solicitação
                    </h3>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <p><strong>Tipo:</strong> {getTipoBadge(selectedRequest.kind)}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p>
                      <p><strong>Data de Envio:</strong> {format(new Date(selectedRequest.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Itens da Solicitação
                    </h3>
                    <div className="space-y-2">
                      {selectedRequest.request_items.map((item) => (
                        <div key={item.id} className="bg-muted p-3 rounded-md">
                          <p><strong>Alvo:</strong> {item.target === 'titular' ? 'Titular' : 'Dependente'}</p>
                          <p><strong>Ação:</strong> {item.action === 'incluir' ? 'Incluir' : 'Excluir'}</p>
                          {item.dependent_name && (
                            <p><strong>Nome do Dependente:</strong> {item.dependent_name}</p>
                          )}
                          {item.notes && (
                            <p><strong>Observações:</strong> {item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Histórico de Aprovações
                      </h3>
                      <div className="space-y-2">
                        {selectedRequest.approvals.map((approval) => (
                          <div key={approval.id} className="bg-muted p-3 rounded-md">
                            <p><strong>Perfil:</strong> {approval.role.toUpperCase()}</p>
                            <p><strong>Decisão:</strong> {approval.decision}</p>
                            <p><strong>Data:</strong> {format(new Date(approval.decided_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                            {approval.note && (
                              <p><strong>Observação:</strong> {approval.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprovação */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a aprovar a solicitação <strong>{selectedRequest?.protocol_code}</strong>.
              Esta ação criará um ticket no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">
              Observação da Aprovação (Opcional)
            </label>
            <Textarea
              placeholder="Adicione uma observação sobre a aprovação..."
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Aprovar e Criar Ticket
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Recusa */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a recusar a solicitação <strong>{selectedRequest?.protocol_code}</strong>.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo da Recusa <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Descreva o motivo da recusa..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDecline}
              disabled={isProcessing || !declineReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar Solicitação
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};