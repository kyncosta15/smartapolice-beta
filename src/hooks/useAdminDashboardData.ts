import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminMetrics {
  // Métricas básicas
  totalPolicies: number;
  totalUsers: number;
  totalInsurers: number;
  activeUsers: number;
  
  // Distribuição por tipo de pessoa
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
  
  // Distribuição por seguradora
  insurerDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  
  // Distribuição por UF
  ufDistribution: Array<{
    uf: string;
    count: number;
    region: string;
  }>;
  
  // Crescimento mensal
  monthlyGrowth: Array<{
    month: string;
    policies: number;
    users: number;
  }>;
  
  // Valores financeiros
  financialMetrics: {
    totalMonthlyPremium: number;
    averagePolicyValue: number;
    totalAnnualValue: number;
  };
  
  // Apólices recentes
  recentPolicies: Array<{
    id: string;
    segurado: string;
    seguradora: string;
    tipo_seguro: string;
    custo_mensal: number;
    created_at: string;
  }>;
  
  // Novos usuários (últimos 30 dias)
  newUsersLast30Days: number;
  newPoliciesLast30Days: number;
}

// Mapeamento UF para região
const UF_TO_REGION = {
  // Norte
  'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
  // Nordeste  
  'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
  // Centro-Oeste
  'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'DF': 'Centro-Oeste',
  // Sudeste
  'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  // Sul
  'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul',
} as const;

