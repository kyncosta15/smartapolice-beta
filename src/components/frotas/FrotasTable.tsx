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
  MoreVertical,
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
  /** Altura máxima da área da tabela. Ex: '60vh' ou 'calc(100vh - 220px)' */
  maxHeight?: string;
}

interface VehicleActionsProps {
  veiculo: FrotaVeiculo;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDocs: (id: string) => void;
}

function VehicleActions({ veiculo, onView, onEdit, onDocs }: VehicleActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {/* Botão primário no mobile */}
      <Button
        size="sm"
        variant="outline"
        className="sm:hidden h-8 px-3"
        onClick={() => onView(veiculo.id)}
        aria-label="Ver detalhes"
      >
        <Eye className="w-4 h-4 mr-1" /> Ver
      </Button>

      {/* Kebab sempre disponível */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Mais ações"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => onView(veiculo.id)}>
            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(veiculo.id)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDocs(veiculo.id)}>
            <FileText className="mr-2 h-4 w-4" /> Documentos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function FrotasTable({ veiculos, loading, onRefetch, maxHeight = '60vh' }: FrotasTableProps) {
  const [selectedVeiculo, setSelectedVeiculo] = useState<FrotaVeiculo | null>(null);

  const handleView = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      setSelectedVeiculo(veiculo);
      // TODO: Abrir modal de detalhes
      console.log('Ver detalhes do veículo:', veiculo);
    }
  };

  const handleEdit = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      // TODO: Abrir modal de edição
      console.log('Editar veículo:', veiculo);
    }
  };

  const handleDocs = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      // TODO: Abrir documentos
      console.log('Ver documentos do veículo:', veiculo);
    }
  };

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
    <Card className="border-0 shadow-sm flex flex-col min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Lista de Veículos ({veiculos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        {/* Wrapper com scroll interno */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight }}
          tabIndex={0}
          aria-label="Tabela de veículos rolável"
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="min-w-[200px] bg-background" scope="col">Veículo</TableHead>
                <TableHead className="bg-background" scope="col">Placa</TableHead>
                <TableHead className="bg-background" scope="col">Proprietário</TableHead>
                <TableHead className="bg-background" scope="col">Emplacamento</TableHead>
                <TableHead className="bg-background" scope="col">Status Seguro</TableHead>
                <TableHead className="bg-background" scope="col">FIPE</TableHead>
                <TableHead className="bg-background" scope="col">Valor NF</TableHead>
                <TableHead className="bg-background" scope="col">Modalidade</TableHead>
                <TableHead className="bg-background" scope="col">Responsável</TableHead>
                <TableHead className="w-[50px] bg-background" scope="col">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:hover]:bg-muted/50">
              {veiculos.map((veiculo) => {
                const emplacamentoStatus = getEmplacamentoStatus(veiculo.data_venc_emplacamento);
                const responsavel = veiculo.responsaveis?.[0];

                return (
                  <TableRow key={veiculo.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          {veiculo.marca} {veiculo.modelo}
                        </div>
                        {veiculo.ano_modelo && (
                          <div className="text-sm text-muted-foreground">
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
                        <div className="text-sm text-muted-foreground">
                          {veiculo.uf_emplacamento}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {veiculo.proprietario_nome && (
                          <div className="font-medium text-foreground">
                            {veiculo.proprietario_nome}
                          </div>
                        )}
                        {veiculo.proprietario_doc && (
                          <div className="text-sm text-muted-foreground font-mono">
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
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {veiculo.preco_nf ? (
                        <div className="font-medium">
                          {formatCurrency(veiculo.preco_nf)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getModalidadeBadge(veiculo.modalidade_compra)}
                      {veiculo.modalidade_compra === 'consorcio' && veiculo.consorcio_grupo && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Grupo: {veiculo.consorcio_grupo}
                          {veiculo.consorcio_cota && ` | Cota: ${veiculo.consorcio_cota}`}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {responsavel ? (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground text-sm">
                            {responsavel.nome}
                          </div>
                          {responsavel.telefone && (
                            <div className="text-xs text-muted-foreground">
                              {responsavel.telefone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não definido</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <VehicleActions
                        veiculo={veiculo}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDocs={handleDocs}
                      />
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