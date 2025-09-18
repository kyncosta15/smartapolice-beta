import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type FilterChip = {
  key: string;
  label: string;
  value: string;
};

type FilterChipsProps = {
  activeFilters: FilterChip[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
};

export function FilterChips({ activeFilters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Filtros ativos:
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <span>{filter.label}: {filter.value}</span>
            <button
              onClick={() => onRemoveFilter(filter.key)}
              className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-0.5 transition-colors"
              aria-label={`Remover filtro ${filter.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Button
        onClick={onClearAll}
        variant="ghost"
        size="sm"
        className="ml-auto text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Limpar tudo
      </Button>
    </div>
  );
}