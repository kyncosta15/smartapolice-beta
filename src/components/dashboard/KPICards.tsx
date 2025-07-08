import React, { useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Carousel, CarouselContent, CarouselItem,
  CarouselNext, CarouselPrevious
} from '@/components/ui/carousel';
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
}

// Utilitário interno para formatar valores – unificado:
const formatValue = (value: number, isCurrency: boolean, isMobile: boolean) => {
  const safe = Number.isFinite(value) ? value : 0;

  if (isCurrency) {
    // Sempre sem abreviações; no mobile tira centavos p/ caber melhor
    return formatCurrency(safe, {
      minimumFractionDigits: 0,
      maximumFractionDigits: isMobile ? 0 : 0 // ajuste fácil se quiser 2 no desktop
    });
  }

  // Valores inteiros simples
  return safe.toString();
};

export function KPICards(props: KPICardsProps) {
  const isMobile = useIsMobile();

  /* ------------------------------------------------------------------ */
  /*  Construção das “fichas” (cards)                                   */
  /* ------------------------------------------------------------------ */
  const cards = useMemo(() => ([
    {
      title: 'Total',
      value: props.totalPolicies,
      subtitle: 'Apólices',
      icon: FileText,
      bg: 'from-blue-500 to-blue-600',
      isCurrency: false
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
      title: 'Valor Segurado',
      value: props.totalInsuredValue,
      subtitle: 'Cobertura total',
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
      title, value, subtitle, icon: Icon, bg, isCurrency
    }: (typeof cards)[number],
    key: React.Key
  ) => (
    <Card
      key={key}
      className={`bg-gradient-to-r ${bg} text-white border-0 shadow-lg`}
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
  /*  Mobile → 2 cards por slide                                         */
  /* ------------------------------------------------------------------ */
  if (isMobile) {
    const pairs = Array.from({ length: Math.ceil(cards.length / 2) },
      (_, i) => cards.slice(i * 2, i * 2 + 2));

    return (
      <div className="w-full px-4">
        <Carousel className="w-full">
          <CarouselContent className="-ml-2">
            {pairs.map((pair, idx) => (
              <CarouselItem key={idx} className="pl-2">
                <div className="grid grid-cols-2 gap-2">
                  {pair.map(renderCard)}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-0 h-8 w-8 -ml-4" />
          <CarouselNext className="right-0 h-8 w-8 -mr-4" />
        </Carousel>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Desktop → 3 cards por slide                                        */
  /* ------------------------------------------------------------------ */
  const groups = Array.from({ length: Math.ceil(cards.length / 3) },
    (_, i) => cards.slice(i * 3, i * 3 + 3));

  return (
    <div className="w-full px-4">
      <Carousel className="w-full">
        <CarouselContent>
          {groups.map((group, idx) => (
            <CarouselItem key={idx}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.map(renderCard)}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
