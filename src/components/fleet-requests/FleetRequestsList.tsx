import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Filter, 
  Search, 
  Eye, 
  Calendar,
  User,
  Car,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useFleetRequests } from '@/hooks/useFleetRequests';
import { FleetRequestDetailsModal } from './FleetRequestDetailsModal';
import { 
  FLEET_REQUEST_TIPOS, 
  FLEET_REQUEST_STATUS, 
  FLEET_REQUEST_PRIORIDADES 
} from '@/types/fleet-requests';
import type { FleetChangeRequest } from '@/types/fleet-requests';

export function FleetRequestsList() {
  const { requests, loading } = useFleetRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<FleetChangeRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Filtrar solicitações
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.chassi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesTipo = !tipoFilter || request.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = FLEET_REQUEST_STATUS.find(s => s.value === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const variant = status === 'aprovado' || status === 'executado' ? 'default' :
                   status === 'recusado' ? 'destructive' :
                   status === 'em_triagem' ? 'secondary' : 'outline';

    return (
      <Badge variant={variant} className="gap-1">
        {status === 'aprovado' && <CheckCircle className="h-3 w-3" />}
        {status === 'recusado' && <XCircle className="h-3 w-3" />}
        {status === 'em_triagem' && <Clock className="h-3 w-3" />}
        {status === 'aberto' && <AlertCircle className="h-3 w-3" />}
        {statusConfig.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeConfig = FLEET_REQUEST_PRIORIDADES.find(p => p.value === prioridade);
    if (!prioridadeConfig) return <Badge variant="outline">{prioridade}</Badge>;

    const variant = prioridade === 'alta' ? 'destructive' :
                   prioridade === 'normal' ? 'default' : 'secondary';

    return <Badge variant={variant}>{prioridadeConfig.label}</Badge>;
  };

  const getTipoLabel = (tipo: string) => {
    const tipoConfig = FLEET_REQUEST_TIPOS.find(t => t.value === tipo);
    return tipoConfig?.label || tipo;
  };

  const handleViewDetails = (request: FleetChangeRequest) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const getShortId = (id: string) => {
    return id.substring(0, 8).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitações de Alteração
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por placa, chassi ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {FLEET_REQUEST_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {FLEET_REQUEST_TIPOS.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter || tipoFilter
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Ainda não há solicitações de alteração'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        #{getShortId(request.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{getTipoLabel(request.tipo)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.placa && (
                            <div className="font-mono font-medium">{request.placa}</div>
                          )}
                          {request.chassi && (
                            <div className="text-gray-500 text-xs">
                              Chassi: {request.chassi.substring(0, 8)}...
                            </div>
                          )}
                          {!request.placa && !request.chassi && (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {getPrioridadeBadge(request.prioridade)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
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

      {/* Modal de detalhes */}
      {selectedRequest && (
        <FleetRequestDetailsModal
          request={selectedRequest}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </>
  );
}