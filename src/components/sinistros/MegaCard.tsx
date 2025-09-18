import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MegaCardProps {
  totalTickets: number;
  totalAbertos: number;
  totalFinalizados: number;
  ultimos60d: number;
  onTotalClick: () => void;
  onUltimos60dClick: () => void;
  isLoading?: boolean;
}

export function MegaCard({
  totalTickets,
  totalAbertos,
  totalFinalizados,
  ultimos60d,
  onTotalClick,
  onUltimos60dClick,
  isLoading = false
}: MegaCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full min-h-[140px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-row divide-x divide-slate-200 dark:divide-slate-700">
          <div className="flex-1 p-6">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-12 w-20 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
          
          <div className="flex-1 p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-16 mb-2" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full min-h-[140px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Uma única linha com 2 colunas e divisor vertical */}
      <div className="flex flex-row divide-x divide-slate-200 dark:divide-slate-700">
        {/* Coluna A – Totais */}
        <button
          onClick={onTotalClick}
          aria-label="Ver todos os tickets de sinistros e assistências"
          className="flex-1 p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ring-offset-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">
            Totais de Sinistros/Assistências
          </h4>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
            {totalTickets}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {totalAbertos} em aberto • {totalFinalizados} finalizados
          </div>
        </button>

        {/* Coluna B – Últimos 60 dias */}
        <button
          onClick={onUltimos60dClick}
          aria-label="Ver tickets dos últimos 60 dias"
          className="flex-1 p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ring-offset-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2">
            Últimos 60 dias
          </h4>
          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
            {ultimos60d}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            criados nos últimos 60 dias
          </div>
        </button>
      </div>
    </Card>
  );
}