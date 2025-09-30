import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  Car,
  Shield,
  Calendar,
  Check,
  AlertTriangle,
  Wrench,
  ArrowUpAZ
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FrotaFilters } from '../GestaoFrotas';
import { supabase } from '@/integrations/supabase/client';
import { useFrotaStatusFix } from '@/hooks/useFrotaStatusFix';

interface FrotasFiltersProps {
  filters: FrotaFilters;
  onFilterChange: (filters: Partial<FrotaFilters>) => void;
  loading: boolean;
  searchLoading?: boolean;
}

const categoriaOptions = [
  { value: 'passeio', label: 'Passeio' },
  { value: 'utilitario', label: 'Utilitário' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'moto', label: 'Moto' },
];

const statusOptions = [
  { value: 'segurado', label: 'Segurado' },
  { value: 'sem_seguro', label: 'Sem Seguro' },
];

export function FrotasFilters({ filters, onFilterChange, loading, searchLoading = false }: FrotasFiltersProps) {
  const [marcaOptions, setMarcaOptions] = useState<{ value: string; label: string }[]>([]);
  const hasActiveFilters = filters.categoria.length > 0 || filters.status.length > 0 || filters.search.length > 0 || filters.marcaModelo.length > 0;
  const totalActiveFilters = filters.categoria.length + filters.status.length + filters.marcaModelo.length;

  // Hook para correção automática de status
  const { 
    hasOutros, 
    outrosCount, 
    outrosPlacas, 
    isFixing, 
    executeAutoFix 
  } = useFrotaStatusFix();

  useEffect(() => {
    // Buscar marcas disponíveis no banco de dados
    const fetchMarcas = async () => {
      try {
        const { data: veiculos } = await supabase
          .from('frota_veiculos')
          .select('marca')
          .not('marca', 'is', null);
        
        if (veiculos) {
          const marcasUnicas = [...new Set(veiculos.map(v => v.marca))].filter(Boolean);
          setMarcaOptions(marcasUnicas.map(marca => ({ value: marca!, label: marca! })));
        }
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
      }
    };
    
    fetchMarcas();
  }, []);

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      categoria: [],
      status: [],
      marcaModelo: [],
      ordenacao: 'padrao',
    });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value });
  };

  const handleCategoriaChange = (categoria: string, checked: boolean) => {
    const newCategorias = checked
      ? [...filters.categoria, categoria]
      : filters.categoria.filter(c => c !== categoria);
    
    onFilterChange({ categoria: newCategorias });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
    
    onFilterChange({ status: newStatus });
  };

  const handleMarcaChange = (marca: string, checked: boolean) => {
    const newMarcas = checked
      ? [...filters.marcaModelo, marca]
      : filters.marcaModelo.filter(m => m !== marca);
    
    onFilterChange({ marcaModelo: newMarcas });
  };

  const removeCategoriaFilter = (categoria: string) => {
    onFilterChange({ 
      categoria: filters.categoria.filter(c => c !== categoria) 
    });
  };

  const removeStatusFilter = (status: string) => {
    onFilterChange({ 
      status: filters.status.filter(s => s !== status) 
    });
  };

  const removeMarcaFilter = (marca: string) => {
    onFilterChange({ 
      marcaModelo: filters.marcaModelo.filter(m => m !== marca) 
    });
  };

  const handleAutoFix = async () => {
    await executeAutoFix();
  };

  return (
    <div className="space-y-3">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${searchLoading ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
          <Input
            placeholder="Buscar por placa, CNPJ, CPF ou proprietário..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`pl-10 pr-10 h-9 sm:h-10 w-full ${searchLoading ? 'border-primary' : ''}`}
            disabled={loading}
          />
          {/* Search loading indicator */}
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* Clear search button */}
          {filters.search && !searchLoading && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpar busca"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="w-40">
          <Select
            value={filters.ordenacao || 'padrao'}
            onValueChange={(value) => onFilterChange({ ordenacao: value })}
            disabled={loading}
          >
            <SelectTrigger className="h-8 sm:h-9">
              <ArrowUpAZ className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="padrao">Padrão</SelectItem>
              <SelectItem value="a-z">A-Z</SelectItem>
              <SelectItem value="z-a">Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unified Filter Button */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 sm:h-9 px-3 flex items-center gap-2 relative"
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {totalActiveFilters > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {totalActiveFilters}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              {/* Categoria Section */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Categoria do Veículo
              </DropdownMenuLabel>
              {categoriaOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.categoria.includes(option.value)}
                  onCheckedChange={(checked) => handleCategoriaChange(option.value, checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Status Section */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status do Seguro
              </DropdownMenuLabel>
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.status.includes(option.value)}
                  onCheckedChange={(checked) => handleStatusChange(option.value, checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              {marcaOptions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  
                  {/* Marca Section */}
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Marcas
                  </DropdownMenuLabel>
                  <div className="max-h-32 overflow-y-auto">
                    {marcaOptions.slice(0, 10).map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={filters.marcaModelo.includes(option.value)}
                        onCheckedChange={(checked) => handleMarcaChange(option.value, checked)}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </>
              )}
              
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearFilters}
                      className="w-full justify-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar todos os filtros
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.categoria.map((categoria) => {
            const option = categoriaOptions.find(opt => opt.value === categoria);
            return (
              <Badge 
                key={categoria} 
                variant="secondary" 
                className="flex items-center gap-1 px-2 py-1"
              >
                <Car className="h-3 w-3" />
                {option?.label || categoria}
                <button
                  onClick={() => removeCategoriaFilter(categoria)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  aria-label={`Remover filtro ${option?.label || categoria}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          {filters.status.map((status) => {
            const option = statusOptions.find(opt => opt.value === status);
            return (
              <Badge 
                key={status} 
                variant="secondary" 
                className="flex items-center gap-1 px-2 py-1"
              >
                <Shield className="h-3 w-3" />
                {option?.label || status}
                <button
                  onClick={() => removeStatusFilter(status)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  aria-label={`Remover filtro ${option?.label || status}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          {filters.marcaModelo.map((marca) => {
            return (
              <Badge 
                key={marca} 
                variant="secondary" 
                className="flex items-center gap-1 px-2 py-1"
              >
                <Car className="h-3 w-3" />
                {marca}
                <button
                  onClick={() => removeMarcaFilter(marca)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  aria-label={`Remover filtro ${marca}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}