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
      <Card className="w-full min-h-[176px] bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-white/5 dark:to-white/0">
        <div className="flex flex-row divide-x divide-slate-200/60 dark:divide-slate-700/60">
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
    <Card className="w-full min-h-[176px] bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-white/5 dark:to-white/0 hover:shadow-md transition-shadow">
      {/* Uma única linha com 2 colunas e divisor vertical */}
      <div className="flex flex-row divide-x divide-slate-200/60 dark:divide-slate-700/60">
        {/* Coluna A – Totais */}
        <button
          onClick={onTotalClick}
          aria-label="Ver todos os tickets de sinistros e assistências"
          className="flex-1 p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Totais de Sinistros/Assistências
          </h4>
          <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-2">
            {totalTickets}
          </div>
          <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
            {totalAbertos} em aberto • {totalFinalizados} finalizados
          </div>
        </button>

        {/* Coluna B – Últimos 60 dias */}
        <button
          onClick={onUltimos60dClick}
          aria-label="Ver tickets dos últimos 60 dias"
          className="flex-1 p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Últimos 60 dias
          </h4>
          <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-2">
            {ultimos60d}
          </div>
          <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
            criados nos últimos 60 dias
          </div>
        </button>
      </div>
    </Card>
  );
}