
import React, { useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  FileText, DollarSign, Shield,
  AlertTriangle, XCircle
} from 'lucide-react';

import { formatCurrency } from '@/utils/currencyFormatter';
import { useIsMobile } from '@/hooks/use-mobile';

interface KPICardsProps {
  totalPolicies: number;
  totalMonthlyCost: number;
  totalInsuredValue: number;
  expiringPolicies: number;
  expiredPolicies: number;
  activePolicies: number;
  onTotalClick?: () => void;
}

// Utilitário interno para formatar valores – sempre valor completo
const formatValue = (value: number, isCurrency: boolean, isMobile: boolean) => {
  const safe = Number.isFinite(value) ? value : 0;

  if (isCurrency) {
    // Sempre mostrar valor completo com casas decimais, sem abreviações
    return formatCurrency(safe, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Valores inteiros simples
  return safe.toString();
};

export function KPICards(props: KPICardsProps) {
  const isMobile = useIsMobile();

  /* ------------------------------------------------------------------ */
  /*  Construção das "fichas" (cards)                                   */
  /* ------------------------------------------------------------------ */
  const cards = useMemo(() => ([
    {
      title: 'Total',
      value: props.totalPolicies,
      subtitle: 'Apólices',
      icon: FileText,
      bg: 'from-blue-500 to-blue-600',
      isCurrency: false,
      isClickable: true,
      onClick: props.onTotalClick
    },
    {
      title: 'Custo Mensal',
      value: props.totalMonthlyCost,
      subtitle: 'Total mensal',
      icon: DollarSign,
      bg: 'from-green-500 to-green-600',
      isCurrency: true
    },
    {
      title: 'Prêmio Total',
      value: props.totalInsuredValue,
      subtitle: 'Custo anual',
      icon: Shield,
      bg: 'from-purple-500 to-purple-600',
      isCurrency: true
    },
    {
      title: 'Ativas',
      value: props.activePolicies,
      subtitle: 'Em vigor',
      icon: Shield,
      bg: 'from-emerald-500 to-emerald-600',
      isCurrency: false
    },
    {
      title: 'Vencidas',
      value: props.expiredPolicies,
      subtitle: 'Expiradas',
      icon: XCircle,
      bg: 'from-red-500 to-red-600',
      isCurrency: false
    },
    {
      title: 'Vencendo',
      value: props.expiringPolicies,
      subtitle: 'Próximos 30 dias',
      icon: AlertTriangle,
      bg: 'from-orange-500 to-orange-600',
      isCurrency: false
    }
  ]), [props]);

  /* ------------------------------------------------------------------ */
  /*  Renderização                                                       */
  /* ------------------------------------------------------------------ */
  const renderCard = (
    {
      title, value, subtitle, icon: Icon, bg, isCurrency, isClickable, onClick
    }: (typeof cards)[number],
    key: React.Key
  ) => (
    <Card
      key={key}
      className={`bg-gradient-to-r ${bg} text-white border-0 shadow-lg ${
        isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardHeader
        className={`flex flex-row items-center justify-between space-y-0 ${
          isMobile ? 'pb-1 px-3 pt-2' : 'pb-2'
        }`}
      >
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium opacity-90`}>
          {title}
        </CardTitle>
        <Icon className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} opacity-80`} />
      </CardHeader>

      <CardContent className={`${isMobile ? 'pb-2 px-3' : 'pb-4'}`}>
        <div className={`${isMobile ? 'text-sm' : 'text-3xl'} font-bold mb-1 break-words`}>
          {formatValue(value, isCurrency, isMobile)}
        </div>
        <p className="text-xs opacity-80">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );

  /* ------------------------------------------------------------------ */
  /*  Mobile → 2 cards per row                                          */
  /* ------------------------------------------------------------------ */
  if (isMobile) {
    return (
      <div className="w-full px-4">
        <div className="grid grid-cols-2 gap-2">
          {cards.map(renderCard)}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Desktop → 3 cards per row (2 rows)                               */
  /* ------------------------------------------------------------------ */
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(renderCard)}
      </div>
    </div>
  );
}
