import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  policy: any;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const formatDateBr = (raw?: string | null) => {
  if (!raw) return '—';
  const clean = String(raw).split('T')[0];
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return raw;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
};

export const FinancialCardV2: React.FC<Props> = ({ policy }) => {
  const premiumValue = policy?.valor_premio ?? policy?.premium ?? 0;
  const monthlyValue = policy?.custo_mensal ?? policy?.valor_parcela ?? policy?.monthlyAmount ?? 0;
  const installmentsCount = policy?.quantidade_parcelas || policy?.installments?.length || 1;

  const [parcelas, setParcelas] = useState<{
    paid: number;
    total: number;
    nextDate?: string | null;
  }>({ paid: 0, total: installmentsCount, nextDate: null });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!policy?.id) return;
      const { data } = await supabase
        .from('apolice_parcelas')
        .select('numero_parcela, vencimento, status_pagamento')
        .eq('apolice_id', policy.id)
        .order('numero_parcela', { ascending: true });

      if (!active) return;
      if (data && data.length > 0) {
        const paid = data.filter((p: any) => p.status_pagamento === 'Pago').length;
        const next = data.find((p: any) => p.status_pagamento !== 'Pago');
        setParcelas({
          paid,
          total: data.length,
          nextDate: next?.vencimento || null,
        });
      } else {
        setParcelas({ paid: 0, total: installmentsCount, nextDate: null });
      }
    })();
    return () => {
      active = false;
    };
  }, [policy?.id, installmentsCount]);

  const total = parcelas.total || installmentsCount || 1;
  const paid = Math.min(parcelas.paid, total);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-foreground">Financeiro</h3>
        </div>
        <span className="text-xs text-muted-foreground">{total}x parcelas</span>
      </div>

      {/* Valores */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Prêmio anual
          </div>
          <div className="text-2xl sm:text-[26px] font-bold text-foreground tabular-nums leading-tight truncate">
            {fmtCurrency(premiumValue)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Mensal
          </div>
          <div className="text-base font-semibold text-foreground tabular-nums">
            {fmtCurrency(monthlyValue)}
          </div>
        </div>
      </div>

      {/* Mini progress de parcelas pagas */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              i < paid ? 'bg-emerald-500' : 'bg-muted',
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {paid}/{total} paga{paid === 1 ? '' : 's'}
        </span>
        {parcelas.nextDate && <span>Próxima: {formatDateBr(parcelas.nextDate)}</span>}
      </div>
    </div>
  );
};
