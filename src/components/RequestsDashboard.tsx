// Dashboard de solicitações para RH

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search,
  Filter, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  Users,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RequestWithDetails {
  id: string;
  protocol_code: string;
  employee_id: string;
  kind: 'inclusao' | 'exclusao';
  status: 'recebido' | 'em_validacao' | 'concluido' | 'recusado';
  submitted_at: string;
  created_at: string;
  metadata: any;
  employee: {
    full_name: string;
    cpf: string;
    email?: string;
  };
  request_items: {
    id: string;
    target: 'titular' | 'dependente';
    action: 'incluir' | 'excluir';
    notes?: string;
    dependent?: {
      full_name: string;
      relationship: string;
    };
  }[];
  files: {
    id: string;
    original_name?: string;
    path: string;
  }[];
}

export const RequestsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    kind: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);

      // Busca requests de forma mais simples, sem joins complexos
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          *,
          request_items(
            id,
            target,
            action,
            notes,
            dependents(
              full_name,
              relationship
            )
          ),
          files(
            id,
            original_name,
            path
          )
        `)
        .eq('draft', false)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Para cada request, buscar dados do employee separadamente
      const transformedRequests: RequestWithDetails[] = [];
      
      for (const request of requestsData || []) {
        if (request.employee_id) {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('full_name, cpf, email, company_id')
            .eq('id', request.employee_id)
            .single();

          if (employeeData) {
            // Buscar empresa separadamente
            const { data: empresaData } = await supabase
              .from('empresas')
              .select('nome')
              .eq('id', employeeData.company_id)
              .single();

            // Verificar se é da mesma empresa do usuário
            if (empresaData?.nome === user?.company) {
              transformedRequests.push({
                ...request,
                kind: request.kind as 'inclusao' | 'exclusao',
                status: request.status as 'recebido' | 'em_validacao' | 'concluido' | 'recusado',
                employee: {
                  full_name: employeeData.full_name,
                  cpf: employeeData.cpf,
                  email: employeeData.email
                },
                request_items: request.request_items.map((item: any) => ({
                  ...item,
                  dependent: item.dependents
                }))
              });
            }
          }
        }
      }

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.company]);

  // Aplica filtros
  useEffect(() => {
    let filtered = requests;

    // Busca por texto
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(req => 
        req.protocol_code.toLowerCase().includes(search) ||
        req.employee.full_name.toLowerCase().includes(search) ||
        req.employee.cpf.includes(search)
      );
    }

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    // Filtro por tipo
    if (filters.kind !== 'all') {
      filtered = filtered.filter(req => req.kind === filters.kind);
    }

    // Filtro por data
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

  const updateRequestStatus = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(notes && { 
            metadata: { 
              ...selectedRequest?.metadata,
              internal_notes: notes 
            }
          })
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      recebido: { variant: 'secondary' as const, label: 'Recebido' },
      em_validacao: { variant: 'default' as const, label: 'Em Validação' },
      concluido: { variant: 'default' as const, label: 'Concluído' },
      recusado: { variant: 'destructive' as const, label: 'Recusado' }
    };

    const config = variants[status as keyof typeof variants] || variants.recebido;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    recebidos: requests.filter(r => r.status === 'recebido').length,
    em_validacao: requests.filter(r => r.status === 'em_validacao').length,
    concluidos: requests.filter(r => r.status === 'concluido').length,
    recusados: requests.filter(r => r.status === 'recusado').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.recebidos}</p>
                <p className="text-sm text-muted-foreground">Recebidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.em_validacao}</p>
                <p className="text-sm text-muted-foreground">Em Validação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.concluidos}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
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
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="em_validacao">Em Validação</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
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
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{request.request_items.length} itens</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          {selectedRequest && (
                            <RequestDetailModal 
                              request={selectedRequest} 
                              onUpdateStatus={updateRequestStatus}
                              onClose={() => setSelectedRequest(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente do modal de detalhes
const RequestDetailModal: React.FC<{
  request: RequestWithDetails;
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
  onClose: () => void;
}> = ({ request, onUpdateStatus, onClose }) => {
  const [newStatus, setNewStatus] = useState<string>(request.status);
  const [notes, setNotes] = useState('');

  const getStatusBadge = (status: string) => {
    const variants = {
      recebido: { variant: 'secondary' as const, label: 'Recebido' },
      em_validacao: { variant: 'default' as const, label: 'Em Validação' },
      concluido: { variant: 'default' as const, label: 'Concluído' },
      recusado: { variant: 'destructive' as const, label: 'Recusado' }
    };
    const config = variants[status as keyof typeof variants] || variants.recebido;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getKindBadge = (kind: string) => {
    return (
      <Badge variant={kind === 'inclusao' ? 'default' : 'secondary'}>
        {kind === 'inclusao' ? 'Inclusão' : 'Exclusão'}
      </Badge>
    );
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>
          Solicitação {request.protocol_code}
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] mt-4">
        <div className="space-y-6">
          {/* Dados do colaborador */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Colaborador
            </h3>
            <Card className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span>
                  <p>{request.employee.full_name}</p>
                </div>
                <div>
                  <span className="font-medium">CPF:</span>
                  <p>{request.employee.cpf}</p>
                </div>
                {request.employee.email && (
                  <div>
                    <span className="font-medium">E-mail:</span>
                    <p>{request.employee.email}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Data da solicitação:</span>
                  <p>{format(new Date(request.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detalhes da solicitação */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes da Solicitação
            </h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                {getKindBadge(request.kind)}
                {getStatusBadge(request.status)}
              </div>

              {/* Itens */}
              <div>
                <h4 className="font-medium mb-2">Itens solicitados:</h4>
                <div className="space-y-2">
                  {request.request_items.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        {item.target === 'titular' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {item.target === 'titular' 
                            ? 'Titular' 
                            : item.dependent?.full_name
                          }
                        </span>
                        {item.dependent && (
                          <Badge variant="outline" className="text-xs">
                            {item.dependent.relationship}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className={item.action === 'incluir' ? 'text-green-600' : 'text-red-600'}>
                          {item.action === 'incluir' ? 'Incluir' : 'Excluir'}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {request.metadata?.notes && (
                <div>
                  <h4 className="font-medium mb-2">Observações:</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                    {request.metadata.notes}
                  </p>
                </div>
              )}

              {/* Arquivos */}
              {request.files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Arquivos anexados:</h4>
                  <div className="space-y-1">
                    {request.files.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{file.original_name || 'Arquivo'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações do RH */}
          <div>
            <h3 className="font-semibold mb-3">Ações do RH</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Alterar status:
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="em_validacao">Em Validação</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações internas (opcional):
                </label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta solicitação..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => onUpdateStatus(request.id, newStatus, notes)}
                  disabled={newStatus === request.status && !notes}
                >
                  Atualizar Status
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};