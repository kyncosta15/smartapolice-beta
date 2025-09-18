import { useState, useMemo } from 'react';

export type FilterType = 'status' | 'tipo' | 'periodo' | 'seguradora' | 'search';

export type FilterState = {
  status?: string;
  tipo?: 'sinistro' | 'assistencia';
  periodo?: 'last60d';
  seguradora?: string;
  search?: string;
};

export type FilterChip = {
  key: FilterType;
  label: string;
  value: string;
};

export function useFilterState() {
  const [filters, setFilters] = useState<FilterState>({});

  const activeFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    
    if (filters.tipo) {
      chips.push({
        key: 'tipo',
        label: 'Tipo',
        value: filters.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'
      });
    }
    
    if (filters.status) {
      const statusLabels = {
        'open': 'Em Aberto',
        'closed': 'Finalizados',
        'novo': 'Novo',
        'em_analise': 'Em Análise',
        'em_regulacao': 'Em Regulação',
        'finalizado': 'Finalizado',
        'encerrado': 'Encerrado',
        'pago': 'Pago'
      };
      chips.push({
        key: 'status',
        label: 'Status',
        value: statusLabels[filters.status as keyof typeof statusLabels] || filters.status
      });
    }
    
    if (filters.periodo) {
      chips.push({
        key: 'periodo',
        label: 'Período',
        value: 'Últimos 60 dias'
      });
    }
    
    if (filters.seguradora && filters.seguradora !== 'all') {
      chips.push({
        key: 'seguradora',
        label: 'Seguradora',
        value: filters.seguradora
      });
    }
    
    if (filters.search) {
      chips.push({
        key: 'search',
        label: 'Busca',
        value: filters.search
      });
    }
    
    return chips;
  }, [filters]);

  const updateFilter = (key: FilterType, value?: string) => {
    setFilters(prev => {
      if (!value || value === 'all') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const removeFilter = (key: FilterType) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const applyCardFilter = (cardType: 'total' | 'sinistros' | 'assistencias', filterType?: 'aberto' | 'finalizado' | 'ultimos60d') => {
    const newFilters: FilterState = {};
    
    // Definir tipo baseado no card
    if (cardType === 'sinistros') {
      newFilters.tipo = 'sinistro';
    } else if (cardType === 'assistencias') {
      newFilters.tipo = 'assistencia';
    }
    
    // Definir filtro específico
    if (filterType === 'aberto') {
      newFilters.status = 'open';
    } else if (filterType === 'finalizado') {
      newFilters.status = 'closed';
    } else if (filterType === 'ultimos60d') {
      newFilters.periodo = 'last60d';
    }
    
    // Manter filtros de seguradora e busca se existirem
    if (filters.seguradora) newFilters.seguradora = filters.seguradora;
    if (filters.search) newFilters.search = filters.search;
    
    setFilters(newFilters);
  };

  return {
    filters,
    activeFilterChips,
    updateFilter,
    removeFilter,
    clearAllFilters,
    applyCardFilter
  };
}