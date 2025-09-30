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
import { SinistrosFilter } from './SinistrosFilter'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Plus,
  Wrench,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Moon,
  Sun
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

  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Header moderno */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Dashboard de Sinistros e Assistências
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Gerencie e acompanhe todos os registros em tempo real
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="h-10 w-10 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </Button>

            {/* Botão de novo registro */}
            {uiVersion.useV2 ? (
              <NovoTicketModalV4
                trigger={
                  <Button 
                    size="default" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-6"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo Registro</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                }
                onTicketCreated={handleTicketCreated}
                initialTipo="sinistro"
              />
            ) : (
              <NovoTicketModal
                trigger={
                  <Button 
                    size="default" 
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-6"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo Registro</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                }
                onTicketCreated={handleTicketCreated}
                initialTipo="sinistro"
              />
            )}
          </div>
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
          <div className="mt-6">
            <SinistrosFilter
              claims={claims}
              assistances={assistances}
              loading={loading}
              filter="sinistro"
              onViewClaim={(id) => console.log('View claim:', id)}
              onEditClaim={(id) => console.log('Edit claim:', id)}
              onDeleteClaim={(id) => console.log('Delete claim:', id)}
            />
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
          <div className="mt-6">
            <SinistrosFilter
              claims={claims}
              assistances={assistances}
              loading={loading}
              filter="assistencia"
              onViewClaim={(id) => console.log('View claim:', id)}
              onEditClaim={(id) => console.log('Edit claim:', id)}
              onDeleteClaim={(id) => console.log('Delete claim:', id)}
            />
          </div>
        )
      },
      {
        id: 'todos',
        label: 'Todos',
        icon: <GitBranch className="h-4 w-4" />,
        count: stats.totais.tickets,
        lazy: true,
        content: (
          <div className="mt-6">
            <SinistrosFilter
              claims={claims}
              assistances={assistances}
              loading={loading}
              filter="todos"
              onViewClaim={(id) => console.log('View claim:', id)}
              onEditClaim={(id) => console.log('Edit claim:', id)}
              onDeleteClaim={(id) => console.log('Delete claim:', id)}
            />
          </div>
        )
      }
    ];
  }

  // Função para renderizar conteúdo do dashboard (reutilizada)
  function renderDashboardContent() {
    return (
      <>
        {/* Visão Geral - 2 cards grandes lado a lado */}
        <section aria-label="Visão Geral" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Card Totais */}
            <div 
              onClick={() => goToListWith({})}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Total
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Tickets</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {loading ? '...' : stats.totais.tickets}
                </p>
                <div className="flex items-center gap-4 text-sm pt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {stats.sinistros.abertos + stats.assistencias.abertos} em aberto
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {stats.sinistros.finalizados + stats.assistencias.finalizados} finalizados
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Últimos 60 dias */}
            <div 
              onClick={() => goToListWith({ createdFromDays: 60 })}
              className="group bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  60 dias
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-100">Últimos 60 dias</p>
                <p className="text-4xl font-bold text-white group-hover:scale-105 transition-transform inline-block">
                  {loading ? '...' : stats.totais.ultimos60d}
                </p>
                <p className="text-sm text-blue-100 pt-2">
                  tickets registrados recentemente
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards detalhados - Sinistros */}
        <section aria-labelledby="sinistros" className="space-y-4">
          <h2 id="sinistros" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Sinistros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              title="Em Aberto"
              value={stats.sinistros.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => goToListWith({ tipo: 'sinistro', status: ['aberto', 'em_analise', 'em_andamento'] })}
              ariaLabel="Ver sinistros em aberto"
              isLoading={loading}
              pulse={stats.sinistros.abertos > 0}
            />
            <MetricCard
              title="Finalizados"
              value={stats.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => goToListWith({ tipo: 'sinistro', status: ['finalizado'] })}
              ariaLabel="Ver sinistros finalizados"
              isLoading={loading}
            />
          </div>
        </section>

        {/* Cards detalhados - Assistências */}
        <section aria-labelledby="assistencias" className="space-y-4">
          <h2 id="assistencias" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />
            Assistências
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              title="Em Aberto"
              value={stats.assistencias.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => goToListWith({ tipo: 'assistencia', status: ['aberto', 'em_analise', 'em_andamento'] })}
              ariaLabel="Ver assistências em aberto"
              isLoading={loading}
              pulse={stats.assistencias.abertos > 0}
            />
            <MetricCard
              title="Finalizadas"
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
        <SinistrosFilter
          claims={claims}
          assistances={assistances}
          loading={loading}
          filter="todos"
          onViewClaim={(id) => console.log('View claim:', id)}
          onEditClaim={(id) => console.log('Edit claim:', id)}
          onDeleteClaim={(id) => console.log('Delete claim:', id)}
        />
      </div>
    );
  }
}