import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Clock, CheckCircle, Car, Wrench } from 'lucide-react';
import { TicketsList } from './TicketsList';
import { NewTicketModal } from './NewTicketModal';
import { TicketsCharts } from './TicketsCharts';
import { TicketsFilters } from './TicketsFilters';
import { useTicketsData } from '@/hooks/useTicketsData';
import { TicketTipo, TicketStatus } from '@/types/tickets';

export function TicketsDashboard() {
  const { stats, filters, setFilters, loading, deleteTicket } = useTicketsData();
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showList, setShowList] = useState(false);

  const handleCardClick = (tipo?: TicketTipo, status?: TicketStatus) => {
    setFilters(prev => ({ ...prev, tipo, status }));
    setShowList(true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setShowList(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Sinistros & Assistências
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gestão completa de sinistros e solicitações de assistência 24h
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sinistros & Assistências
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestão completa de sinistros e solicitações de assistência 24h
          </p>
        </div>
        <Button onClick={() => setShowNewTicketModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Card Principal - Totais */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Totais de Sinistros/Assistências */}
          <div 
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-lg transition-colors"
            onClick={() => handleCardClick()}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Totais de Sinistros/Assistências
              </h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalSinistros + stats.totalAssistencias}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {stats.sinistrosAbertos + stats.assistenciasAbertas} em aberto • {' '}
              {stats.sinistrosFinalizados + stats.assistenciasFinalizadas} finalizados
            </p>
          </div>

          {/* Últimos 60 dias */}
          <div 
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-lg transition-colors"
            onClick={() => setFilters(prev => ({ ...prev, periodo: 'ultimos_60' }))}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Últimos 60 dias
              </h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.totalUltimos60Dias}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              tickets criados no período
            </p>
          </div>
        </div>
      </Card>

      {/* Cards de Sinistros */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Sinistros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('sinistro')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Car className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Total de Sinistros
              </h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalSinistros}
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('sinistro', 'aberto')}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Sinistros em Aberto
              </h3>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.sinistrosAbertos}
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('sinistro', 'finalizado')}
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Sinistros Finalizados
              </h3>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.sinistrosFinalizados}
            </div>
          </Card>
        </div>
      </div>

      {/* Cards de Assistências */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Assistências
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('assistencia')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Total de Assistências
              </h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAssistencias}
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('assistencia', 'aberto')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Assistências em Aberto
              </h3>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.assistenciasAbertas}
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('assistencia', 'finalizado')}
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Assistências Finalizadas
              </h3>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.assistenciasFinalizadas}
            </div>
          </Card>
        </div>
      </div>

      {/* Filtros e Lista */}
      {showList && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Lista de Tickets
            </h2>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
            >
              Limpar Filtros
            </Button>
          </div>
          
          <TicketsFilters filters={filters} onFiltersChange={setFilters} />
          <TicketsList />
        </div>
      )}

      {/* Gráficos */}
      <TicketsCharts />

      {/* Modal de Novo Ticket */}
      <NewTicketModal 
        open={showNewTicketModal}
        onOpenChange={setShowNewTicketModal}
      />
    </div>
  );
}