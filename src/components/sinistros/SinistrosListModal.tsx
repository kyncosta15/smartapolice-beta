import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClaimsList } from '../claims/ClaimsList';
import { AssistancesView } from '../claims/AssistancesView';
import { FilterChips } from './FilterChips';
import { useFilterState } from '@/hooks/useFilterState';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { Search, X } from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';

interface SinistrosListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialFilter?: {
    tipo?: 'sinistro' | 'assistencia';
    status?: string;
    periodo?: 'last60d';
  };
}

export function SinistrosListModal({ 
  open, 
  onOpenChange, 
  title, 
  initialFilter 
}: SinistrosListModalProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    filters,
    activeFilterChips,
    updateFilter,
    removeFilter,
    clearAllFilters
  } = useFilterState();
  
  const { toast } = useToast();

  // Apply initial filter when modal opens
  useEffect(() => {
    if (open && initialFilter) {
      Object.entries(initialFilter).forEach(([key, value]) => {
        if (value) {
          updateFilter(key as any, value);
        }
      });
    }
  }, [open, initialFilter, updateFilter]);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsData, assistancesData] = await Promise.all([
        ClaimsService.getClaims({}),
        ClaimsService.getAssistances({})
      ]);
      setClaims(claimsData.data);
      setAssistances(assistancesData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    clearAllFilters();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Filters inside modal */}
        <div className="space-y-4 flex-shrink-0 border-b pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Em Aberto</SelectItem>
                  <SelectItem value="closed">Finalizados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.seguradora || 'all'} onValueChange={(value) => updateFilter('seguradora', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as seguradoras</SelectItem>
                  <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                  <SelectItem value="Bradesco Seguros">Bradesco Seguros</SelectItem>
                  <SelectItem value="Suhai Seguradora">Suhai Seguradora</SelectItem>
                  <SelectItem value="Allianz">Allianz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, chassi, proprietário ou modelo"
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips
            activeFilters={activeFilterChips}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* Claims or Assistances list */}
        <div className="flex-1 overflow-auto">
          {filters.tipo === 'assistencia' ? (
            <AssistancesView
              searchTerm={filters.search || ''}
              statusFilter={filters.status || 'all'}
              onStatusFilterChange={(status) => updateFilter('status', status)}
            />
          ) : (
            <ClaimsList
              claims={claims}
              loading={loading}
              statusFilter={filters.status || 'all'}
              onClaimSelect={(claim) => {
                console.log('Claim selecionado:', claim);
                // TODO: Abrir drawer de detalhes
              }}
              onClaimEdit={(claim) => {
                console.log('Editar claim:', claim);
                // TODO: Abrir modal de edição
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}