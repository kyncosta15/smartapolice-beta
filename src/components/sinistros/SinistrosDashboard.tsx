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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFilter, setModalFilter] = useState<{tipo?: 'sinistro' | 'assistencia'; status?: string; periodo?: 'last60d'}>({});
  
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

  // Calculate KPIs using the custom hook
  const kpis = useSinistrosKpis(allItems, {});

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

  // Handle card clicks to open modal with filtered data
  const handleCardClick = (tipo?: 'sinistro' | 'assistencia', status?: 'aberto' | 'finalizado', periodo?: 'last60d') => {
    let title = '';
    let filter: {tipo?: 'sinistro' | 'assistencia'; status?: string; periodo?: 'last60d'} = {};
    
    if (tipo && status) {
      title = `${tipo === 'sinistro' ? 'Sinistros' : 'Assistências'} ${status === 'aberto' ? 'em Aberto' : 'Finalizados'}`;
      filter = { tipo, status: status === 'aberto' ? 'open' : 'closed' };
    } else if (tipo) {
      title = `Total de ${tipo === 'sinistro' ? 'Sinistros' : 'Assistências'}`;
      filter = { tipo };
    } else if (periodo === 'last60d') {
      title = 'Últimos 60 dias';
      filter = { periodo };
    } else {
      title = 'Resumo Geral';
      filter = {};
    }
    
    setModalTitle(title);
    setModalFilter(filter);
    setModalOpen(true);
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
            Clique nos cards para ver detalhes
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

      <div className="space-y-6">
        {/* Card Grande - Resumo Geral */}
        <div className="relative">
          <StatCard
            label="Resumo Geral"
            value={`${kpis.geral.total} tickets`}
            variant="total"
            icon={Activity}
            onClick={() => handleCardClick()}
            isLoading={loading}
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {kpis.geral.emAberto} em aberto • {kpis.geral.finalizados} finalizados
          </p>
        </div>

        {/* Grid 3x2 - Layout: Coluna 1 (Sinistros) | Coluna 2 (Assistências) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna 1 - Sinistros */}
          <div className="space-y-6">
            {/* Linha 1 - Total Sinistros */}
            <StatCard
              label="Total Sinistros"
              value={kpis.sinistros.total}
              variant="total"
              icon={FileText}
              onClick={() => handleCardClick('sinistro')}
              isLoading={loading}
            />
            
            {/* Linha 2 - Sinistros em Aberto */}
            <StatCard
              label="Sinistros em Aberto"
              value={kpis.sinistros.emAberto}
              variant="aberto"
              icon={Clock}
              onClick={() => handleCardClick('sinistro', 'aberto')}
              isLoading={loading}
            />
            
            {/* Linha 3 - Sinistros Finalizados */}
            <StatCard
              label="Sinistros Finalizados"
              value={kpis.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => handleCardClick('sinistro', 'finalizado')}
              isLoading={loading}
            />
          </div>

          {/* Coluna 2 - Assistências */}
          <div className="space-y-6">
            {/* Linha 1 - Total Assistências */}
            <StatCard
              label="Total Assistências"
              value={kpis.assistencias.total}
              variant="assistencia"
              icon={Wrench}
              onClick={() => handleCardClick('assistencia')}
              isLoading={loading}
            />
            
            {/* Linha 2 - Assistências em Aberto */}
            <StatCard
              label="Assistências em Aberto"
              value={kpis.assistencias.emAberto}
              variant="aberto"
              icon={Clock}
              onClick={() => handleCardClick('assistencia', 'aberto')}
              isLoading={loading}
            />
            
            {/* Linha 3 - Assistências Finalizadas */}
            <StatCard
              label="Assistências Finalizadas"
              value={kpis.assistencias.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => handleCardClick('assistencia', 'finalizado')}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Card dos Últimos 60 dias (full width) */}
        <StatCard
          label="Últimos 60 dias"
          value={kpis.geral.ult60d}
          variant="ultimos60"
          icon={Calendar}
          onClick={() => handleCardClick(undefined, undefined, 'last60d')}
          isLoading={loading}
        />
      </div>

      {/* Modal com lista filtrada */}
      <SinistrosListModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        initialFilter={modalFilter}
      />
    </div>
  );
}