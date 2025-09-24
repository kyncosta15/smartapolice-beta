import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { VehicleListMobile } from './VehicleListMobile';
import { VehicleDetailsModalNew } from './VehicleDetailsModalNew';
import { FrotasBulkActions } from './FrotasBulkActions';
import { useIsMobile } from '@/hooks/use-mobile';

interface FrotasTableProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
  onRefetch: () => void;
  /** Altura máxima da área da tabela. Ex: '60vh' ou 'calc(100vh - 220px)' */
  maxHeight?: string;
  /** Ocultar o header do card (quando usado dentro de outro card) */
  hideHeader?: boolean;
}

interface VehicleActionsProps {
  veiculo: FrotaVeiculo;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDocs: (id: string) => void;
}

function VehicleActions({ veiculo, onView, onEdit, onDocs }: VehicleActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView(veiculo.id)}
        className="h-8 px-3"
      >
        <Eye className="h-3 w-3" />
        <span className="sr-only">Ver detalhes</span>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-3 w-3" />
            <span className="sr-only">Mais ações</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => onEdit(veiculo.id)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDocs(veiculo.id)}>
            <FileText className="mr-2 h-4 w-4" /> Documentos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function FrotasTable({ veiculos, loading, onRefetch, maxHeight = '60vh', hideHeader = false }: FrotasTableProps) {
  const [selectedVeiculo, setSelectedVeiculo] = useState<FrotaVeiculo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  
  // Multiple selection state
  const [selectedVehicles, setSelectedVehicles] = useState<FrotaVeiculo[]>([]);
  
  // Clear selection when vehicles list changes (e.g., after filter)
  useEffect(() => {
    setSelectedVehicles([]);
  }, [veiculos]);

  // Add event listener for edit mode switching
  useEffect(() => {
    const handleEditEvent = (event: any) => {
      if (event.detail && veiculos.length > 0) {
        const currentVeiculo = veiculos.find(v => v.id === event.detail);
        if (currentVeiculo) {
          handleEdit(event.detail);
        }
      }
    };

    window.addEventListener('editVehicle', handleEditEvent);
    return () => window.removeEventListener('editVehicle', handleEditEvent);
  }, [veiculos]);

  const isMobile = useIsMobile();

  const handleView = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      setSelectedVeiculo(veiculo);
      setModalMode('view');
      setModalOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      setSelectedVeiculo(veiculo);
      setModalMode('edit');
      setModalOpen(true);
    }
  };

  const handleDocs = (id: string) => {
    const veiculo = veiculos.find(v => v.id === id);
    if (veiculo) {
      // TODO: Abrir documentos
      console.log('Ver documentos do veículo:', veiculo);
    }
  };

  // Multiple selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles([...veiculos]);
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (veiculo: FrotaVeiculo, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, veiculo]);
    } else {
      setSelectedVehicles(prev => prev.filter(v => v.id !== veiculo.id));
    }
  };

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(v => v.id === vehicleId);
  };

  const isAllSelected = selectedVehicles.length === veiculos.length && veiculos.length > 0;
  const isPartialSelected = selectedVehicles.length > 0 && selectedVehicles.length < veiculos.length;

  const clearSelection = () => {
    setSelectedVehicles([]);
  };

  const handleBulkUpdateComplete = () => {
    onRefetch();
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
    if (hideHeader) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-3 p-3 border rounded-lg">
              <div className="rounded-full bg-gray-200 h-10 w-10 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-3 p-3 border rounded-lg">
                <div className="rounded-full bg-gray-200 h-10 w-10 flex-shrink-0"></div>
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

  if (veiculos.length === 0 && !loading) {
    const emptyContent = (
      <div className="text-center py-8 sm:py-12">
        <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum veículo encontrado
        </h3>
        <p className="text-gray-500 mb-4 text-sm sm:text-base break-words">
          Não há veículos cadastrados ou que correspondam aos filtros aplicados.
        </p>
        <Button onClick={onRefetch} variant="outline" size="sm">
          Recarregar dados
        </Button>
      </div>
    );

    if (hideHeader) {
      return emptyContent;
    }
    
    return (
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5" />
            Lista de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          {emptyContent}
        </CardContent>
      </Card>
    );
  }

  const tableContent = (
    <div className="space-y-3 md:space-y-4">
        <FrotasBulkActions
          selectedVehicles={selectedVehicles}
          onClearSelection={clearSelection}
          onUpdateComplete={handleBulkUpdateComplete}
          allVehicles={veiculos}
          onSelectVehicles={setSelectedVehicles}
        />
      
      <div
        className="w-full overflow-x-auto max-h-[50vh] md:max-h-[60vh] overflow-y-auto overscroll-contain pr-1 -mr-1"
        tabIndex={0}
        aria-label="Lista de veículos rolável"
      >
        <div className="p-2 md:p-4">
          {isMobile ? (
            // Versão mobile: cards
            <VehicleListMobile
              veiculos={veiculos}
              onView={handleView}
              onEdit={handleEdit}
              onDocs={handleDocs}
              selectedVehicles={selectedVehicles}
              onSelectVehicle={handleSelectVehicle}
            />
          ) : (
            // Versão desktop: tabela
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1200px] w-full">
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-12 bg-background" scope="col">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos os veículos"
                        {...(isPartialSelected && { 'data-state': 'indeterminate' })}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px] bg-background" scope="col">Veículo</TableHead>
                    <TableHead className="min-w-[120px] bg-background" scope="col">Placa</TableHead>
                    <TableHead className="min-w-[150px] bg-background" scope="col">Proprietário</TableHead>
                    <TableHead className="min-w-[120px] bg-background" scope="col">Emplacamento</TableHead>
                    <TableHead className="min-w-[120px] bg-background" scope="col">Status Seguro</TableHead>
                    <TableHead className="min-w-[100px] bg-background" scope="col">FIPE</TableHead>
                    <TableHead className="min-w-[100px] bg-background" scope="col">Valor NF</TableHead>
                    <TableHead className="min-w-[120px] bg-background" scope="col">Modalidade</TableHead>
                    <TableHead className="min-w-[120px] bg-background" scope="col">Responsável</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] bg-background text-right sticky right-0 bg-background border-l shadow-sm" scope="col">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:hover]:bg-muted/50">
                  {veiculos.map((veiculo) => {
                    const emplacamentoStatus = getEmplacamentoStatus(veiculo.data_venc_emplacamento);
                    const responsavel = veiculo.responsaveis?.[0];
                    const isSelected = isVehicleSelected(veiculo.id);

                    return (
                      <TableRow key={veiculo.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectVehicle(veiculo, checked as boolean)}
                            aria-label={`Selecionar ${veiculo.placa}`}
                          />
                        </TableCell>
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

                        <TableCell className="w-[120px] min-w-[120px] text-right sticky right-0 bg-background border-l">
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
          )}
        </div>
      </div>
    </div>
  );

  if (hideHeader) {
    return (
      <>
        {tableContent}
        <VehicleDetailsModalNew 
          veiculo={selectedVeiculo}
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={modalMode}
          onSave={(updatedVeiculo) => {
            // Update the selected vehicle data to reflect changes immediately
            setSelectedVeiculo(updatedVeiculo);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4 border-b">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-4 w-4 md:h-5 md:w-5" />
            Lista de Veículos ({veiculos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tableContent}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <VehicleDetailsModalNew 
        veiculo={selectedVeiculo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        onSave={(updatedVeiculo) => {
          // Update the selected vehicle data to reflect changes immediately
          setSelectedVeiculo(updatedVeiculo);
        }}
      />
    </>
  );
}