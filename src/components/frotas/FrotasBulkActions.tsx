import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X, 
  CheckSquare,
  Trash2, 
  AlertTriangle,
  Shield,
  Filter,
  Car,
  Search,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInsuranceApprovals } from '@/hooks/useInsuranceApprovals';

interface FrotasBulkActionsProps {
  selectedVehicles: FrotaVeiculo[];
  onClearSelection: () => void;
  onUpdateComplete: () => void;
  allVehicles: FrotaVeiculo[];
  onSelectVehicles: (vehicles: FrotaVeiculo[]) => void;
}

export function FrotasBulkActions({ 
  selectedVehicles, 
  onClearSelection, 
  onUpdateComplete,
  allVehicles,
  onSelectVehicles
}: FrotasBulkActionsProps) {
  const { profile } = useUserProfile();
  const { createRequest } = useInsuranceApprovals();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isAdmin = profile?.is_admin === true;
  
  // Filtros para seleção múltipla (removido filtro por categoria)
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  // Estados para alteração em lote
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  
  // Categorias disponíveis para aplicar (padronizadas)
  const availableCategories = [
    { value: 'Carros', label: 'Carros' },
    { value: 'Caminhão', label: 'Caminhão' },
    { value: 'Moto', label: 'Moto' },
  ];
  
  // Extrair marcas e modelos únicos dos veículos
  const availableBrands = useMemo(() => {
    if (!allVehicles || !Array.isArray(allVehicles)) return [];
    const brands = [...new Set(allVehicles.map(v => v.marca).filter(Boolean))].sort();
    return brands;
  }, [allVehicles]);
  
  const availableModels = useMemo(() => {
    if (!allVehicles || !Array.isArray(allVehicles)) return [];
    const models = [...new Set(allVehicles.map(v => v.modelo).filter(Boolean))].sort();
    return models;
  }, [allVehicles]);
  
  // Filtrar veículos baseado nos filtros de seleção
  const filteredVehicles = useMemo(() => {
    if (!allVehicles || !Array.isArray(allVehicles)) return [];
    return allVehicles.filter(vehicle => {
      // Filtro de busca
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const matchesSearch = 
          vehicle.placa?.toLowerCase().includes(searchLower) ||
          vehicle.marca?.toLowerCase().includes(searchLower) ||
          vehicle.modelo?.toLowerCase().includes(searchLower) ||
          vehicle.proprietario_nome?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Filtro por marca
      if (selectedBrands.length > 0) {
        if (!vehicle.marca || !selectedBrands.includes(vehicle.marca)) return false;
      }
      
      // Filtro por modelo
      if (selectedModels.length > 0) {
        if (!vehicle.modelo || !selectedModels.includes(vehicle.modelo)) return false;
      }
      
      return true;
    });
  }, [allVehicles, searchFilter, selectedBrands, selectedModels]);
  
  // Aplicar filtros para seleção
  const handleSelectFiltered = () => {
    onSelectVehicles(filteredVehicles);
  };
  
  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSearchFilter('');
    setSelectedBrands([]);
    setSelectedModels([]);
  };
  
  const hasFilters = searchFilter || selectedBrands.length > 0 || selectedModels.length > 0;

  if (selectedVehicles.length === 0) {
    return null;
  }

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) {
      toast.error('Selecione um status para aplicar aos veículos selecionados');
      return;
    }

    // Se não é admin e está tentando marcar como "segurado", criar solicitação de aprovação
    if (!isAdmin && bulkStatus === 'segurado') {
      setLoading(true);
      try {
        let successCount = 0;
        
        for (const vehicle of selectedVehicles) {
          const success = await createRequest({
            veiculo_id: vehicle.id,
            empresa_id: vehicle.empresa_id,
            current_status: vehicle.status_seguro,
            requested_status: 'segurado',
            motivo: 'Solicitação de alteração em lote para status Segurado',
            silent: true,
          });
          
          if (success) successCount++;
        }
        
        if (successCount > 0) {
          toast.success(
            `${successCount} solicitaç${successCount === 1 ? 'ão enviada' : 'ões enviadas'} para aprovação do administrador`,
            { duration: 5000 }
          );
        }
        
        onClearSelection();
        setBulkStatus('');
      } catch (error) {
        console.error('Erro ao criar solicitações:', error);
        toast.error('Erro ao criar solicitações de aprovação');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Admin pode alterar diretamente
    setLoading(true);
    try {
      const vehicleIds = selectedVehicles.map(v => v.id);
      
      const { error } = await supabase
        .from('frota_veiculos')
        .update({ 
          status_seguro: bulkStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', vehicleIds);

      if (error) throw error;

      toast.success(`Status atualizado para ${selectedVehicles.length} veículo(s)`);
      
      // Clear selection and refresh data
      onClearSelection();
      onUpdateComplete();
      setBulkStatus('');
      
      // Dispatch events to refresh dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      toast.error('Erro ao atualizar o status dos veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategory) {
      toast.error('Selecione uma categoria para aplicar aos veículos selecionados');
      return;
    }

    setLoading(true);
    try {
      const vehicleIds = selectedVehicles.map(v => v.id);
      
      const { error } = await supabase
        .from('frota_veiculos')
        .update({ 
          categoria: bulkCategory,
          updated_at: new Date().toISOString()
        })
        .in('id', vehicleIds);

      if (error) throw error;

      toast.success(`Categoria atualizada para ${selectedVehicles.length} veículo(s)`);
      
      // Clear selection and refresh data
      onClearSelection();
      onUpdateComplete();
      setBulkCategory('');
      
      // Dispatch events to refresh dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error) {
      console.error('Erro ao atualizar categoria em lote:', error);
      toast.error('Erro ao atualizar a categoria dos veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) {
      toast.error('Selecione veículos para excluir');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedVehicles.length} veículo(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      const vehicleIds = selectedVehicles.map(v => v.id);
      
      // Primeiro deletar documentos relacionados
      const { error: docsError } = await supabase
        .from('frota_documentos')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (docsError) throw docsError;

      // Deletar responsáveis relacionados
      const { error: responsaveisError } = await supabase
        .from('frota_responsaveis')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (responsaveisError) throw responsaveisError;

      // Deletar pagamentos relacionados
      const { error: pagamentosError } = await supabase
        .from('frota_pagamentos')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (pagamentosError) throw pagamentosError;

      // Por fim, deletar os veículos
      const { error } = await supabase
        .from('frota_veiculos')
        .delete()
        .in('id', vehicleIds);

      if (error) throw error;

      toast.success(`${selectedVehicles.length} veículo(s) excluído(s) com sucesso`);
      
      // Clear selection and refresh data
      onClearSelection();
      onUpdateComplete();
      
      // Dispatch events to refresh dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error) {
      console.error('Erro ao excluir veículos:', error);
      toast.error('Erro ao excluir os veículos');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'sem_seguro': 'Sem Seguro',
      'segurado': 'Segurado',
      'vencido': 'Vencido',
      'vigente': 'Vigente',
      'vence_30_dias': 'Vence em 30 dias',
      'vence_60_dias': 'Vence em 60 dias',
      'cotacao': 'Em Cotação'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'vigente': 'bg-green-100 text-green-800',
      'segurado': 'bg-green-100 text-green-800',
      'vencido': 'bg-red-100 text-red-800',
      'vence_30_dias': 'bg-yellow-100 text-yellow-800',
      'vence_60_dias': 'bg-blue-100 text-blue-800',
      'sem_seguro': 'bg-gray-100 text-gray-800',
      'cotacao': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-3 md:p-4">
        {/* Mobile-first layout */}
        <div className="space-y-3">
          {/* Selection Info and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-900">
                {selectedVehicles.length} selecionado(s)
              </span>
            </div>
            
            {/* Multi-select Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Buscar para selecionar..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-7 h-8 w-48 text-xs"
                />
              </div>
              
              {/* Brand Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    <Car className="h-3 w-3 mr-1" />
                    Marcas {selectedBrands.length > 0 && `(${selectedBrands.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 max-h-48 overflow-y-auto">
                  <DropdownMenuLabel>Selecionar Marcas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableBrands.map((brand) => (
                    <DropdownMenuCheckboxItem
                      key={brand}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBrands([...selectedBrands, brand]);
                        } else {
                          setSelectedBrands(selectedBrands.filter(b => b !== brand));
                        }
                      }}
                    >
                      {brand}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Model Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                    <Car className="h-3 w-3 mr-1" />
                    Modelos {selectedModels.length > 0 && `(${selectedModels.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 max-h-48 overflow-y-auto">
                  <DropdownMenuLabel>Selecionar Modelos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableModels.slice(0, 20).map((model) => (
                    <DropdownMenuCheckboxItem
                      key={model}
                      checked={selectedModels.includes(model)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModels([...selectedModels, model]);
                        } else {
                          setSelectedModels(selectedModels.filter(m => m !== model));
                        }
                      }}
                    >
                      {model.length > 25 ? `${model.substring(0, 25)}...` : model}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Apply Filters Button */}
              {hasFilters && (
                <Button
                  onClick={handleSelectFiltered}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Selecionar {filteredVehicles.length}
                </Button>
              )}
              
              {/* Clear Filters */}
              {hasFilters && (
                <Button
                  onClick={handleClearFilters}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Cancel button */}
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 h-8 px-3"
            >
              <X className="h-3 w-3 md:mr-1" />
              <span className="hidden md:inline">Cancelar</span>
            </Button>
          </div>
          
          {/* Active Filter Tags */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1">
              {searchFilter && (
                <Badge variant="outline" className="text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  "{searchFilter}"
                  <button
                    onClick={() => setSearchFilter('')}
                    className="ml-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
              {selectedBrands.map((brand) => (
                <Badge key={brand} variant="outline" className="text-xs">
                  <Car className="h-3 w-3 mr-1" />
                  {brand}
                  <button
                    onClick={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))}
                    className="ml-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
              {selectedModels.map((model) => (
                <Badge key={model} variant="outline" className="text-xs">
                  <Car className="h-3 w-3 mr-1" />
                  {model.length > 15 ? `${model.substring(0, 15)}...` : model}
                  <button
                    onClick={() => setSelectedModels(selectedModels.filter(m => m !== model))}
                    className="ml-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Current Status Summary - scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 pb-1 min-w-max">
              {Object.entries(
                selectedVehicles.reduce((acc, vehicle) => {
                  const status = vehicle.status_seguro || 'sem_seguro';
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count]) => (
                <Badge 
                  key={status} 
                  variant="outline" 
                  className={`text-xs whitespace-nowrap ${getStatusBadgeColor(status)}`}
                >
                  {getStatusLabel(status)}: {count}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions - stacked on mobile */}
          <div className="flex flex-col gap-3">
            {/* Status Update */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <Shield className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="flex-1 min-w-0 h-9 text-sm">
                    <SelectValue placeholder="Alterar status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_seguro">Sem Seguro</SelectItem>
                    <SelectItem value="segurado">Segurado</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="vence_30_dias">Vence em 30 dias</SelectItem>
                    <SelectItem value="vence_60_dias">Vence em 60 dias</SelectItem>
                    <SelectItem value="cotacao">Em Cotação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || loading || deleting}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-9"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-2" />
                    Aplicar Status
                  </>
                )}
              </Button>
            </div>

            {/* Category Update */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <Car className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="flex-1 min-w-0 h-9 text-sm">
                    <SelectValue placeholder="Alterar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleBulkCategoryUpdate}
                disabled={!bulkCategory || loading || deleting}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Car className="h-3 w-3 mr-2" />
                    Aplicar Categoria
                  </>
                )}
              </Button>
            </div>

            {/* Delete Action */}
            <div className="flex justify-end">
              <Button
                onClick={handleBulkDelete}
                disabled={loading || deleting}
                size="sm"
                variant="destructive"
                className="h-9"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Excluir Selecionados
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Confirmation messages */}
          <div className="space-y-2">
            {bulkStatus && (
              <div className="p-3 bg-white rounded border border-blue-200">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    Será aplicado o status "<strong>{getStatusLabel(bulkStatus)}</strong>" 
                    para <strong>{selectedVehicles.length}</strong> veículo(s) selecionado(s).
                  </span>
                </div>
              </div>
            )}
            
            {bulkCategory && (
              <div className="p-3 bg-white rounded border border-blue-200">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    Será aplicada a categoria "<strong>{availableCategories.find(c => c.value === bulkCategory)?.label || bulkCategory}</strong>" 
                    para <strong>{selectedVehicles.length}</strong> veículo(s) selecionado(s).
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}