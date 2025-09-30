import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NovoTicketModalV4 } from './NovoTicketModalV4';
import { MetricCard } from './MetricCard';
import { useClaimsStats } from '@/hooks/useClaimsStats';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { SinistrosFilter } from './SinistrosFilter';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Plus,
  Wrench,
  AlertTriangle,
  BarChart3,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';

interface SinistrosDashboardProps {
  onNavigateToList?: (scope: 'all' | 'claims' | 'assists', filter?: string, value?: string) => void;
  onNewTicket?: () => void;
}

export function SinistrosDashboard({ 
  onNavigateToList,
  onNewTicket 
}: SinistrosDashboardProps) {
  console.log('🚗 SinistrosDashboard renderizando...');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State for data
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // URL params
  const type = searchParams.get('type') || 'todos';
  const status = searchParams.get('status') || 'todos';
  const period = searchParams.get('period') || 'all';

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

  const handleTicketCreated = () => {
    loadData();
  };

  // Update URL params
  const updateFilters = (newType?: string, newStatus?: string, newPeriod?: string) => {
    const params = new URLSearchParams(searchParams);
    if (newType) params.set('type', newType);
    if (newStatus) params.set('status', newStatus);
    if (newPeriod !== undefined) params.set('period', newPeriod);
    setSearchParams(params);
    
    // Scroll to list
    setTimeout(() => {
      document.getElementById('tickets-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const clearFilters = () => {
    setSearchParams({ type: 'todos', status: 'todos', period: 'all' });
  };

  // Get active filter labels
  const getFilterLabels = () => {
    const labels: string[] = [];
    if (type !== 'todos') labels.push(type === 'sinistro' ? 'Sinistros' : 'Assistências');
    if (status !== 'todos') labels.push(status === 'aberto' ? 'Em aberto' : 'Finalizados');
    if (period === 'last60d') labels.push('Últimos 60 dias');
    return labels;
  };

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
          </div>
        </div>

        {/* Chips de filtro compactos */}
        <div className="space-y-3">
          <div className="overflow-x-auto overflow-y-visible -mx-4 px-4 md:mx-0 md:px-0 pt-4 pb-2">
            <div className="flex items-center gap-5 min-w-max md:min-w-0">
              <button
                onClick={() => updateFilters('todos', status, period)}
                className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full text-sm font-medium transition-all duration-200 ${
                  type === 'todos'
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105'
                }`}
                role="button"
                aria-pressed={type === 'todos'}
                aria-label="Todos"
                title="Todos"
              >
                <BarChart3 className="h-5 w-5 shrink-0" />
                <Badge 
                  variant="secondary" 
                  className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-blue-600 text-white border-2 border-white dark:border-gray-900 text-xs px-1.5 py-0.5 min-w-[22px] h-[22px] flex items-center justify-center rounded-full shadow-sm"
                >
                  {stats.totais.tickets}
                </Badge>
              </button>

              <button
                onClick={() => updateFilters('sinistro', status, period)}
                className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full text-sm font-medium transition-all duration-200 ${
                  type === 'sinistro'
                    ? 'bg-red-600 text-white shadow-lg scale-110'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105'
                }`}
                role="button"
                aria-pressed={type === 'sinistro'}
                aria-label="Sinistros"
                title="Sinistros"
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <Badge 
                  variant="secondary" 
                  className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-600 text-white border-2 border-white dark:border-gray-900 text-xs px-1.5 py-0.5 min-w-[22px] h-[22px] flex items-center justify-center rounded-full shadow-sm"
                >
                  {stats.sinistros.total}
                </Badge>
              </button>

              <button
                onClick={() => updateFilters('assistencia', status, period)}
                className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full text-sm font-medium transition-all duration-200 ${
                  type === 'assistencia'
                    ? 'bg-green-600 text-white shadow-lg scale-110'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105'
                }`}
                role="button"
                aria-pressed={type === 'assistencia'}
                aria-label="Assistências"
                title="Assistências"
              >
                <Wrench className="h-5 w-5 shrink-0" />
                <Badge 
                  variant="secondary" 
                  className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-green-600 text-white border-2 border-white dark:border-gray-900 text-xs px-1.5 py-0.5 min-w-[22px] h-[22px] flex items-center justify-center rounded-full shadow-sm"
                >
                  {stats.assistencias.total}
                </Badge>
              </button>
            </div>
          </div>

          {/* Seletor de período */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">Período:</span>
            <button
              onClick={() => updateFilters(type, status, period === 'last60d' ? 'all' : 'last60d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                period === 'last60d'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {period === 'last60d' ? 'Últimos 60 dias' : 'Todos'}
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        {renderDashboardContent()}

        {/* Breadcrumbs e Lista de Tickets */}
        <div id="tickets-list" className="space-y-4 scroll-mt-6">
          {getFilterLabels().length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Filtros ativos:
              </span>
              {getFilterLabels().map((label, idx) => (
                <Badge key={idx} variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {label}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}

          <SinistrosFilter
            claims={claims}
            assistances={assistances}
            loading={loading}
            filter={type === 'sinistro' ? 'sinistro' : type === 'assistencia' ? 'assistencia' : 'todos'}
            onViewClaim={(id) => console.log('View claim:', id)}
            onEditClaim={(id) => console.log('Edit claim:', id)}
            onDeleteClaim={(id) => console.log('Delete claim:', id)}
          />
        </div>
      </div>
    </div>
  );


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
              onClick={() => updateFilters('todos', 'todos', period)}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && updateFilters('todos', 'todos', period)}
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
              onClick={() => updateFilters(type, status, period === 'last60d' ? 'all' : 'last60d')}
              className="group bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer text-white"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && updateFilters(type, status, period === 'last60d' ? 'all' : 'last60d')}
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
              onClick={() => updateFilters('sinistro', 'todos', period)}
              ariaLabel="Ver todos os sinistros"
              isLoading={loading}
            />
            <MetricCard
              title="Em Aberto"
              value={stats.sinistros.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => updateFilters('sinistro', 'aberto', period)}
              ariaLabel="Ver sinistros em aberto"
              isLoading={loading}
              pulse={stats.sinistros.abertos > 0}
            />
            <MetricCard
              title="Finalizados"
              value={stats.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => updateFilters('sinistro', 'finalizado', period)}
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
              onClick={() => updateFilters('assistencia', 'todos', period)}
              ariaLabel="Ver todas as assistências"
              isLoading={loading}
            />
            <MetricCard
              title="Em Aberto"
              value={stats.assistencias.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => updateFilters('assistencia', 'aberto', period)}
              ariaLabel="Ver assistências em aberto"
              isLoading={loading}
              pulse={stats.assistencias.abertos > 0}
            />
            <MetricCard
              title="Finalizadas"
              value={stats.assistencias.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => updateFilters('assistencia', 'finalizado', period)}
              ariaLabel="Ver assistências finalizadas"
              isLoading={loading}
            />
          </div>
        </section>
      </>
    );
  }

}