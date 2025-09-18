import { useMemo } from 'react';

interface BaseItem {
  id: string;
  tipo: 'sinistro' | 'assistencia';
  status: 'open' | 'closed' | string;
  created_at: string;
  seguradora?: string;
  // Campos para busca
  placa?: string;
  chassi?: string;
  proprietario_nome?: string;
  modelo?: string;
}

interface Filters {
  status?: string;
  seguradora?: string;
  search?: string;
}

interface KpisResult {
  geral: {
    total: number;
    emAberto: number;
    finalizados: number;
    ult60d: number;
  };
  sinistros: {
    total: number;
    emAberto: number;
    finalizados: number;
    ult60d: number;
  };
  assistencias: {
    total: number;
    emAberto: number;
    finalizados: number;
    ult60d: number;
  };
}

const OPEN_STATUSES = ['open', 'aberto', 'em_analise', 'em_regulacao', 'ABERTO', 'EM_ANALISE', 'EM_REGULACAO'];
const CLOSED_STATUSES = ['closed', 'encerrado', 'finalizado', 'pago', 'ENCERRADO', 'FINALIZADO', 'PAGO'];

function isOpen(status: string): boolean {
  return OPEN_STATUSES.includes(status);
}

function isClosed(status: string): boolean {
  return CLOSED_STATUSES.includes(status);
}

function isLast60Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 60);
  return date >= cutoff;
}

function matchesSearch(item: BaseItem, search: string): boolean {
  if (!search) return true;
  
  const searchLower = search.toLowerCase();
  const searchableFields = [
    item.placa,
    item.chassi,
    item.proprietario_nome,
    item.modelo
  ];
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(searchLower)
  );
}

function applyFilters(items: BaseItem[], filters: Filters): BaseItem[] {
  return items.filter(item => {
    // Filtro de status
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'open' && !isOpen(item.status)) return false;
      if (filters.status === 'closed' && !isClosed(item.status)) return false;
      if (filters.status !== 'open' && filters.status !== 'closed' && item.status !== filters.status) return false;
    }
    
    // Filtro de seguradora
    if (filters.seguradora && filters.seguradora !== 'all' && item.seguradora !== filters.seguradora) {
      return false;
    }
    
    // Filtro de busca
    if (!matchesSearch(item, filters.search || '')) {
      return false;
    }
    
    return true;
  });
}

function calculateKpis(items: BaseItem[]) {
  const total = items.length;
  const emAberto = items.filter(item => isOpen(item.status)).length;
  const finalizados = items.filter(item => isClosed(item.status)).length;
  const ult60d = items.filter(item => isLast60Days(item.created_at)).length;
  
  return { total, emAberto, finalizados, ult60d };
}

export function useSinistrosKpis(
  allItems: BaseItem[], 
  filters: Filters = {}
): KpisResult {
  return useMemo(() => {
    // Aplicar filtros a todos os itens
    const filteredItems = applyFilters(allItems, filters);
    
    // Separar por tipo
    const sinistros = filteredItems.filter(item => item.tipo === 'sinistro');
    const assistencias = filteredItems.filter(item => item.tipo === 'assistencia');
    
    // Calcular KPIs para cada grupo
    return {
      geral: calculateKpis(filteredItems),
      sinistros: calculateKpis(sinistros),
      assistencias: calculateKpis(assistencias)
    };
  }, [allItems, filters.status, filters.seguradora, filters.search]);
}