export function useAdminDashboardData() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalPolicies: 0,
    totalUsers: 0,
    totalInsurers: 0,
    activeUsers: 0,
    personTypeDistribution: { pessoaFisica: 0, pessoaJuridica: 0 },
    insurerDistribution: [],
    ufDistribution: [],
    monthlyGrowth: [],
    financialMetrics: {
      totalMonthlyPremium: 0,
      averagePolicyValue: 0,
      totalAnnualValue: 0,
    },
    recentPolicies: [],
    newUsersLast30Days: 0,
    newPoliciesLast30Days: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminMetrics = async () => {
    if (!user?.id || user.role !== 'administrador') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Métricas básicas
      const [
        { count: totalPolicies },
        { count: totalUsers },
        { count: activeUsers },
        { data: insurersData },
        { data: ufData },
        { data: personTypeData },
        { data: financialData },
        { data: recentPoliciesData },
        { data: monthlyData },
      ] = await Promise.all([
        // Total de apólices
        supabase.from('policies').select('*', { count: 'exact', head: true }),
        
        // Total de usuários
        supabase.from('users').select('*', { count: 'exact', head: true }),
        
        // Usuários ativos
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        
        // Dados de seguradoras - melhorar query para não incluir valores nulos/vazios
        supabase.from('policies')
          .select('seguradora')
          .not('seguradora', 'is', null)
          .neq('seguradora', ''),
        
        // Dados de UF
        supabase.from('policies').select('uf').not('uf', 'is', null),
        
        // Dados de tipo de pessoa
        supabase.from('policies').select('documento_tipo').not('documento_tipo', 'is', null),
        
        // Dados financeiros
        supabase.from('policies').select('custo_mensal').not('custo_mensal', 'is', null),
        
        // Apólices recentes
        supabase.from('policies')
          .select('id, segurado, seguradora, tipo_seguro, custo_mensal, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
          
        // Dados mensais para crescimento
        supabase.from('policies').select('created_at').order('created_at', { ascending: false }),
      ]);

      // Processar seguradoras únicas
      console.log('🏢 Dados brutos das seguradoras:', insurersData);
      
      const insurerCounts = insurersData?.reduce((acc, item) => {
        const insurer = item.seguradora?.trim();
        console.log('🔍 Processando seguradora:', { original: item.seguradora, trimmed: insurer });
        if (insurer && insurer !== '') {
          acc[insurer] = (acc[insurer] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};
      
      console.log('📊 Contagem final de seguradoras:', insurerCounts);
      console.log('🔢 Total de seguradoras únicas:', Object.keys(insurerCounts).length);
      
      const totalInsurerPolicies = Object.values(insurerCounts).reduce((sum, count) => sum + count, 0);
      const insurerDistribution = Object.entries(insurerCounts).map(([name, value]) => ({
        name,
        value,
        percentage: totalInsurerPolicies > 0 ? Math.round((value / totalInsurerPolicies) * 100) : 0,
      }));

      // Processar distribuição por UF
      const ufCounts = ufData?.reduce((acc, item) => {
        const uf = item.uf?.trim()?.toUpperCase();
        if (uf && UF_TO_REGION[uf as keyof typeof UF_TO_REGION]) {
          acc[uf] = (acc[uf] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const ufDistribution = Object.entries(ufCounts).map(([uf, count]) => ({
        uf,
        count,
        region: UF_TO_REGION[uf as keyof typeof UF_TO_REGION] || 'Não identificado',
      }));

      // Processar tipo de pessoa
      const personTypeCounts = personTypeData?.reduce((acc, item) => {
        const docType = item.documento_tipo?.trim()?.toUpperCase();
        if (docType === 'CPF') {
          acc.pessoaFisica++;
        } else if (docType === 'CNPJ') {
          acc.pessoaJuridica++;
        }
        return acc;
      }, { pessoaFisica: 0, pessoaJuridica: 0 }) || { pessoaFisica: 0, pessoaJuridica: 0 };

      // Calcular métricas financeiras
      const monthlyValues = financialData?.map(item => item.custo_mensal || 0) || [];
      const totalMonthlyPremium = monthlyValues.reduce((sum, value) => sum + value, 0);
      const averagePolicyValue = monthlyValues.length > 0 ? totalMonthlyPremium / monthlyValues.length : 0;
      const totalAnnualValue = totalMonthlyPremium * 12;

      // Processar crescimento mensal
      const monthlyGrowth = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        const monthPolicies = monthlyData?.filter(item => {
          const createdAt = new Date(item.created_at);
          return createdAt >= date && createdAt < nextMonth;
        }).length || 0;

        monthlyGrowth.push({
          month: monthName,
          policies: monthPolicies,
          users: 0, // Seria necessária outra query para usuários por mês
        });
      }

      // Calcular novos registros nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newPoliciesLast30Days = monthlyData?.filter(item => 
        new Date(item.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Buscar novos usuários (seria necessária uma query separada)
      const { count: newUsersLast30Days } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      setMetrics({
        totalPolicies: totalPolicies || 0,
        totalUsers: totalUsers || 0,
        totalInsurers: Object.keys(insurerCounts).length,
        activeUsers: activeUsers || 0,
        personTypeDistribution: personTypeCounts,
        insurerDistribution,
        ufDistribution,
        monthlyGrowth,
        financialMetrics: {
          totalMonthlyPremium,
          averagePolicyValue,
          totalAnnualValue,
        },
        recentPolicies: recentPoliciesData || [],
        newUsersLast30Days: newUsersLast30Days || 0,
        newPoliciesLast30Days,
      });

      console.log('📊 Métricas finais calculadas:', {
        totalPolicies: totalPolicies || 0,
        totalUsers: totalUsers || 0,
        totalInsurers: Object.keys(insurerCounts).length,
        activeUsers: activeUsers || 0,
        newPoliciesLast30Days,
        insurerDistribution: insurerDistribution.length,
        insurerCounts: Object.keys(insurerCounts)
      });

    } catch (err) {
      console.error('❌ Erro ao carregar métricas administrativas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar realtime para atualizações automáticas
  useEffect(() => {
    if (user?.role !== 'administrador') return;

    // Carregar dados iniciais
    fetchAdminMetrics();

    // Configurar realtime para tabela policies
    const policiesChannel = supabase
      .channel('admin-policies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies'
        },
        (payload) => {
          console.log('📊 Política alterada, recarregando métricas...', payload);
          fetchAdminMetrics();
        }
      )
      .subscribe();

    // Configurar realtime para tabela users
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('👥 Usuário alterado, recarregando métricas...', payload);
          fetchAdminMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(policiesChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [user?.id, user?.role]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchAdminMetrics
  };
}