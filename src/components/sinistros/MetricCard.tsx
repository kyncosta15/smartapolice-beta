import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  variant: 'total' | 'aberto' | 'finalizado' | 'assistencia';
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  variant,
  icon: Icon,
  onClick,
  ariaLabel,
  isLoading = false
}: MetricCardProps) {
  const variantStyles = {
    total: 'bg-blue-500 hover:bg-blue-600',
    assistencia: 'bg-blue-500 hover:bg-blue-600', 
    aberto: 'bg-red-500 hover:bg-red-600',
    finalizado: 'bg-orange-500 hover:bg-orange-600'
  };

  if (isLoading) {
    return (
      <Card className={`min-h-[120px] ${variantStyles[variant]} text-white`}>
        <div className="p-4 sm:p-6">
          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-2 bg-white/20" />
          <Skeleton className="h-8 sm:h-12 w-12 sm:w-16 mb-2 bg-white/20" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`min-h-[120px] ${variantStyles[variant]} shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.99] border-0`}
    >
        <button
          onClick={onClick}
          aria-label={ariaLabel}
          className="w-full h-full p-4 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-lg text-white"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white opacity-90" />
            <h4 className="text-xs sm:text-sm font-semibold text-white opacity-90 uppercase tracking-wide">
              {title}
            </h4>
          </div>
          
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
            {value}
          </div>
          
          <div className="text-xs sm:text-sm text-white/80">
            {variant === 'total' ? 'Total registrado' : 
             variant === 'aberto' ? 'Necessitam atenção' : 
             'Processados'}
          </div>
        </button>
    </Card>
  );
}