import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './StatCard';
import { FilterChips } from './FilterChips';
import { NovoTicketModal } from './NovoTicketModal';
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
  Activity,
  Search
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

// Mock data - replace with real data from API
const mockItems: BaseItem[] = [
  {
    id: '1', tipo: 'sinistro', status: 'open', created_at: '2025-01-10T10:00:00Z',
    seguradora: 'Porto Seguro', placa: 'ABC1D23', proprietario_nome: 'João Silva', modelo: 'Argo'
  },
  {
    id: '2', tipo: 'sinistro', status: 'closed', created_at: '2025-01-05T15:30:00Z',
    seguradora: 'Bradesco Seguros', placa: 'XYZ9W87', proprietario_nome: 'Maria Santos', modelo: 'Civic'
  },
  {
    id: '3', tipo: 'assistencia', status: 'open', created_at: '2025-01-12T09:00:00Z',
    seguradora: 'Suhai Seguradora', placa: 'DEF4G56', proprietario_nome: 'Pedro Oliveira', modelo: 'Onix'
  },
  {
    id: '4', tipo: 'assistencia', status: 'closed', created_at: '2024-12-20T14:00:00Z',
    seguradora: 'Allianz', placa: 'GHI7J89', proprietario_nome: 'Ana Costa', modelo: 'HB20'
  }
];

export function SinistrosDashboard({ 
  onNavigateToList,
  onNewTicket 
}: SinistrosDashboardProps) {
  console.log('🚗 SinistrosDashboard renderizando...');
  
  // State for data
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  
  // Filter state management
  const {
    filters,
    activeFilterChips,
    updateFilter,
    removeFilter,
    clearAllFilters,
    applyCardFilter
  } = useFilterState();
  
  const { toast } = useToast();

  // Create combined items for KPI calculation
  const mockItems: BaseItem[] = [
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

  // Calculate KPIs using the custom hook
  const kpis = useSinistrosKpis(mockItems, {
    status: filters.status,
    seguradora: filters.seguradora,
    search: filters.search
  });

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

  const handleCardClick = (cardType: 'total' | 'sinistros' | 'assistencias', filterType?: 'aberto' | 'finalizado' | 'ultimos60d') => {
    applyCardFilter(cardType, filterType);
    setShowList(true);
  };

  const handleTicketCreated = () => {
    loadData();
    setShowList(true);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 space-y-8">
      {/* Header with filters, search and CTA */}
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

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, chassi, proprietário ou modelo"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
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
      </div>

      {/* Filter chips */}
      <FilterChips
        activeFilters={activeFilterChips}
        onRemoveFilter={removeFilter}
        onClearAll={() => {
          clearAllFilters();
          setShowList(false);
        }}
      />

      {/* Dashboard Grid - 3x3 responsive layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Linha 1 - Total (Sinistros & Assistências) */}
        <StatCard
          label="Total (Sinistros & Assistências)"
          value={kpis.geral.total}
          variant="total"
          icon={Activity}
          onClick={() => handleCardClick('total')}
          isActive={!filters.tipo && !filters.status && !filters.periodo}
          isLoading={loading}
        />
        <StatCard
          label="Em Aberto"
          value={kpis.geral.emAberto}
          variant="aberto"
          icon={Clock}
          onClick={() => handleCardClick('total', 'aberto')}
          isActive={filters.status === 'open' && !filters.tipo}
          isLoading={loading}
        />
        <StatCard
          label="Finalizados"
          value={kpis.geral.finalizados}
          variant="finalizado"
          icon={CheckCircle}
          onClick={() => handleCardClick('total', 'finalizado')}
          isActive={filters.status === 'closed' && !filters.tipo}
          isLoading={loading}
        />
        <StatCard
          label="Últimos 60 dias"
          value={kpis.geral.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick('total', 'ultimos60d')}
          isActive={filters.periodo === 'last60d' && !filters.tipo}
          isLoading={loading}
        />

        {/* Linha 2 - Somente Sinistros */}
        <StatCard
          label="Total de Sinistros"
          value={kpis.sinistros.total}
          variant="total"
          icon={FileText}
          onClick={() => handleCardClick('sinistros')}
          isActive={filters.tipo === 'sinistro' && !filters.status && !filters.periodo}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros Em Aberto"
          value={kpis.sinistros.emAberto}
          variant="aberto"
          icon={Clock}
          onClick={() => handleCardClick('sinistros', 'aberto')}
          isActive={filters.tipo === 'sinistro' && filters.status === 'open'}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros Finalizados"
          value={kpis.sinistros.finalizados}
          variant="finalizado"
          icon={CheckCircle}
          onClick={() => handleCardClick('sinistros', 'finalizado')}
          isActive={filters.tipo === 'sinistro' && filters.status === 'closed'}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros (60 dias)"
          value={kpis.sinistros.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick('sinistros', 'ultimos60d')}
          isActive={filters.tipo === 'sinistro' && filters.periodo === 'last60d'}
          isLoading={loading}
        />

        {/* Linha 3 - Somente Assistências */}
        <StatCard
          label="Total de Assistências"
          value={kpis.assistencias.total}
          variant="assistencia"
          icon={Wrench}
          onClick={() => handleCardClick('assistencias')}
          isActive={filters.tipo === 'assistencia' && !filters.status && !filters.periodo}
          isLoading={loading}
        />
      </div>

      {/* Lista de Sinistros (aparece quando um card é clicado) */}
      {showList && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Lista de {filters.tipo === 'sinistro' ? 'Sinistros' : filters.tipo === 'assistencia' ? 'Assistências' : 'Sinistros e Assistências'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({mockItems.length} {mockItems.length === 1 ? 'item' : 'itens'})
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowList(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Ocultar lista
            </Button>
          </div>
          
          <ClaimsList
            claims={filters.tipo === 'assistencia' ? [] : claims}
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
      )}
    </div>
  );
}