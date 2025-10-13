import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, Eye, MoreHorizontal, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Assistance } from '@/types/claims';
import { ClaimsService } from '@/services/claims';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssistancesViewProps {
  searchTerm: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function AssistancesView({ 
  searchTerm, 
  statusFilter = 'all',
  onStatusFilterChange 
}: AssistancesViewProps) {
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssistances();
  }, [searchTerm, statusFilter]);

  const loadAssistances = async () => {
    setLoading(true);
    try {
      const { data } = await ClaimsService.getAssistances({
        search: searchTerm,
        status: statusFilter
      });
      setAssistances(data);
    } catch (error) {
      console.error('Error loading assistances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssistance = async (assistanceId: string) => {
    try {
      await ClaimsService.deleteAssistance(assistanceId);
      setAssistances(prev => prev.filter(a => a.id !== assistanceId));
    } catch (error) {
      console.error('Error deleting assistance:', error);
    }
  };

  const getAssistanceTypeLabel = (tipo: string) => {
    const labels = {
      'guincho': 'Guincho',
      'vidro': 'Vidro',
      'residencia': 'Residência',
      'outro': 'Outro'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getAssistanceTypeColor = (tipo: string) => {
    const colors = {
      'guincho': 'bg-blue-100 text-blue-800',
      'vidro': 'bg-green-100 text-green-800',
      'residencia': 'bg-purple-100 text-purple-800',
      'outro': 'bg-gray-100 text-gray-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'aberto': 'bg-orange-100 text-orange-800 border-orange-200',
      'finalizado': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'aberto': 'Aberto',
      'finalizado': 'Finalizado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const statusOptions = [
    { value: 'all', label: 'Todos', count: assistances.length },
    { value: 'aberto', label: 'Em aberto', count: assistances.filter(a => a.status === 'aberto').length },
    { value: 'finalizado', label: 'Finalizados', count: assistances.filter(a => a.status === 'finalizado').length },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-purple-600">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Assistências
                </p>
                <p className="text-2xl font-bold">
                  {assistances.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-orange-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Em Aberto
                </p>
                <p className="text-2xl font-bold">
                  {assistances.filter(a => a.status === 'aberto').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Finalizadas
                </p>
                <p className="text-2xl font-bold">
                  {assistances.filter(a => a.status === 'finalizado').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(option => (
          <Button
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilterChange?.(option.value)}
            className="h-8"
          >
            {option.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Assistances List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Lista de Assistências
            <Badge variant="outline" className="ml-auto">
              {assistances.length} {assistances.length === 1 ? 'item' : 'itens'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assistances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assistência encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tabela para Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assistances.map((assistance) => (
                      <TableRow key={assistance.id}>
                        <TableCell>
                          <Badge className={getAssistanceTypeColor(assistance.tipo)}>
                            {getAssistanceTypeLabel(assistance.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assistance.veiculo.placa}</p>
                            <p className="text-sm text-muted-foreground">
                              {assistance.veiculo.marca} {assistance.veiculo.modelo}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(assistance.status)}>
                            {getStatusLabel(assistance.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(assistance.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteAssistance(assistance.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards para Mobile */}
              <div className="md:hidden space-y-4">
                {assistances.map((assistance) => (
                  <Card key={assistance.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getAssistanceTypeColor(assistance.tipo)}>
                              {getAssistanceTypeLabel(assistance.tipo)}
                            </Badge>
                          </div>
                          <p className="font-semibold">{assistance.veiculo.placa}</p>
                          <p className="text-sm text-muted-foreground">
                            {assistance.veiculo.marca} {assistance.veiculo.modelo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAssistance(assistance.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(assistance.status)}>
                          {getStatusLabel(assistance.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(assistance.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}