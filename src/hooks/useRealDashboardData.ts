import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RealDashboardMetrics {
  totalPolicies: number;
  uniqueClients: number;
  totalInsurors: number;
  ufDistribution: Array<{ 
    uf: string; 
    count: number; 
    region: string; 
    regionColor: string;
  }>;
  monthlyPremium: number;
  activeUsers: number;
  regionSummary: Array<{
    region: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

// Mapeamento de UF para regiões do Brasil
const UF_TO_REGION = {
  // Norte
  'AC': { region: 'Norte', color: '#10B981' },
  'AP': { region: 'Norte', color: '#10B981' },
  'AM': { region: 'Norte', color: '#10B981' },
  'PA': { region: 'Norte', color: '#10B981' },
  'RO': { region: 'Norte', color: '#10B981' },
  'RR': { region: 'Norte', color: '#10B981' },
  'TO': { region: 'Norte', color: '#10B981' },
  
  // Nordeste
  'AL': { region: 'Nordeste', color: '#F59E0B' },
  'BA': { region: 'Nordeste', color: '#F59E0B' },
  'CE': { region: 'Nordeste', color: '#F59E0B' },
  'MA': { region: 'Nordeste', color: '#F59E0B' },
  'PB': { region: 'Nordeste', color: '#F59E0B' },
  'PE': { region: 'Nordeste', color: '#F59E0B' },
  'PI': { region: 'Nordeste', color: '#F59E0B' },
  'RN': { region: 'Nordeste', color: '#F59E0B' },
  'SE': { region: 'Nordeste', color: '#F59E0B' },
  
  // Centro-Oeste
  'GO': { region: 'Centro-Oeste', color: '#8B5CF6' },
  'MT': { region: 'Centro-Oeste', color: '#8B5CF6' },
  'MS': { region: 'Centro-Oeste', color: '#8B5CF6' },
  'DF': { region: 'Centro-Oeste', color: '#8B5CF6' },
  
  // Sudeste
  'ES': { region: 'Sudeste', color: '#3B82F6' },
  'MG': { region: 'Sudeste', color: '#3B82F6' },
  'RJ': { region: 'Sudeste', color: '#3B82F6' },
  'SP': { region: 'Sudeste', color: '#3B82F6' },
  
  // Sul
  'PR': { region: 'Sul', color: '#EF4444' },
  'RS': { region: 'Sul', color: '#EF4444' },
  'SC': { region: 'Sul', color: '#EF4444' },
} as const;

export function useRealDashboardData() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RealDashboardMetrics>({
    totalPolicies: 0,
    uniqueClients: 0,
    totalInsurors: 0,
    ufDistribution: [],
    monthlyPremium: 0,
    activeUsers: 0,
    regionSummary: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Total de apólices
      const { count: totalPolicies, error: policiesError } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true });

      if (policiesError) throw policiesError;

      // 2. Clientes únicos (total de usuários)
      const { count: uniqueClients, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // 3. Total de seguradoras únicas
      const { data: insurorsData, error: insurorsError } = await supabase
        .from('policies')
        .select('seguradora')
        .not('seguradora', 'is', null);

      if (insurorsError) throw insurorsError;

      const uniqueInsurors = new Set(
        insurorsData
          ?.map(p => p.seguradora?.trim())
          .filter(Boolean)
      ).size;

      // 4. Distribuição por UF
      const { data: ufData, error: ufError } = await supabase
        .from('policies')
        .select('uf')
        .not('uf', 'is', null);

      if (ufError) throw ufError;

      // Processar distribuição por UF
      const ufCounts = ufData?.reduce((acc, policy) => {
        const uf = policy.uf?.trim()?.toUpperCase();
        if (uf && UF_TO_REGION[uf as keyof typeof UF_TO_REGION]) {
          acc[uf] = (acc[uf] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const ufDistribution = Object.entries(ufCounts).map(([uf, count]) => {
        const regionInfo = UF_TO_REGION[uf as keyof typeof UF_TO_REGION];
        return {
          uf,
          count,
          region: regionInfo.region,
          regionColor: regionInfo.color
        };
      });

      // 5. Resumo por região
      const regionCounts = ufDistribution.reduce((acc, item) => {
        acc[item.region] = (acc[item.region] || 0) + item.count;
        return acc;
      }, {} as Record<string, number>);

      const totalUfPolicies = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);
      
      const regionSummary = Object.entries(regionCounts).map(([region, count]) => {
        const regionColor = Object.values(UF_TO_REGION).find(r => r.region === region)?.color || '#6B7280';
        return {
          region,
          count,
          percentage: totalUfPolicies > 0 ? Math.round((count / totalUfPolicies) * 100) : 0,
          color: regionColor
        };
      });

      // 6. Valor mensal médio
      const { data: premiumData, error: premiumError } = await supabase
        .from('policies')
        .select('custo_mensal')
        .not('custo_mensal', 'is', null);

      if (premiumError) throw premiumError;

      const monthlyPremium = premiumData?.reduce((sum, p) => sum + (p.custo_mensal || 0), 0) || 0;

      // 7. Usuários ativos (usuários com status 'active')
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeUsersError) throw activeUsersError;

      setMetrics({
        totalPolicies: totalPolicies || 0,
        uniqueClients: uniqueClients || 0,
        totalInsurors: uniqueInsurors,
        ufDistribution,
        monthlyPremium,
        activeUsers: activeUsers || 0,
        regionSummary
      });

      console.log('📊 Dashboard real data loaded:', {
        totalPolicies,
        uniqueClients,
        totalInsurors: uniqueInsurors,
        ufDistribution: ufDistribution.length,
        monthlyPremium,
        activeUsers
      });

    } catch (err) {
      console.error('❌ Erro ao carregar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}