import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  requests: number;
  employees: number;
  companies: number;
}

export function useSyncDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncDashboardData = async (): Promise<SyncResult | null> => {
    setIsSyncing(true);
    
    try {
      // Verificar se o usuário está autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      // Buscar dados do usuário
      const { data: userProfile } = await supabase
        .from('users')
        .select('company')
        .eq('id', userData.user.id)
        .single();

      if (!userProfile?.company) {
        toast.error('Empresa do usuário não encontrada');
        return null;
      }

      // Buscar ID da empresa
      const { data: companyData } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (!companyData) {
        toast.error('Empresa não encontrada no sistema');
        return null;
      }

      console.log(`🔄 Sincronizando dados para empresa: ${userProfile.company} (ID: ${companyData.id})`);

      // Contar requests da empresa
      const { count: requestCount } = await supabase
        .from('requests')
        .select(`
          *,
          employees!inner(company_id)
        `, { count: 'exact', head: true })
        .eq('employees.company_id', companyData.id)
        .not('draft', 'eq', true);

      // Contar employees da empresa
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyData.id);

      // Verificar se há dados recentes (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: recentRequests } = await supabase
        .from('requests')
        .select(`
          *,
          employees!inner(company_id)
        `, { count: 'exact', head: true })
        .eq('employees.company_id', companyData.id)
        .gte('created_at', yesterday.toISOString())
        .not('draft', 'eq', true);

      const syncResult = {
        requests: requestCount || 0,
        employees: employeeCount || 0,
        companies: 1
      };

      console.log(`✅ Sincronização concluída:`, syncResult);
      
      if (recentRequests && recentRequests > 0) {
        toast.success(`✅ Sincronização concluída! ${recentRequests} solicitações recentes encontradas`);
      } else {
        toast.success(`✅ Sincronização concluída! ${requestCount} solicitações no total`);
      }

      return syncResult;

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados do dashboard');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const forceRefresh = async () => {
    try {
      console.log('🔄 Forçando refresh dos dados...');
      
      // Disparar eventos de realtime manualmente
      const channel = supabase.channel('manual-refresh');
      
      // Simular mudança para forçar recarregamento
      channel.send({
        type: 'broadcast',
        event: 'data-refresh',
        payload: { timestamp: new Date().toISOString() }
      });

      // Aguardar um pouco e recarregar a página se necessário
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      toast.success('🔄 Dados sendo atualizados...');
      
    } catch (error) {
      console.error('Erro ao forçar refresh:', error);
      toast.error('Erro ao atualizar dados');
    }
  };

  return {
    syncDashboardData,
    forceRefresh,
    isSyncing
  };
}