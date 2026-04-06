import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstallmentRow {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: 'pago' | 'vencido' | 'a vencer';
  apolice_parcela_id?: string;
}

interface Summary {
  total: number;
  pagas: number;
  atrasadas: number;
  pendentes: number;
  valorTotal: number;
  valorPago: number;
  proximaParcela: { data: string; valor: number } | null;
}

export function usePolicyInstallments(policyId: string) {
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0, pagas: 0, atrasadas: 0, pendentes: 0, valorTotal: 0, valorPago: 0, proximaParcela: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);

    try {
      // Load from apolice_parcelas (primary) and installments (fallback)
      const [apRes, instRes] = await Promise.all([
        supabase
          .from('apolice_parcelas')
          .select('id, numero_parcela, valor, vencimento, status_pagamento')
          .eq('apolice_id', policyId)
          .order('numero_parcela', { ascending: true }),
        supabase
          .from('installments')
          .select('id, numero_parcela, valor, data_vencimento, status')
          .eq('policy_id', policyId)
          .order('numero_parcela', { ascending: true }),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let rows: InstallmentRow[] = [];

      if (apRes.data && apRes.data.length > 0) {
        rows = apRes.data.map((ap: any) => {
          const vencDate = ap.vencimento ? new Date(ap.vencimento + 'T00:00:00') : null;
          const isPago = ap.status_pagamento === 'Pago';
          const isOverdue = !isPago && vencDate && vencDate < today;
          return {
            id: ap.id,
            numero: ap.numero_parcela,
            valor: ap.valor || 0,
            vencimento: ap.vencimento || '',
            status: isPago ? 'pago' as const : isOverdue ? 'vencido' as const : 'a vencer' as const,
            apolice_parcela_id: ap.id,
          };
        });
      } else if (instRes.data && instRes.data.length > 0) {
        rows = instRes.data.map((inst: any) => {
          const vencDate = inst.data_vencimento ? new Date(inst.data_vencimento + 'T00:00:00') : null;
          const isOverdue = vencDate && vencDate < today;
          return {
            id: inst.id,
            numero: inst.numero_parcela ?? 0,
            valor: inst.valor || 0,
            vencimento: inst.data_vencimento || '',
            status: isOverdue ? 'vencido' as const : 'a vencer' as const,
          };
        });
      }

      setInstallments(rows);

      const pagas = rows.filter(r => r.status === 'pago').length;
      const atrasadas = rows.filter(r => r.status === 'vencido').length;
      const pendentes = rows.filter(r => r.status === 'a vencer').length;
      const valorPago = rows.filter(r => r.status === 'pago').reduce((s, r) => s + r.valor, 0);
      const valorTotal = rows.reduce((s, r) => s + r.valor, 0);

      const upcoming = rows
        .filter(r => r.status === 'a vencer' && r.vencimento)
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

      setSummary({
        total: rows.length,
        pagas,
        atrasadas,
        pendentes,
        valorTotal,
        valorPago,
        proximaParcela: upcoming.length > 0 ? { data: upcoming[0].vencimento, valor: upcoming[0].valor } : null,
      });
    } catch (err) {
      console.error('Erro ao carregar parcelas:', err);
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => { load(); }, [load]);

  return { installments, summary, loading, reload: load };
}
