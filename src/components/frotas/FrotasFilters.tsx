import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  Car,
  Shield,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FrotaFilters } from '../GestaoFrotas';

interface FrotasFiltersProps {
  filters: FrotaFilters;
  onFilterChange: (filters: Partial<FrotaFilters>) => void;
  loading: boolean;
}

const categoriaOptions = [
  { value: 'passeio', label: 'Passeio' },
  { value: 'utilitario', label: 'Utilitário' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'moto', label: 'Moto' },
  { value: 'outros', label: 'Outros' },
];

const statusOptions = [
  { value: 'segurado', label: 'Segurado' },
  { value: 'sem_seguro', label: 'Sem Seguro' },
  { value: 'cotacao', label: 'Em Cotação' },
];

export function FrotasFilters({ filters, onFilterChange, loading }: FrotasFiltersProps) {
  const hasActiveFilters = filters.categoria.length > 0 || filters.status.length > 0 || filters.search.length > 0;

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      categoria: [],
      status: [],
      marcaModelo: [],
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

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por placa, CNPJ, CPF ou proprietário..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-10"
            disabled={loading}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* Categoria Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-3 flex items-center gap-2"
                disabled={loading}
              >
                <Car className="h-4 w-4" />
                Categoria
                {filters.categoria.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {filters.categoria.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Categoria do Veículo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categoriaOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.categoria.includes(option.value)}
                  onCheckedChange={(checked) => handleCategoriaChange(option.value, checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-3 flex items-center gap-2"
                disabled={loading}
              >
                <Shield className="h-4 w-4" />
                Status
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {filters.status.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status do Seguro</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.status.includes(option.value)}
                  onCheckedChange={(checked) => handleStatusChange(option.value, checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-10 px-3 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
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