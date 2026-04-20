import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/** Skeleton genérico de cabeçalho + grade de campos (usado em abas tipo "Info"). */
export function FormSectionSkeleton({ rows = 2, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <Card className="p-5 md:p-6 space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Skeleton para listas de cards (sinistros, manutenções, documentos). */
export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Skeleton para KPIs/resumo (camada 1 — rápida). */
export function KpiRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </Card>
      ))}
    </div>
  );
}

/** Skeleton genérico de "tab" inteira: KPIs + Lista. */
export function TabSkeleton() {
  return (
    <div className="space-y-4">
      <KpiRowSkeleton count={3} />
      <ListSkeleton items={3} />
    </div>
  );
}
