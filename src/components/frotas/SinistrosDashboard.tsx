import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  Calendar,
  Car,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Sinistro {
  id: string;
  placa: string;
  tipo: string;
  descricao: string;
  status: 'aberto' | 'em_analise' | 'finalizado';
  valor_estimado?: number;
  data_ocorrencia: string;
  created_at: string;
  updated_at: string;
}

interface SinistrosDashboardProps {
  loading?: boolean;
}

// Mock data - replace with real data from your API
const mockSinistros: Sinistro[] = [
  {
    id: '1',
    placa: 'ABC1234',
    tipo: 'Colisão',
    descricao: 'Colisão traseira no centro da cidade',
    status: 'aberto',
    valor_estimado: 5000,
    data_ocorrencia: '2025-01-10',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z'
  },
  {
    id: '2',
    placa: 'DEF5678',
    tipo: 'Roubo/Furto',
    descricao: 'Veículo furtado no estacionamento',
    status: 'em_analise',
    valor_estimado: 45000,
    data_ocorrencia: '2025-01-08',
    created_at: '2025-01-08T14:30:00Z',
    updated_at: '2025-01-09T09:15:00Z'
  },
  {
    id: '3',
    placa: 'GHI9012',
    tipo: 'Danos Naturais',
    descricao: 'Granizo danificou a lataria',
    status: 'finalizado',
    valor_estimado: 2500,
    data_ocorrencia: '2025-01-05',
    created_at: '2025-01-05T16:20:00Z',
    updated_at: '2025-01-07T11:45:00Z'
  }
];

export function SinistrosDashboard({ loading = false }: SinistrosDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos');

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const total = mockSinistros.length;
    const abertos = mockSinistros.filter(s => s.status === 'aberto' || s.status === 'em_analise').length;
    const finalizados = mockSinistros.filter(s => s.status === 'finalizado').length;
    const ultimos60Dias = mockSinistros.filter(s => 
      new Date(s.created_at) >= sixtyDaysAgo
    ).length;

    return {
      total,
      abertos,
      finalizados,
      ultimos60Dias
    };
  }, []);

  // Filter sinistros
  const filteredSinistros = useMemo(() => {
    let filtered = mockSinistros;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.placa.toLowerCase().includes(term) ||
        s.tipo.toLowerCase().includes(term) ||
        s.descricao.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (periodoFilter !== 'todos') {
      const today = new Date();
      let startDate: Date;
      
      switch (periodoFilter) {
        case '7dias':
          startDate = new Date();
          startDate.setDate(today.getDate() - 7);
          break;
        case '30dias':
          startDate = new Date();
          startDate.setDate(today.getDate() - 30);
          break;
        case '60dias':
          startDate = new Date();
          startDate.setDate(today.getDate() - 60);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(s => new Date(s.created_at) >= startDate);
    }

    return filtered;
  }, [searchTerm, statusFilter, periodoFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto':
        return <Badge variant="destructive">Em Aberto</Badge>;
      case 'em_analise':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Análise</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Finalizado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Table skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Sinistros
                </p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Em Aberto
                </p>
                <p className="text-2xl font-bold text-red-600">{kpis.abertos}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Finalizados
                </p>
                <p className="text-2xl font-bold text-green-600">{kpis.finalizados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Últimos 60 dias
                </p>
                <p className="text-2xl font-bold text-blue-600">{kpis.ultimos60Dias}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por placa, tipo ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="aberto">Em Aberto</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="60dias">Últimos 60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sinistros List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lista de Sinistros ({filteredSinistros.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSinistros.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum sinistro encontrado
              </h3>
              <p className="text-gray-500">
                Não há sinistros que correspondam aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Estimado</TableHead>
                    <TableHead>Data Ocorrência</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSinistros.map((sinistro) => (
                    <TableRow key={sinistro.id}>
                      <TableCell className="font-mono font-medium">
                        {sinistro.placa}
                      </TableCell>
                      <TableCell>{sinistro.tipo}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {sinistro.descricao}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sinistro.status)}
                      </TableCell>
                      <TableCell>
                        {sinistro.valor_estimado ? formatCurrency(sinistro.valor_estimado) : '—'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sinistro.data_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}