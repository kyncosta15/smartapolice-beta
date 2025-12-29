import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para sincronizar apólices do InfoCap automaticamente ao login
 */
export function useInfoCapSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { toast } = useToast();

  /**
   * Sincroniza apólices do InfoCap
   * @param documento - Documento principal (pode ser null/vazio se tiver vínculos)
   * @param showToast - Se deve mostrar toast de resultado
   */
  const syncPolicies = async (documento: string | null = null, showToast: boolean = true) => {
    if (isSyncing) {
      console.log('⚠️ Sincronização já em andamento');
      return;
    }

    try {
      // Verificar sessão antes de chamar edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⚠️ Sem sessão ativa - sincronização cancelada');
        return;
      }

      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização InfoCap...');
      console.log(`📄 Documento principal: ${documento || '(nenhum)'}`);

      // Chamar edge function - ela buscará os vínculos automaticamente
      const { data, error } = await supabase.functions.invoke('sync-infocap', {
        body: { documento: documento || '' },
      });

      if (error) throw error;

      setLastSyncDate(new Date());

      // Contar apólices do usuário no banco após sincronização
      const { data: { user } } = await supabase.auth.getUser();
      const { count: userPoliciesCount } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      console.log(`📊 Resultado: ${data?.synced || 0} apólices sincronizadas de ${data?.documentos || 0} documentos`);

      if (showToast) {
        if (data?.synced > 0) {
          toast({
            title: "Apólices Sincronizadas",
            description: `${userPoliciesCount || data.synced} apólice(s) encontradas de ${data?.documentos || 1} documento(s).`,
            duration: 8000,
            variant: "success",
          });
        } else if (data?.documentos > 0) {
          toast({
            title: "Sincronização Concluída",
            description: "Nenhuma apólice nova encontrada.",
            duration: 5000,
          });
        } else {
          toast({
            title: "Nenhum Documento",
            description: "Vincule um CPF/CNPJ nas configurações para sincronizar.",
            duration: 5000,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na sincronização InfoCap:', error);
      if (showToast) {
        toast({
          title: "Erro na Sincronização",
          description: "Não foi possível sincronizar as apólices do InfoCap.",
          variant: "destructive",
          duration: 8000,
        });
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronizar automaticamente quando houver um usuário (desativado para permitir sincronização manual)
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        // Verificar se há uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('⚠️ Nenhuma sessão ativa - pulando sincronização automática');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⚠️ Usuário não encontrado - pulando sincronização automática');
          return;
        }

        // Buscar documento do usuário na tabela users (pode ser null)
        const { data: userData } = await supabase
          .from('users')
          .select('documento')
          .eq('id', user.id)
          .maybeSingle();

        console.log('🔍 Documento principal:', userData?.documento || '(nenhum)');
        console.log('ℹ️ Sincronização automática no login - sem toast');
        
        // Sincronizar automaticamente - mesmo sem documento principal
        // A edge function buscará os CPFs vinculados automaticamente
        await syncPolicies(userData?.documento || null, false);
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
      }
    };

    checkAndSync();
  }, []);

  return {
    isSyncing,
    lastSyncDate,
    syncPolicies,
  };
}

