import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  FileText, 
  MoreHorizontal,
  Car,
  User,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FrotasTableProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
  onRefetch: () => void;
}

export function FrotasTable({ veiculos, loading, onRefetch }: FrotasTableProps) {
  const [selectedVeiculo, setSelectedVeiculo] = useState<FrotaVeiculo | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'segurado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Segurado</Badge>;
      case 'sem_seguro':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Seguro</Badge>;
      case 'cotacao':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Cotação</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoriaBadge = (categoria?: string) => {
    if (!categoria) return null;
    
    const colors = {
      passeio: 'bg-blue-100 text-blue-800 border-blue-200',
      utilitario: 'bg-purple-100 text-purple-800 border-purple-200',
      caminhao: 'bg-orange-100 text-orange-800 border-orange-200',
      moto: 'bg-green-100 text-green-800 border-green-200',
      outros: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      passeio: 'Passeio',
      utilitario: 'Utilitário',
      caminhao: 'Caminhão',
      moto: 'Moto',
      outros: 'Outros',
    };

    return (
      <Badge className={colors[categoria as keyof typeof colors] || colors.outros}>
        {labels[categoria as keyof typeof labels] || categoria}
      </Badge>
    );
  };

  const getEmplacamentoStatus = (dataVencimento?: string) => {
    if (!dataVencimento) return { text: 'Não definido', color: 'text-gray-500' };
    
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) {
      return { text: 'Vencido', color: 'text-red-600' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays}d`, color: 'text-yellow-600' };
    } else {
      return { text: format(vencimento, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-green-600' };
    }
  };

  const getModalidadeBadge = (modalidade?: string) => {
    if (!modalidade) return null;
    
    const colors = {
      financiado: 'bg-blue-100 text-blue-800 border-blue-200',
      avista: 'bg-green-100 text-green-800 border-green-200',
      consorcio: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const labels = {
      financiado: 'Financiado',
      avista: 'À Vista',
      consorcio: 'Consórcio',
    };

    return (
      <Badge className={colors[modalidade as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {labels[modalidade as keyof typeof labels] || modalidade}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (veiculos.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum veículo encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Não há veículos cadastrados ou que correspondam aos filtros aplicados.
            </p>
            <Button onClick={onRefetch} variant="outline">
              Recarregar dados
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Lista de Veículos ({veiculos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Emplacamento</TableHead>
                <TableHead>Status Seguro</TableHead>
                <TableHead>FIPE</TableHead>
                <TableHead>Valor NF</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculos.map((veiculo) => {
                const emplacamentoStatus = getEmplacamentoStatus(veiculo.data_venc_emplacamento);
                const responsavel = veiculo.responsaveis?.[0];

                return (
                  <TableRow key={veiculo.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {veiculo.marca} {veiculo.modelo}
                        </div>
                        {veiculo.ano_modelo && (
                          <div className="text-sm text-gray-500">
                            {veiculo.ano_modelo}
                          </div>
                        )}
                        {getCategoriaBadge(veiculo.categoria)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-mono font-medium">
                        {veiculo.placa}
                      </div>
                      {veiculo.uf_emplacamento && (
                        <div className="text-sm text-gray-500">
                          {veiculo.uf_emplacamento}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {veiculo.proprietario_nome && (
                          <div className="font-medium text-gray-900">
                            {veiculo.proprietario_nome}
                          </div>
                        )}
                        {veiculo.proprietario_doc && (
                          <div className="text-sm text-gray-500 font-mono">
                            {veiculo.proprietario_doc}
                          </div>
                        )}
                        {veiculo.proprietario_tipo && (
                          <Badge variant="outline" className="text-xs">
                            {veiculo.proprietario_tipo === 'pj' ? 'PJ' : 'PF'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className={`font-medium ${emplacamentoStatus.color}`}>
                        {emplacamentoStatus.text}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(veiculo.status_seguro)}
                    </TableCell>

                    <TableCell>
                      {veiculo.preco_fipe ? (
                        <div className="font-medium text-green-600">
                          {formatCurrency(veiculo.preco_fipe)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {veiculo.preco_nf ? (
                        <div className="font-medium">
                          {formatCurrency(veiculo.preco_nf)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getModalidadeBadge(veiculo.modalidade_compra)}
                      {veiculo.modalidade_compra === 'consorcio' && veiculo.consorcio_grupo && (
                        <div className="text-xs text-gray-500 mt-1">
                          Grupo: {veiculo.consorcio_grupo}
                          {veiculo.consorcio_cota && ` | Cota: ${veiculo.consorcio_cota}`}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {responsavel ? (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {responsavel.nome}
                          </div>
                          {responsavel.telefone && (
                            <div className="text-xs text-gray-500">
                              {responsavel.telefone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não definido</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedVeiculo(veiculo)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}