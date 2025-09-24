import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NovoTicketModal } from './NovoTicketModal';
import { SinistrosListModal } from './SinistrosListModal';
import { MegaCard } from './MegaCard';
import { MetricCard } from './MetricCard';
import { useClaimsStats } from '@/hooks/useClaimsStats';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { TicketsList } from '@/components/tickets/TicketsList';
import { shouldUseUIV2, shouldUseTabsV2 } from '@/config/features';
// Phase 1 - UI V2 components
import { NovoTicketModalV2 } from './NovoTicketModalV2'
import { NovoTicketModalV3 } from './NovoTicketModalV3'
import { NovoTicketModalV4 } from './NovoTicketModalV4'
import { useUIVersion } from '@/hooks/useUIVersion'
import { TicketsListV2 } from '@/components/tickets/TicketsListV2'
import { TabsRCorp, TabItem } from '@/components/ui-v2/tabs-rcorp'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Plus,
  Wrench,
  GitBranch,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';

interface ClaimFilter {
  tipo?: 'sinistro' | 'assistencia';
  status?: string[];
  createdFromDays?: number;
}

interface ModalFilter {
  tipo?: 'sinistro' | 'assistencia';
  status?: string;
  periodo?: 'last60d';
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
  
  const uiVersion = useUIVersion('sinistros');
  
