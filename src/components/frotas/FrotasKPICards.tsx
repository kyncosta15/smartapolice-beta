import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Car, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  CreditCard,
  PieChart
} from 'lucide-react';
import { FrotaKPIs } from '@/hooks/useFrotasData';
import { formatCurrency } from '@/utils/currencyFormatter';

interface FrotasKPICardsProps {
  kpis: FrotaKPIs;
  loading: boolean;
}

export function FrotasKPICards({ kpis, loading }: FrotasKPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4 md:mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-6 min-h-[120px] animate-pulse">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
            </div>
            <div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4 md:mb-6">
      <Card className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:p-6 min-h-[100px] sm:min-h-[120px] flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-2">
          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 leading-tight truncate">
            Total de Veículos
          </h3>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
            {kpis.totalVeiculos}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
            veículos cadastrados
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:p-6 min-h-[100px] sm:min-h-[120px] flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-2">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 leading-tight truncate">
            Sem Seguro
          </h3>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
            {kpis.semSeguro}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
            necessitam seguro
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:p-6 min-h-[100px] sm:min-h-[120px] flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 leading-tight truncate">
            Emplacamento Vencido
          </h3>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
            {kpis.emplacamentoVencido}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
            licenciamento vencido
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:p-6 min-h-[100px] sm:min-h-[120px] flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 leading-tight truncate">
            Próximo Vencimento
          </h3>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
            {kpis.proximoVencimento}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
            vencem em 30 dias
          </p>
        </div>
      </Card>
    </div>
  );
}