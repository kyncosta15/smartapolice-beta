import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  variant: 'total' | 'open' | 'closed' | 'recent';
  size?: 'large' | 'small';
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

const variantStyles = {
  total: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50',
  open: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200/50 dark:border-amber-700/50',
  closed: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200/50 dark:border-emerald-700/50',
  recent: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/50'
};

const iconColors = {
  total: 'text-slate-600 dark:text-slate-400',
  open: 'text-amber-600 dark:text-amber-400',
  closed: 'text-emerald-600 dark:text-emerald-400',
  recent: 'text-blue-600 dark:text-blue-400'
};

export function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant, 
  size = 'small',
  onClick,
  ariaLabel,
  className 
}: KpiCardProps) {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={cn(
        'rounded-2xl shadow-sm transition-all duration-200',
        variantStyles[variant],
        isClickable && 'cursor-pointer hover:shadow-md hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10',
        size === 'large' && 'xl:col-span-3',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel || `${title}: ${value} ${subtitle}`}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className={cn(
        'p-4',
        size === 'large' && 'p-6'
      )}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={cn(
            'font-medium text-foreground/80',
            size === 'large' ? 'text-lg' : 'text-sm'
          )}>
            {title}
          </h3>
          <Icon className={cn(
            iconColors[variant],
            size === 'large' ? 'h-6 w-6' : 'h-5 w-5'
          )} />
        </div>
        
        <div className="space-y-1">
          <div className={cn(
            'font-bold text-foreground',
            size === 'large' ? 'text-4xl' : 'text-2xl'
          )}>
            {value.toLocaleString('pt-BR')}
          </div>
          <p className={cn(
            'text-muted-foreground',
            size === 'large' ? 'text-base' : 'text-xs'
          )}>
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}