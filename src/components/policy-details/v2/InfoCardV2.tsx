import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoRow {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  warn?: boolean;
  action?: React.ReactNode;
}

interface InfoCardV2Props {
  title: string;
  icon: LucideIcon;
  rows?: InfoRow[];
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Card compacto e neutro (light/dark) — base para todos os blocos
 * de detalhes da apólice no novo design.
 */
export const InfoCardV2: React.FC<InfoCardV2Props> = ({
  title,
  icon: Icon,
  rows,
  children,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>

      {rows && rows.length > 0 && (
        <div className="divide-y divide-border/60">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground shrink-0">
                {row.label}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'text-sm font-semibold text-right truncate',
                    row.mono && 'font-mono',
                    row.warn ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
                  )}
                  title={typeof row.value === 'string' ? row.value : undefined}
                >
                  {row.value || '—'}
                </span>
                {row.action}
              </div>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
};
