import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { NovoTicketModal } from './NovoTicketModal';
import { SinistrosListModal } from './SinistrosListModal';
import { useSinistrosKpis } from '@/hooks/useSinistrosKpis';
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
  
  // Modal state
  const [listModalOpen, setListModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFilter, setModalFilter] = useState<{
    tipo?: 'sinistro' | 'assistencia';
    status?: string;
    periodo?: 'last60d';
  }>({});
  
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
  const kpis = useSinistrosKpis(mockItems, {});

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
    // Configure modal based on card clicked
    let title = '';
    let filter: typeof modalFilter = {};
    
    if (cardType === 'total') {
      title = 'Todos os Sinistros e Assistências';
    } else if (cardType === 'sinistros') {
      title = 'Sinistros';
      filter.tipo = 'sinistro';
    } else if (cardType === 'assistencias') {
      title = 'Assistências';
      filter.tipo = 'assistencia';
    }
    
    if (filterType === 'aberto') {
      title += ' - Em Aberto';
      filter.status = 'open';
    } else if (filterType === 'finalizado') {
      title += ' - Finalizados';
      filter.status = 'closed';
    } else if (filterType === 'ultimos60d') {
      title += ' - Últimos 60 dias';
      filter.periodo = 'last60d';
    }
    
    setModalTitle(title);
    setModalFilter(filter);
    setListModalOpen(true);
  };

  const handleTicketCreated = () => {
    loadData();
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 space-y-8">
      {/* Header with CTA only */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard de Sinistros</h2>
          <p className="text-muted-foreground">
            Clique nos cards para ver detalhes e filtrar informações
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

      {/* Dashboard Grid - 3x3 responsive layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Linha 1 - Total (Sinistros & Assistências) */}
        <StatCard
          label="Total (Sinistros & Assistências)"
          value={kpis.geral.total}
          variant="total"
          icon={Activity}
          onClick={() => handleCardClick('total')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Em Aberto"
          value={kpis.geral.emAberto}
          variant="aberto"
          icon={Clock}
          onClick={() => handleCardClick('total', 'aberto')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Finalizados"
          value={kpis.geral.finalizados}
          variant="finalizado"
          icon={CheckCircle}
          onClick={() => handleCardClick('total', 'finalizado')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Últimos 60 dias"
          value={kpis.geral.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick('total', 'ultimos60d')}
          isActive={false}
          isLoading={loading}
        />

        {/* Linha 2 - Somente Sinistros */}
        <StatCard
          label="Total de Sinistros"
          value={kpis.sinistros.total}
          variant="total"
          icon={FileText}
          onClick={() => handleCardClick('sinistros')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros Em Aberto"
          value={kpis.sinistros.emAberto}
          variant="aberto"
          icon={Clock}
          onClick={() => handleCardClick('sinistros', 'aberto')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros Finalizados"
          value={kpis.sinistros.finalizados}
          variant="finalizado"
          icon={CheckCircle}
          onClick={() => handleCardClick('sinistros', 'finalizado')}
          isActive={false}
          isLoading={loading}
        />
        <StatCard
          label="Sinistros (60 dias)"
          value={kpis.sinistros.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick('sinistros', 'ultimos60d')}
          isActive={false}
          isLoading={loading}
        />

        {/* Linha 3 - Somente Assistências */}
        <StatCard
          label="Total de Assistências"
          value={kpis.assistencias.total}
          variant="assistencia"
          icon={Wrench}
          onClick={() => handleCardClick('assistencias')}
          isActive={false}
          isLoading={loading}
        />
      </div>

      {/* Modal for filtered list */}
      <SinistrosListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        title={modalTitle}
        initialFilter={modalFilter}
      />
    </div>
  );
}