  // State for data
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFilter, setModalFilter] = useState<ModalFilter>({});
  
  const { toast } = useToast();

  // Calculate KPIs using the custom hook
  const stats = useClaimsStats(claims, assistances);

  console.log('📊 Stats calculados:', stats);

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

  // Navigate to list with specific filter
  const goToListWith = (filter: ClaimFilter) => {
    let title = '';
    let modalFilterFormatted: ModalFilter = {};
    
    if (filter.tipo && filter.status) {
      const statusText = filter.status.includes('finalizado') ? 'Finalizados' : 'em Aberto';
      title = `${filter.tipo === 'sinistro' ? 'Sinistros' : 'Assistências'} ${statusText}`;
      modalFilterFormatted = { 
        tipo: filter.tipo, 
        status: filter.status.includes('finalizado') ? 'closed' : 'open' 
      };
    } else if (filter.tipo) {
      title = `Total de ${filter.tipo === 'sinistro' ? 'Sinistros' : 'Assistências'}`;
      modalFilterFormatted = { tipo: filter.tipo };
    } else if (filter.createdFromDays === 60) {
      title = 'Últimos 60 dias';
      modalFilterFormatted = { periodo: 'last60d' };
    } else {
      title = 'Todos os Tickets';
      modalFilterFormatted = {};
    }
    
    setModalTitle(title);
    setModalFilter(modalFilterFormatted);
    setModalOpen(true);
  };

  const handleTicketCreated = () => {
    loadData();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 space-y-6 md:space-y-8">
      {/* Header com botão único */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestão de Sinistros</h2>
          <p className="text-sm text-muted-foreground">Dashboard e acompanhamento de tickets</p>
        </div>
        
        {/* Botão único - removendo redundâncias */}
        {uiVersion.useV2 ? (
          <NovoTicketModalV4
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Ticket
              </Button>
            }
            onTicketCreated={handleTicketCreated}
            initialTipo="sinistro"
          />
        ) : (
          <NovoTicketModal
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Ticket
              </Button>
            }
            onTicketCreated={handleTicketCreated}
            initialTipo="sinistro"
          />
        )}
      </div>

      {/* TabsRCorp V2 ou Tabs tradicionais baseado na feature flag */}
      {shouldUseTabsV2() ? (
        <TabsRCorp
          items={createTabsV2Items()}
          initialTabId="dashboard"
          urlSync={true}
          className="w-full"
        />
      ) : (
        // Layout original (fallback)
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            {renderDashboardContent()}
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            {renderTicketsContent()}
          </TabsContent>
        </Tabs>
      )}

      {/* Modal com lista filtrada - compartilhado entre versões */}
      <SinistrosListModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        initialFilter={modalFilter}
      />
    </div>
  );

  // Função para criar os itens das abas V2
  function createTabsV2Items(): TabItem[] {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <BarChart3 className="h-4 w-4" />,
        count: stats.totais.tickets,
        content: <div className="mt-6 space-y-6">{renderDashboardContent()}</div>
      },
      {
        id: 'sinistros',
        label: 'Sinistros',
        icon: <AlertTriangle className="h-4 w-4" />,
        count: stats.sinistros.total,
        lazy: true,
        content: (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Lista de Sinistros</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Filtro aplicado: apenas sinistros
            </div>
            {renderTicketsContent()}
          </div>
        )
      },
      {
        id: 'assistencias',
        label: 'Assistências',
        icon: <Wrench className="h-4 w-4" />,
        count: stats.assistencias.total,
        lazy: true,
        content: (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Lista de Assistências</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Filtro aplicado: apenas assistências
            </div>
            {renderTicketsContent()}
          </div>
        )
      },
      {
        id: 'todos',
        label: 'Todos os Tickets',
        icon: <GitBranch className="h-4 w-4" />,
        count: stats.totais.tickets,
        lazy: true,
        content: <div className="mt-6">{renderTicketsContent()}</div>
      }
    ];
  }

  // Função para renderizar conteúdo do dashboard (reutilizada)
  function renderDashboardContent() {
    return (
      <>
        {/* MegaCard - Totais */}
        <MegaCard
          totalTickets={stats.totais.tickets}
          totalAbertos={stats.sinistros.abertos + stats.assistencias.abertos}
          totalFinalizados={stats.sinistros.finalizados + stats.assistencias.finalizados}
          ultimos60d={stats.totais.ultimos60d}
          onTotalClick={() => goToListWith({})}
          onUltimos60dClick={() => goToListWith({ createdFromDays: 60 })}
          isLoading={loading}
        />

        {/* Linha de Sinistros */}
        <section aria-labelledby="sinistros">
          <h3 id="sinistros" className="sr-only">Sinistros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <MetricCard
              title="Total de Sinistros"
              value={stats.sinistros.total}
              variant="total"
              icon={FileText}
              onClick={() => goToListWith({ tipo: 'sinistro' })}
              ariaLabel="Ver todos os sinistros"
              isLoading={loading}
            />
            <MetricCard
              title="Sinistros em Aberto"
              value={stats.sinistros.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => goToListWith({ tipo: 'sinistro', status: ['aberto', 'em_analise', 'em_andamento'] })}
              ariaLabel="Ver sinistros em aberto"
              isLoading={loading}
            />
            <MetricCard
              title="Sinistros Finalizados"
              value={stats.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => goToListWith({ tipo: 'sinistro', status: ['finalizado'] })}
              ariaLabel="Ver sinistros finalizados"
              isLoading={loading}
            />
          </div>
        </section>

        {/* Linha de Assistências */}
        <section aria-labelledby="assistencias">
          <h3 id="assistencias" className="sr-only">Assistências</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <MetricCard
              title="Total de Assistências"
              value={stats.assistencias.total}
              variant="assistencia"
              icon={Wrench}
              onClick={() => goToListWith({ tipo: 'assistencia' })}
              ariaLabel="Ver todas as assistências"
              isLoading={loading}
            />
            <MetricCard
              title="Assistências em Aberto"
              value={stats.assistencias.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => goToListWith({ tipo: 'assistencia', status: ['aberto', 'em_analise', 'em_andamento'] })}
              ariaLabel="Ver assistências em aberto"
              isLoading={loading}
            />
            <MetricCard
              title="Assistências Finalizadas"
              value={stats.assistencias.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => goToListWith({ tipo: 'assistencia', status: ['finalizado'] })}
              ariaLabel="Ver assistências finalizadas"
              isLoading={loading}
            />
          </div>
        </section>
      </>
    );
  }

  // Função para renderizar conteúdo dos tickets (reutilizada)
  function renderTicketsContent() {
    return (
      <div className="space-y-4">
        {uiVersion.useV2 ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lista de Tickets (V2)</h3>
              <Badge variant="secondary" className="text-xs">
                React Aria + Advanced Filtering
              </Badge>
            </div>
            <TicketsListV2
              claims={claims}
              assistances={assistances}
              loading={loading}
              onViewClaim={(id) => console.log('View claim:', id)}
              onEditClaim={(id) => console.log('Edit claim:', id)}
              onDeleteClaim={(id) => console.log('Delete claim:', id)}
            />
          </>
        ) : (
          <TicketsList />
        )}
      </div>
    );
  }
}