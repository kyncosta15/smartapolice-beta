import React from 'react';
import { KpiCard } from './KpiCard';
import { LucideIcon } from 'lucide-react';

interface KpiBlockProps {
  title: string;
  totalCard: {
    value: number;
    subtitle: string;
    icon: LucideIcon;
    onClick?: () => void;
  };
  smallCards: Array<{
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    variant: 'open' | 'closed' | 'recent';
    onClick?: () => void;
  }>;
}

export function KpiBlock({ title, totalCard, smallCards }: KpiBlockProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Card grande que ocupa 3 colunas */}
        <KpiCard
          title={title}
          value={totalCard.value}
          subtitle={totalCard.subtitle}
          icon={totalCard.icon}
          variant="total"
          size="large"
          onClick={totalCard.onClick}
          ariaLabel={`Abrir lista de ${title.toLowerCase()}: ${totalCard.value} ${totalCard.subtitle}`}
        />
        
        {/* 3 cards pequenos */}
        {smallCards.map((card, index) => (
          <KpiCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            variant={card.variant}
            size="small"
            onClick={card.onClick}
            ariaLabel={`Abrir ${card.title.toLowerCase()}: ${card.value} ${card.subtitle}`}
          />
        ))}
      </div>
    </div>
  );
}