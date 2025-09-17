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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-xl border bg-white p-4 sm:p-6 animate-pulse">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
      <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
            Total de Veículos
          </h3>
          <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {kpis.totalVeiculos}
          </div>
          <p className="text-xs text-gray-500 break-words">
            veículos cadastrados
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
            Sem Seguro
          </h3>
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-red-600 leading-tight">
            {kpis.semSeguro}
          </div>
          <p className="text-xs text-gray-500 break-words">
            necessitam seguro
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
            Emplacamento Vencido
          </h3>
          <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-orange-600 leading-tight">
            {kpis.emplacamentoVencido}
          </div>
          <p className="text-xs text-gray-500 break-words">
            licenciamento vencido
          </p>
        </div>
      </Card>

      <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
            Próximo Vencimento
          </h3>
          <Calendar className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-bold text-yellow-600 leading-tight">
            {kpis.proximoVencimento}
          </div>
          <p className="text-xs text-gray-500 break-words">
            vencem em 30 dias
          </p>
        </div>
      </Card>
    </div>
  );
}