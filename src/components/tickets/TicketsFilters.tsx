import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Search, Filter } from 'lucide-react';
import { TicketFilters, TicketTipo, TicketStatus, TicketSubtipo } from '@/types/tickets';

interface TicketsFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
}

const SINISTRO_SUBTIPOS: TicketSubtipo[] = [
  'colisao', 'roubo', 'furto', 'avaria', 'incendio', 'danos_terceiros'
];

const ASSISTENCIA_SUBTIPOS: TicketSubtipo[] = [
  'guincho', 'vidro', 'mecanica', 'chaveiro', 'pneu', 'combustivel', 'residencia'
];

export function TicketsFilters({ filters, onFiltersChange }: TicketsFiltersProps) {
  const updateFilter = (key: keyof TicketFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: keyof TicketFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof TicketFilters]).length;
  };

  const getSubtipoOptions = () => {
    if (filters.tipo === 'sinistro') {
      return SINISTRO_SUBTIPOS;
    } else if (filters.tipo === 'assistencia') {
      return ASSISTENCIA_SUBTIPOS;
    }
    return [...SINISTRO_SUBTIPOS, ...ASSISTENCIA_SUBTIPOS];
  };

  const getFilterLabel = (key: string, value: any) => {
    switch (key) {
      case 'tipo':
        return value === 'sinistro' ? 'Sinistros' : 'Assistências';
      case 'status':
        return value.replace('_', ' ').toUpperCase();
      case 'subtipo':
        return value.replace('_', ' ').toUpperCase();
      case 'periodo':
        switch (value) {
          case 'ultimos_30':
            return 'Últimos 30 dias';
          case 'ultimos_60':
            return 'Últimos 60 dias';
          case 'ultimos_90':
            return 'Últimos 90 dias';
          default:
            return 'Período';
        }
      case 'comSeguro':
        return 'Com Seguro';
      case 'semSeguro':
        return 'Sem Seguro';
      default:
        return value;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Filtro */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Busca */}
        <div className="relative min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por placa, descrição..."
            value={filters.busca || ''}
            onChange={(e) => updateFilter('busca', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tipo */}
        <Select 
          value={filters.tipo || ''} 
          onValueChange={(value) => updateFilter('tipo', value || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os tipos</SelectItem>
            <SelectItem value="sinistro">Sinistros</SelectItem>
            <SelectItem value="assistencia">Assistências</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select 
          value={filters.status || ''} 
          onValueChange={(value) => updateFilter('status', value || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {/* Subtipo */}
        <Select 
          value={filters.subtipo || ''} 
          onValueChange={(value) => updateFilter('subtipo', value || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subtipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os subtipos</SelectItem>
            {getSubtipoOptions().map((subtipo) => (
              <SelectItem key={subtipo} value={subtipo}>
                {subtipo.replace('_', ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período */}
        <Select 
          value={filters.periodo || ''} 
          onValueChange={(value) => updateFilter('periodo', value || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os períodos</SelectItem>
            <SelectItem value="ultimos_30">Últimos 30 dias</SelectItem>
            <SelectItem value="ultimos_60">Últimos 60 dias</SelectItem>
            <SelectItem value="ultimos_90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        {/* Status do Seguro */}
        <div className="flex gap-2">
          <Button
            variant={filters.comSeguro ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('comSeguro', !filters.comSeguro)}
          >
            Com Seguro
          </Button>
          <Button
            variant={filters.semSeguro ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('semSeguro', !filters.semSeguro)}
          >
            Sem Seguro
          </Button>
        </div>

        {/* Limpar Filtros */}
        {getActiveFiltersCount() > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-3 w-3" />
            Limpar ({getActiveFiltersCount()})
          </Button>
        )}
      </div>

      {/* Chips de Filtros Ativos */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            return (
              <Badge key={key} variant="secondary" className="gap-1 px-2 py-1">
                <Filter className="h-3 w-3" />
                {getFilterLabel(key, value)}
                <button
                  onClick={() => removeFilter(key as keyof TicketFilters)}
                  className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-0.5"
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