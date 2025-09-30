import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  variant: 'total' | 'aberto' | 'finalizado' | 'assistencia';
  icon: LucideIcon;
  onClick?: () => void;
  ariaLabel?: string;
  isLoading?: boolean;
  pulse?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  variant, 
  icon: Icon, 
  onClick,
  ariaLabel,
  isLoading = false,
  pulse = false
}: MetricCardProps) {
  const variantStyles = {
    total: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-gray-900 dark:text-white'
    },
    aberto: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-orange-200 dark:border-orange-700',
      icon: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      valueColor: 'text-orange-600 dark:text-orange-400'
    },
    finalizado: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-green-200 dark:border-green-700',
      icon: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      valueColor: value === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-green-600 dark:text-green-400'
    },
    assistencia: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-gray-900 dark:text-white'
    },
  };

  const style = variantStyles[variant];

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-10 w-16 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border rounded-2xl shadow-md transition-all duration-300",
        style.bg,
        style.border,
        onClick && "cursor-pointer hover:shadow-xl hover:-translate-y-1",
        pulse && variant === 'aberto' && "animate-pulse"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", style.icon)}>
            <Icon className={cn("h-6 w-6", style.iconColor)} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={cn("text-3xl font-bold", style.valueColor)}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
