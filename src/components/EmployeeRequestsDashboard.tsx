import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  UserPlus,
  UserMinus,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtime } from '@/hooks/useRealtime';

interface EmployeeRequest {
  id: string;
  protocol_code: string;
  kind: 'inclusao' | 'exclusao';
  status: string;
  submitted_at: string;
  employee_id?: string;
  metadata?: any;
  created_at: string;
}

export const EmployeeRequestsDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    kind: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Buscando solicitações de colaboradores...');

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('draft', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar solicitações:', error);
        throw error;
      }

      console.log('📊 Solicitações recebidas:', data?.length || 0);
      
      // Transformar dados para o formato esperado
      const transformedData: EmployeeRequest[] = (data || []).map((request: any) => ({
        id: request.id,
        protocol_code: request.protocol_code,
        kind: request.kind,
        status: request.status,
        submitted_at: request.submitted_at || request.created_at,
        employee_id: request.employee_id,
        metadata: request.metadata,
        created_at: request.created_at
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('💥 Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Configurar realtime
  useRealtime(fetchRequests, [
    { table: 'requests', event: '*' }
  ]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = requests;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(req => 
        req.protocol_code.toLowerCase().includes(search) ||
        (req.metadata?.nome && req.metadata.nome.toLowerCase().includes(search)) ||
        (req.metadata?.cpf && req.metadata.cpf.includes(search))
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

  const getStatusBadge = (status: string) => {
    const variants = {
      'aguardando_aprovacao': { variant: 'secondary' as const, label: 'Aguardando Aprovação', icon: Clock },
      'em_validacao': { variant: 'default' as const, label: 'Em Análise', icon: Eye },
      'aprovado': { variant: 'outline' as const, label: 'Aprovado → Admin', icon: ArrowRight },
      'recusado': { variant: 'destructive' as const, label: 'Recusado', icon: XCircle },
      'concluido': { variant: 'default' as const, label: 'Concluído', icon: CheckCircle },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle }
    };

    const config = variants[status as keyof typeof variants] || variants['aguardando_aprovacao'];
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
      <Badge variant={kind === 'inclusao' ? 'default' : 'secondary'} className="flex items-center gap-1">
        {kind === 'inclusao' ? (
          <>
            <UserPlus className="h-3 w-3" />
            Inclusão
          </>
        ) : (
          <>
            <UserMinus className="h-3 w-3" />
            Exclusão
          </>
        )}
      </Badge>
    );
  };

  // Estatísticas
  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === 'aguardando_aprovacao').length,
    em_analise: requests.filter(r => r.status === 'em_validacao').length,
    aprovados: requests.filter(r => r.status === 'aprovado').length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Solicitações de Colaboradores</h1>
          <p className="text-muted-foreground">
            Acompanhe suas solicitações de inclusão e exclusão de colaboradores
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
              <ArrowRight className="h-8 w-8 text-blue-600" />
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
                placeholder="Buscar por protocolo ou nome..."
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
                <SelectItem value="em_validacao">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhuma solicitação encontrada
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.protocol_code}
                      </TableCell>
                      <TableCell>{getKindBadge(request.kind)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.metadata?.nome || request.metadata?.employee_name || 'N/A'}
                          </p>
                          {request.metadata?.cpf && (
                            <p className="text-sm text-muted-foreground">
                              CPF: {request.metadata.cpf}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast.info('Funcionalidade de detalhes em desenvolvimento');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};