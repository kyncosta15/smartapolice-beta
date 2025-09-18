import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { NovoTicketModal } from './NovoTicketModal';
import { FilterChips } from './FilterChips';
import { ClaimsList } from '../claims/ClaimsList';
import { useSinistrosKpis } from '@/hooks/useSinistrosKpis';
import { useFilterState } from '@/hooks/useFilterState';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Plus,
  Wrench,
  Activity
} from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';

// Types
interface BaseItem {
  id: string;
  tipo: 'sinistro' | 'assistencia';
  status: string;
  created_at: string;
  seguradora?: string;
  placa?: string;
  chassi?: string;
  proprietario_nome?: string;
  modelo?: string;
}

interface SinistrosDashboardProps {
  onNavigateToList?: (scope: 'all' | 'claims' | 'assists', filter?: string, value?: string) => void;
  onNewTicket?: () => void;
}

export function SinistrosDashboard({ 
  onNavigateToList,
  onNewTicket 
}: SinistrosDashboardProps) {
  console.log('🚗 SinistrosDashboard renderizando...');
  
  // State for data
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const {
    filters,
    activeFilterChips,
    updateFilter,
    removeFilter,
    clearAllFilters
  } = useFilterState();
  
  const { toast } = useToast();

  // Create combined items for KPI calculation
  const allItems: BaseItem[] = [
    ...claims.map(claim => ({
      id: claim.id,
      tipo: 'sinistro' as const,
      status: claim.status,
      created_at: claim.created_at,
      seguradora: claim.apolice?.seguradora,
      placa: claim.veiculo?.placa,
      chassi: claim.veiculo?.chassi,
      proprietario_nome: claim.veiculo?.proprietario_nome,
      modelo: claim.veiculo?.modelo
    })),
    ...assistances.map(assistance => ({
      id: assistance.id,
      tipo: 'assistencia' as const,
      status: assistance.status,
      created_at: assistance.created_at,
      seguradora: undefined,
      placa: assistance.veiculo?.placa,
      chassi: assistance.veiculo?.chassi,
      proprietario_nome: assistance.veiculo?.proprietario_nome,
      modelo: assistance.veiculo?.modelo
    }))
  ];

  // Calculate KPIs using the custom hook with current filters
  const kpis = useSinistrosKpis(allItems, filters);

  console.log('📊 KPIs calculados:', kpis);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

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

  // Handle card clicks to apply filters
  const handleCardClick = (tipo?: 'sinistro' | 'assistencia', status?: 'aberto' | 'finalizado', periodo?: 'last60d') => {
    // Clear previous filters and apply new ones
    clearAllFilters();
    
    if (tipo) {
      updateFilter('tipo', tipo);
    }
    
    if (status === 'aberto') {
      updateFilter('status', 'open');
    } else if (status === 'finalizado') {
      updateFilter('status', 'closed');  
    }
    
    if (periodo === 'last60d') {
      updateFilter('periodo', 'last60d');
    }
  };

  const handleTicketCreated = () => {
    loadData();
  };

  // Filter claims and assistances based on current filters
  const filteredClaims = claims.filter(claim => {
    // Se há filtro de tipo e não é 'sinistro', excluir claims
    if (filters.tipo && filters.tipo !== 'sinistro') return false;
    
    if (filters.status) {
      if (filters.status === 'open' && !['open', 'aberto', 'em_analise', 'em_regulacao'].includes(claim.status)) return false;
      if (filters.status === 'closed' && !['closed', 'encerrado', 'finalizado', 'pago'].includes(claim.status)) return false;
    }
    return true;
  });

  const filteredAssistances = assistances.filter(assistance => {
    // Se há filtro de tipo e não é 'assistencia', excluir assistências
    if (filters.tipo && filters.tipo !== 'assistencia') return false;
    
    if (filters.status) {
      if (filters.status === 'open' && !['open', 'aberto', 'em_analise', 'em_regulacao'].includes(assistance.status)) return false;
      if (filters.status === 'closed' && !['closed', 'encerrado', 'finalizado', 'pago'].includes(assistance.status)) return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto max-w-7xl px-6 space-y-8">
      {/* Header with CTA only */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard de Sinistros</h2>
          <p className="text-muted-foreground">
            Clique nos cards para filtrar informações
          </p>
        </div>
        
        <NovoTicketModal
          trigger={
            <Button className="shrink-0" title="Abrir novo ticket">
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          }
          onTicketCreated={handleTicketCreated}
        />
      </div>

      {/* Dashboard Grid - Layout conforme especificação: 2x3 + card grande */}
      <div className="space-y-6">
        {/* Grid 2x3 - Coluna A (Assistências) | Coluna B (Sinistros) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna A - Assistências */}
          <div className="space-y-6">
            {/* Linha 1 - Total Assistências */}
            <StatCard
              label="Total Assistências"
              value={kpis.assistencias.total}
              variant="assistencia"
              icon={Wrench}
              onClick={() => handleCardClick('assistencia')}
              isActive={filters.tipo === 'assistencia' && !filters.status}
              isLoading={loading}
            />
            
            {/* Linha 2 - Assistências em Aberto */}
            <StatCard
              label="Assistências em Aberto"
              value={kpis.assistencias.emAberto}
              variant="aberto"
              icon={Clock}
              onClick={() => handleCardClick('assistencia', 'aberto')}
              isActive={filters.tipo === 'assistencia' && filters.status === 'open'}
              isLoading={loading}
            />
            
            {/* Linha 3 - Assistências Finalizadas */}
            <StatCard
              label="Assistências Finalizadas"
              value={kpis.assistencias.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => handleCardClick('assistencia', 'finalizado')}
              isActive={filters.tipo === 'assistencia' && filters.status === 'closed'}
              isLoading={loading}
            />
          </div>

          {/* Coluna B - Sinistros */}
          <div className="space-y-6">
            {/* Linha 1 - Total Sinistros */}
            <StatCard
              label="Total Sinistros"
              value={kpis.sinistros.total}
              variant="total"
              icon={FileText}
              onClick={() => handleCardClick('sinistro')}
              isActive={filters.tipo === 'sinistro' && !filters.status}
              isLoading={loading}
            />
            
            {/* Linha 2 - Sinistros em Aberto */}
            <StatCard
              label="Sinistros em Aberto"
              value={kpis.sinistros.emAberto}
              variant="aberto"
              icon={Clock}
              onClick={() => handleCardClick('sinistro', 'aberto')}
              isActive={filters.tipo === 'sinistro' && filters.status === 'open'}
              isLoading={loading}
            />
            
            {/* Linha 3 - Sinistros Finalizados */}
            <StatCard
              label="Sinistros Finalizados"
              value={kpis.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => handleCardClick('sinistro', 'finalizado')}
              isActive={filters.tipo === 'sinistro' && filters.status === 'closed'}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Card Grande - Últimos 60 dias (full width) */}
        <StatCard
          label="Últimos 60 dias"
          value={kpis.geral.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick(undefined, undefined, 'last60d')}
          isActive={filters.periodo === 'last60d'}
          isLoading={loading}
        />
      </div>

      {/* Filter Chips */}
      {activeFilterChips.length > 0 && (
        <FilterChips
          activeFilters={activeFilterChips}
          onRemoveFilter={removeFilter}
          onClearAll={clearAllFilters}
        />
      )}

      {/* Lista de Sinistros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Lista de Sinistros ({filteredClaims.length + filteredAssistances.length})
          </h3>
        </div>
        
        <ClaimsList
          claims={[...filteredClaims, ...filteredAssistances] as Claim[]}
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
      </div>
    </div>
  );
}