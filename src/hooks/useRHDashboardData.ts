import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';

interface KPIData {
  vidasAtivas: number;
  custoMensal: number;
  custoMedioVida: number;
  ticketsAbertos: number;
}

interface Renewal {
  id: string;
  employee_name: string;
  plan_name: string;
  end_date: string;
  days_remaining: number;
  monthly_premium: number;
}

interface SolicitacaoStatus {
  status: string;
  count: number;
}

interface WaterfallData {
  category: string;
  value: number;
  type: 'baseline' | 'reduction' | 'addition' | 'final';
}

export function useRHDashboardData() {
  const [kpis, setKpis] = useState<KPIData>({
    vidasAtivas: 0,
    custoMensal: 0,
    custoMedioVida: 0,
    ticketsAbertos: 0
  });
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [solicitacoesStatus, setSolicitacoesStatus] = useState<SolicitacaoStatus[]>([]);
  const [waterfallData, setWaterfallData] = useState<WaterfallData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      // Vidas ativas
      const { count: vidasAtivas } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Custo mensal (soma dos employee_plans ativos)
      const { data: plansData } = await supabase
        .from('employee_plans')
        .select('monthly_premium')
        .eq('status', 'ativo')
        .is('end_date', null);

      const custoMensal = plansData?.reduce((sum, plan) => sum + Number(plan.monthly_premium), 0) || 0;

      // Tickets abertos
      const { count: ticketsAbertos } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aberto', 'enviado', 'processando']);

      const custoMedioVida = vidasAtivas ? custoMensal / vidasAtivas : 0;

      setKpis({
        vidasAtivas: vidasAtivas || 0,
        custoMensal,
        custoMedioVida,
        ticketsAbertos: ticketsAbertos || 0
      });
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError('Erro ao carregar KPIs');
    }
  };

  const fetchRenewals = async () => {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)); // +60 dias

      const { data } = await supabase
        .from('employee_plans')
        .select(`
          id,
          end_date,
          monthly_premium,
          employees!inner(full_name),
          plans!inner(name)
        `)
        .eq('status', 'ativo')
        .not('end_date', 'is', null)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      const renewalsData = data?.map(item => {
        const endDate = new Date(item.end_date!);
        const diffTime = endDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          employee_name: (item.employees as any).full_name,
          plan_name: (item.plans as any).name,
          end_date: item.end_date!,
          days_remaining: daysRemaining,
          monthly_premium: Number(item.monthly_premium)
        };
      }) || [];

      setRenewals(renewalsData);
    } catch (err) {
      console.error('Error fetching renewals:', err);
      setError('Erro ao carregar vencimentos');
    }
  };

  const fetchSolicitacoesStatus = async () => {
    try {
      const { data } = await supabase
        .from('requests')
        .select('status')
        .not('draft', 'eq', true);

      const statusCounts = data?.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      setSolicitacoesStatus(statusData);
    } catch (err) {
      console.error('Error fetching solicitações status:', err);
      setError('Erro ao carregar status das solicitações');
    }
  };

  const fetchWaterfallData = async () => {
    // Dados sintéticos para o gráfico waterfall
    const mockData: WaterfallData[] = [
      { category: 'Sem Gestão', value: 150000, type: 'baseline' },
      { category: 'Renegociação', value: -25000, type: 'reduction' },
      { category: 'Otimização', value: -15000, type: 'reduction' },
      { category: 'Coparticipação', value: -8000, type: 'reduction' },
      { category: 'Reajustes', value: 12000, type: 'addition' },
      { category: 'Com SmartBenefícios', value: 114000, type: 'final' }
    ];
    
    setWaterfallData(mockData);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchKPIs(),
        fetchRenewals(),
        fetchSolicitacoesStatus(),
        fetchWaterfallData()
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Realtime subscriptions
  useRealtime(loadData, [
    { table: 'employees' },
    { table: 'employee_plans' },
    { table: 'requests' },
    { table: 'tickets' }
  ]);

  return {
    kpis,
    renewals,
    solicitacoesStatus,
    waterfallData,
    isLoading,
    error,
    refetch: loadData
  };
}