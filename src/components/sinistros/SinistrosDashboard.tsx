import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NovoTicketModalV4 } from './NovoTicketModalV4';
import { MetricCard } from './MetricCard';
import { useClaimsStats } from '@/hooks/useClaimsStats';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { SinistrosDetailsModal } from './SinistrosDetailsModal';
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Plus,
  Wrench,
  AlertTriangle,
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SinistrosDashboardProps {
  onNavigateToList?: (scope: 'all' | 'claims' | 'assists', filter?: string, value?: string) => void;
  onNewTicket?: () => void;
}

export function SinistrosDashboard({ 
  onNavigateToList,
  onNewTicket 
}: SinistrosDashboardProps) {
  console.log('🚗 SinistrosDashboard renderizando...');
  
  const { toast } = useToast();
  
  // State for data
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<'sinistro' | 'assistencia' | 'todos'>('todos');
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'claim' | 'assistance' } | null>(null);

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

  const handleDeleteClaim = async (claimId: string) => {
    setItemToDelete({ id: claimId, type: 'claim' });
    setDeleteDialogOpen(true);
  };

  const handleDeleteAssistance = async (assistanceId: string) => {
    setItemToDelete({ id: assistanceId, type: 'assistance' });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'claim') {
        await ClaimsService.deleteClaim(itemToDelete.id);
        toast({
          title: "Sucesso",
          description: "Sinistro deletado com sucesso!",
        });
      } else {
        await ClaimsService.deleteAssistance(itemToDelete.id);
        toast({
          title: "Sucesso",
          description: "Assistência deletada com sucesso!",
        });
      }
      
      // Recarregar todos os dados
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: `Não foi possível deletar o ${itemToDelete.type === 'claim' ? 'sinistro' : 'assistência'}`,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Open modal with filter
  const openModal = (filter: 'sinistro' | 'assistencia' | 'todos') => {
    setModalFilter(filter);
    setModalOpen(true);
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

        {/* Dashboard Content */}
        {renderDashboardContent()}

        {/* Modal de detalhes */}
        <SinistrosDetailsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          filter={modalFilter}
          claims={claims}
          assistances={assistances}
          loading={loading}
          onDeleteClaim={handleDeleteClaim}
          onDeleteAssistance={handleDeleteAssistance}
          onRefresh={loadData}
        />

        {/* Diálogo de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este {itemToDelete?.type === 'claim' ? 'sinistro' : 'assistência'}? 
                Esta ação não pode ser desfeita e o registro será permanentemente removido do banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              onClick={() => openModal('todos')}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal('todos')}
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
              className="group bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 text-white"
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
              onClick={() => openModal('sinistro')}
              ariaLabel="Ver todos os sinistros"
              isLoading={loading}
            />
            <MetricCard
              title="Em Aberto"
              value={stats.sinistros.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => openModal('sinistro')}
              ariaLabel="Ver sinistros em aberto"
              isLoading={loading}
              pulse={stats.sinistros.abertos > 0}
            />
            <MetricCard
              title="Finalizados"
              value={stats.sinistros.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => openModal('sinistro')}
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
              onClick={() => openModal('assistencia')}
              ariaLabel="Ver todas as assistências"
              isLoading={loading}
            />
            <MetricCard
              title="Em Aberto"
              value={stats.assistencias.abertos}
              variant="aberto"
              icon={Clock}
              onClick={() => openModal('assistencia')}
              ariaLabel="Ver assistências em aberto"
              isLoading={loading}
              pulse={stats.assistencias.abertos > 0}
            />
            <MetricCard
              title="Finalizadas"
              value={stats.assistencias.finalizados}
              variant="finalizado"
              icon={CheckCircle}
              onClick={() => openModal('assistencia')}
              ariaLabel="Ver assistências finalizadas"
              isLoading={loading}
            />
          </div>
        </section>
      </>
    );
  }

}