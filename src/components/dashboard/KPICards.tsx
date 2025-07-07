
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FileText, DollarSign, Shield, AlertTriangle, XCircle, Clock } from 'lucide-react';
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

export function KPICards({ totalPolicies, totalMonthlyCost, totalInsuredValue, expiringPolicies, expiredPolicies, activePolicies }: KPICardsProps) {
  const isMobile = useIsMobile();

  const allCards = [
    {
      title: "Total",
      value: totalPolicies,
      displayValue: totalPolicies.toString(),
      subtitle: "Apólices",
      icon: FileText,
      bgColor: "from-blue-500 to-blue-600"
    },
    {
      title: "Custo Mensal",
      value: totalMonthlyCost,
      displayValue: formatCurrency(totalMonthlyCost),
      subtitle: "Total mensal",
      icon: DollarSign,
      bgColor: "from-green-500 to-green-600"
    },
    {
      title: "Valor Segurado",
      value: totalInsuredValue,
      displayValue: formatCurrency(totalInsuredValue),
      subtitle: "Cobertura total",
      icon: Shield,
      bgColor: "from-purple-500 to-purple-600"
    },
    {
      title: "Ativas",
      value: activePolicies,
      displayValue: activePolicies.toString(),
      subtitle: "Em vigor",
      icon: Shield,
      bgColor: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Vencidas",
      value: expiredPolicies,
      displayValue: expiredPolicies.toString(),
      subtitle: "Expiradas",
      icon: XCircle,
      bgColor: "from-red-500 to-red-600"
    },
    {
      title: "Vencendo",
      value: expiringPolicies,
      displayValue: expiringPolicies.toString(),
      subtitle: "Próximos 30 dias",
      icon: AlertTriangle,
      bgColor: "from-orange-500 to-orange-600"
    }
  ];

  const renderCard = (card: any, index: number) => (
    <Card key={index} className={`bg-gradient-to-r ${card.bgColor} text-white border-0 shadow-lg`}>
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-2' : 'pb-2'}`}>
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium opacity-90`}>
          {card.title}
        </CardTitle>
        <card.icon className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} opacity-80`} />
      </CardHeader>
      <CardContent className={`${isMobile ? 'pb-2 px-3' : 'pb-4'}`}>
        <div className={`${isMobile ? 'text-lg' : 'text-3xl'} font-bold mb-1`}>
          {card.displayValue}
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-80`}>
          {card.subtitle}
        </p>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    // Mobile: 2 cards per slide
    const cardPairs = [];
    for (let i = 0; i < allCards.length; i += 2) {
      cardPairs.push(allCards.slice(i, i + 2));
    }

    return (
      <div className="w-full px-1">
        <Carousel className="w-full">
          <CarouselContent className="-ml-1">
            {cardPairs.map((pair, index) => (
              <CarouselItem key={index} className="pl-1">
                <div className="grid grid-cols-2 gap-2">
                  {pair.map((card, cardIndex) => 
                    renderCard(card, index * 2 + cardIndex)
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1 h-6 w-6" />
          <CarouselNext className="right-1 h-6 w-6" />
        </Carousel>
      </div>
    );
  }

  // Desktop: 3 cards per slide
  const cardGroups = [];
  for (let i = 0; i < allCards.length; i += 3) {
    cardGroups.push(allCards.slice(i, i + 3));
  }

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent>
          {cardGroups.map((group, index) => (
            <CarouselItem key={index}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.map((card, cardIndex) => 
                  renderCard(card, index * 3 + cardIndex)
                )}
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
