import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Edit, 
  FileText, 
  Clock, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Car,
  User,
  MapPin
} from 'lucide-react';

interface SinistrosCasosProps {
  sinistros: any[];
  searchTerm: string;
  statusFilter: string;
  seguradoraFilter: string;
  onCaseSelect: (caso: any) => void;
}

export function SinistrosCasos({ 
  sinistros, 
  searchTerm, 
  statusFilter, 
  seguradoraFilter, 
  onCaseSelect 
}: SinistrosCasosProps) {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'ABERTO': 'bg-blue-500',
      'EM_ANALISE': 'bg-yellow-500',
      'DOCUMENTACAO_PENDENTE': 'bg-orange-500',
      'EM_REGULACAO': 'bg-purple-500',
      'EM_REPARO': 'bg-indigo-500',
      'AGUARDANDO_PAGAMENTO': 'bg-cyan-500',
      'ENCERRADO': 'bg-green-500',
      'CANCELADO': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'ABERTO': 'Aberto',
      'EM_ANALISE': 'Em Análise',
      'DOCUMENTACAO_PENDENTE': 'Doc. Pendente',
      'EM_REGULACAO': 'Em Regulação',
      'EM_REPARO': 'Em Reparo',
      'AGUARDANDO_PAGAMENTO': 'Aguard. Pagamento',
      'ENCERRADO': 'Encerrado',
      'CANCELADO': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getGravidadeColor = (gravidade: string) => {
    const colors = {
      'BAIXA': 'bg-green-100 text-green-800',
      'MEDIA': 'bg-yellow-100 text-yellow-800',
      'ALTA': 'bg-red-100 text-red-800'
    };
    return colors[gravidade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDaysOpen = (dataAbertura: string) => {
    const today = new Date();
    const openDate = new Date(dataAbertura);
    const diffTime = Math.abs(today.getTime() - openDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredSinistros = sinistros.filter(sinistro => {
    const matchesSearch = !searchTerm || 
      sinistro.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sinistro.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sinistro.numero_sinistro?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || sinistro.status === statusFilter;
    const matchesSeguradora = !seguradoraFilter || seguradoraFilter === 'all' || sinistro.seguradora === seguradoraFilter;
    
    return matchesSearch && matchesStatus && matchesSeguradora;
  });

  const openDetailModal = (sinistro: any) => {
    setSelectedCase(sinistro);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total de Casos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{filteredSinistros.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Em Andamento</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {filteredSinistros.filter(s => !['ENCERRADO', 'CANCELADO'].includes(s.status)).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">SLA Crítico</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">
              {filteredSinistros.filter(s => getDaysOpen(s.data_abertura) > 15).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Valor Total</span>
            </div>
            <p className="text-xl font-bold mt-2">
              {formatCurrency(
                filteredSinistros.reduce((acc, s) => acc + (s.financeiro?.reserva_tecnica || 0), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sinisstros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket/Sinistro</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo/Gravidade</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Valor Reserva</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSinistros.map((sinistro) => {
                const daysOpen = getDaysOpen(sinistro.data_abertura);
                const isOverdue = daysOpen > 15;
                
                return (
                  <TableRow key={sinistro.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sinistro.ticket_id}</p>
                        {sinistro.numero_sinistro && (
                          <p className="text-sm text-muted-foreground">{sinistro.numero_sinistro}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sinistro.veiculo?.placa}</p>
                        <p className="text-sm text-muted-foreground">
                          {sinistro.veiculo?.marca} {sinistro.veiculo?.modelo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(sinistro.status)} text-white`}>
                        {getStatusLabel(sinistro.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{sinistro.tipo_evento}</p>
                        <Badge variant="outline" className={getGravidadeColor(sinistro.gravidade)}>
                          {sinistro.gravidade}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{sinistro.seguradora}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sinistro.financeiro?.reserva_tecnica || 0)}
                    </TableCell>
                    <TableCell>{sinistro.data_abertura}</TableCell>
                    <TableCell>
                      <Badge variant={isOverdue ? "destructive" : "outline"}>
                        {daysOpen}d
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(sinistro)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCaseSelect(sinistro)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Case Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Caso - {selectedCase?.ticket_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6">
              {/* Status and Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Status Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={`${getStatusColor(selectedCase.status)} text-white`}>
                      {getStatusLabel(selectedCase.status)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Veículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedCase.veiculo?.placa}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCase.veiculo?.marca} {selectedCase.veiculo?.modelo}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {formatCurrency(selectedCase.financeiro?.reserva_tecnica || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Reserva técnica</p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline do Caso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Caso aberto</p>
                        <p className="text-sm text-muted-foreground">{selectedCase.data_abertura}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Em análise pela seguradora</p>
                        <p className="text-sm text-muted-foreground">Aguardando documentação</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Status dos Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Boletim de Ocorrência</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Pendente
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Laudo da Oficina</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Recebido
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>CRLV</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Recebido
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Nota Fiscal Reparo</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}