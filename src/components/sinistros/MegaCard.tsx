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
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          <div className="p-6">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-12 w-20 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
          
          <div className="hidden lg:block w-px bg-slate-200/70 dark:bg-slate-700/70 mx-2 my-4" />
          
          <div className="p-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        <button
          onClick={onTotalClick}
          aria-label="Ver todos os tickets de sinistros e assistências"
          className="p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-l-lg cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Totais de Sinistros/Assistências
          </h4>
          <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            {totalTickets}
          </div>
          <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
            {totalAbertos} em aberto • {totalFinalizados} finalizados
          </div>
        </button>

        {/* Divisor vertical - apenas no desktop */}
        <div className="hidden lg:block w-px bg-slate-200/70 dark:bg-slate-700/70 mx-2 my-4" />

        <button
          onClick={onUltimos60dClick}
          aria-label="Ver tickets dos últimos 60 dias"
          className="p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-r-lg cursor-pointer active:scale-[0.99]"
        >
          <h4 className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Últimos 60 dias
          </h4>
          <div className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
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