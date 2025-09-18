import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  gradient: string;
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  gradient,
  icon: Icon,
  onClick,
  ariaLabel,
  isLoading = false
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={`min-h-[140px] bg-gradient-to-br ${gradient} dark:from-white/5 dark:to-white/0`}>
        <div className="p-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-12 w-16 mb-2" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`min-h-[140px] bg-gradient-to-br ${gradient} dark:from-white/5 dark:to-white/0 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]`}
    >
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className="w-full h-full p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {title}
          </h4>
          <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </div>
        
        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
      </button>
    </Card>
  );
}