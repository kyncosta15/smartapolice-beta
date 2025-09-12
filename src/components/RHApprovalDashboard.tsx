import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Users,
  FileText,
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RequestWithDetails {
  id: string;
  protocol_code: string;
  kind: 'inclusao' | 'exclusao';
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
    target: 'titular' | 'dependente';
    action: 'incluir' | 'excluir';
    notes?: string;
    dependent?: {
      full_name: string;
      relationship: string;
    };
  }>;
  files: Array<{
    id: string;
    original_name?: string;
    path: string;
  }>;
}

export const RHApprovalDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    kind: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Verificar permissões
  const canApprove = profile?.role && ['rh', 'admin', 'administrador', 'gestor_rh'].includes(profile.role);

  const fetchRequests = useCallback(async () => {
    if (!user?.id || !canApprove) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Buscando solicitações RH...');

      const { data, error } = await supabase.functions.invoke('rh-requests-list');

      if (error) {
        console.error('❌ Erro ao buscar solicitações:', error);
        throw error;
      }

      if (!data?.ok || !data?.data) {
        throw new Error(data?.error?.message || 'Erro desconhecido');
      }

      console.log('📊 Solicitações recebidas:', data.data.length);
      
      // Transformar dados para o formato esperado
      const transformedRequests: RequestWithDetails[] = data.data.map((req: any) => ({
        id: req.id,
        protocol_code: req.protocol_code,
        kind: req.tipo as 'inclusao' | 'exclusao',
        status: req.status,
        submitted_at: req.submitted_at,
        employee: {
          full_name: req.colaborador,
          cpf: req.cpf,
          email: '',
          phone: ''
        },
        request_items: [],
        files: []
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('💥 Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, canApprove]);

  // Hook para carregar dados
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime
  useEffect(() => {
    if (!user?.id || !canApprove) return;

    const channel = supabase
      .channel('rh-requests-realtime')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'requests' },
          () => {
            console.log('🔄 Atualização automática - RH requests');
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
        req.employee.full_name.toLowerCase().includes(search) ||
        req.employee.cpf.includes(search)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (filters.kind !== 'all') {
      filtered = filtered.filter(req => req.kind === filters.kind);
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

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rh-approve-request', {
        body: {
          requestId: selectedRequest.id,
          note: approvalNote || undefined
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao aprovar solicitação');
      }

      if (!data?.ok) {
        throw new Error(data?.error?.message || 'Erro ao aprovar solicitação');
      }

      toast.success('Solicitação aprovada! Enviada para análise administrativa.');
      setShowApprovalDialog(false);
      setApprovalNote('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.message || 'Falha ao aprovar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rh-requests-decline', {
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

      toast.success('Solicitação recusada.');
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
      recebido: { variant: 'secondary' as const, label: 'Aguardando RH', icon: Clock },
      em_validacao: { variant: 'default' as const, label: 'Em Análise RH', icon: Eye },
      aprovado_rh: { variant: 'outline' as const, label: 'Aprovado → Admin', icon: ArrowRight },
      recusado_rh: { variant: 'destructive' as const, label: 'Recusado pelo RH', icon: XCircle },
      aprovado_adm: { variant: 'default' as const, label: 'Aprovado Final', icon: CheckCircle },
      recusado_adm: { variant: 'destructive' as const, label: 'Recusado pela Adm', icon: XCircle }
    };

    const config = variants[status as keyof typeof variants] || variants.recebido;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getKindBadge = (kind: string) => {
    return (
      <Badge variant={kind === 'inclusao' ? 'default' : 'secondary'}>
        {kind === 'inclusao' ? 'Inclusão' : 'Exclusão'}
      </Badge>
    );
  };

  // Estatísticas
  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === 'recebido').length,
    em_analise: requests.filter(r => r.status === 'em_validacao').length,
    aprovados: requests.filter(r => r.status === 'aprovado_rh').length,
    recusados: requests.filter(r => r.status === 'recusado_rh').length
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
          <h1 className="text-2xl font-bold">Portal RH - Aprovação de Solicitações</h1>
          <p className="text-muted-foreground">
            Analise e aprove solicitações de colaboradores
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50">
          RH - {profile?.company}
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
              <Clock className="h-8 w-8 text-orange-600" />
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
              <Eye className="h-8 w-8 text-blue-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.aprovados}</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
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
                <SelectItem value="recebido">Aguardando RH</SelectItem>
                <SelectItem value="em_validacao">Em Análise RH</SelectItem>
                <SelectItem value="aprovado_rh">Aprovado → Admin</SelectItem>
                <SelectItem value="recusado_rh">Recusado pelo RH</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.kind} onValueChange={(value) => setFilters(prev => ({ ...prev, kind: value }))}>
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
          <CardTitle>Solicitações ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.protocol_code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.employee.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          CPF: {request.employee.cpf}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getKindBadge(request.kind)}</TableCell>
                    <TableCell>
                      {format(new Date(request.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </Button>
                      
                      {(request.status === 'recebido' || request.status === 'em_validacao') && (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDeclineDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Recusar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedRequest && !showApprovalDialog && !showDeclineDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Protocolo</label>
                  <p className="font-mono">{selectedRequest.protocol_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Colaborador</label>
                  <p>{selectedRequest.employee.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">CPF</label>
                  <p>{selectedRequest.employee.cpf}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <div className="mt-1">{getKindBadge(selectedRequest.kind)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <p>{format(new Date(selectedRequest.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
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
              Esta solicitação será enviada para aprovação administrativa após sua confirmação.
              Deseja adicionar uma observação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Observação (opcional)"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              maxLength={500}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Aprovando...' : 'Aprovar Solicitação'}
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
              Esta ação marcará a solicitação como recusada pelo RH. 
              Informe o motivo da recusa:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Motivo da recusa *"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              maxLength={500}
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
              {isProcessing ? 'Recusando...' : 'Recusar Solicitação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};