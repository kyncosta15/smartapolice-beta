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
  // Soma de todas as parcelas do mês atual
  totalMesAtual: number;
  // Lista de parcelas do mês
  parcelas: CurrentMonthInstallment[];
  // Mês/ano vigente para exibição
  mesVigente: string;
  // Ano/mês para cálculo anual (soma x 12 baseado no mês atual)
  totalAnualEstimado: number;
  // Total real das parcelas de todos os meses
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
      // Buscar parcelas do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Formatar mês vigente para exibição (ex: "Fevereiro 2026")
      const mesVigente = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      console.log('🔍 [CurrentMonth] Buscando parcelas do mês:', {
        firstDayOfMonth: firstDayOfMonth.toISOString().split('T')[0],
        firstDayOfNextMonth: firstDayOfNextMonth.toISOString().split('T')[0]
      });
      
      // Query para buscar parcelas do mês atual
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('installments')
        .select(`
          id,
          policy_id,
          numero_parcela,
          valor,
          data_vencimento,
          status,
          policies (
            numero_apolice,
            segurado,
            status
          )
        `)
        .gte('data_vencimento', firstDayOfMonth.toISOString().split('T')[0])
        .lt('data_vencimento', firstDayOfNextMonth.toISOString().split('T')[0]);
      
      if (parcelasError) {
        console.error('❌ Erro ao buscar parcelas do mês:', parcelasError);
        throw parcelasError;
      }

      console.log('📊 [CurrentMonth] Parcelas encontradas:', parcelasData?.length || 0);

      // Filtrar apenas apólices vigentes no JS
      const parcelasVigentes = (parcelasData || []).filter((p: any) => {
        const policyStatus = p.policies?.status?.toLowerCase();
        return policyStatus === 'vigente' || policyStatus === 'ativa' || policyStatus === 'vencendo';
      });

      // Calcular total do mês atual
      const parcelas: CurrentMonthInstallment[] = parcelasVigentes.map((p: any) => ({
        id: p.id,
        policy_id: p.policy_id,
        numero_parcela: p.numero_parcela,
        valor: p.valor || 0,
        data_vencimento: p.data_vencimento,
        status: p.status,
        numero_apolice: p.policies?.numero_apolice || '',
        segurado: p.policies?.segurado || '',
      }));

      const totalMesAtual = parcelas.reduce((sum, p) => sum + (p.valor || 0), 0);
      
      // Buscar total anual real (soma de todas as parcelas de apólices vigentes)
      const { data: allInstallmentsData, error: totalAnualError } = await supabase
        .from('installments')
        .select(`
          valor,
          policies (
            status
          )
        `);
      
      if (totalAnualError) {
        console.error('❌ Erro ao calcular total anual:', totalAnualError);
      }
      
      // Filtrar apenas apólices vigentes e somar
      const totalAnualReal = (allInstallmentsData || [])
        .filter((p: any) => {
          const policyStatus = p.policies?.status?.toLowerCase();
          return policyStatus === 'vigente' || policyStatus === 'ativa' || policyStatus === 'vencendo';
        })
        .reduce((sum, p: any) => sum + (p.valor || 0), 0);
      
      console.log('📊 [CurrentMonth] Parcelas do mês atual:', {
        mesVigente,
        qtdParcelas: parcelas.length,
        totalMesAtual,
        totalAnualReal,
        parcelas: parcelas.map(p => ({ 
          apolice: p.numero_apolice, 
          valor: p.valor,
          vencimento: p.data_vencimento 
        }))
      });

      setData({
        totalMesAtual,
        parcelas,
        mesVigente,
        totalAnualEstimado: totalMesAtual * 12,
        totalAnualReal,
      });

    } catch (err) {
      console.error('❌ Erro ao carregar parcelas do mês:', err);
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
