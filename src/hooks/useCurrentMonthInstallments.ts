import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentMonthInstallment {
  id: string;
  policy_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: string;
  numero_apolice: string;
  segurado: string;
}

export interface CurrentMonthData {
  totalMesAtual: number;
  parcelas: CurrentMonthInstallment[];
  mesVigente: string;
  totalAnualEstimado: number;
  totalAnualReal: number;
}

export function useCurrentMonthInstallments() {
  const { user } = useAuth();
  const [data, setData] = useState<CurrentMonthData>({
    totalMesAtual: 0,
    parcelas: [],
    mesVigente: '',
    totalAnualEstimado: 0,
    totalAnualReal: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentMonthInstallments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar RPC que calcula tudo no banco em uma única query
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('get_dashboard_kpis', { p_user_id: user.id });
      
      if (rpcError) {
        console.error('❌ Erro na RPC get_dashboard_kpis:', rpcError);
        throw rpcError;
      }

      const result = rpcResult as any;
      
      setData({
        totalMesAtual: result.totalMesAtual || 0,
        parcelas: (result.parcelas || []).map((p: any) => ({
          id: p.id,
          policy_id: p.policy_id,
          numero_parcela: p.numero_parcela,
          valor: p.valor || 0,
          data_vencimento: p.data_vencimento,
          status: p.status,
          numero_apolice: p.numero_apolice || '',
          segurado: p.segurado || '',
        })),
        mesVigente: result.mesVigente || '',
        totalAnualEstimado: (result.totalMesAtual || 0) * 12,
        totalAnualReal: result.totalAnualReal || 0,
      });

    } catch (err) {
      console.error('❌ Erro ao carregar KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMonthInstallments();
  }, [user?.id]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCurrentMonthInstallments,
  };
}
