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

  const syncPolicies = async (documento: string) => {
    if (!documento || isSyncing) return;

    try {
      setIsSyncing(true);
      console.log('🔄 Iniciando sincronização InfoCap...');

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('sync-infocap', {
        body: { documento },
      });

      if (error) throw error;

      setLastSyncDate(new Date());

      // Contar apólices do usuário no banco após sincronização
      const { count: userPoliciesCount } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (data?.synced > 0) {
        toast({
          title: "Apólices Sincronizadas",
          description: `${userPoliciesCount || data.synced} apólice(s) suas foram encontradas e sincronizadas.`,
          duration: 5000,
        });
      } else {
        console.log('ℹ️ Nenhuma apólice nova encontrada');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na sincronização InfoCap:', error);
      toast({
        title: "Erro na Sincronização",
        description: "Não foi possível sincronizar as apólices do InfoCap.",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronizar automaticamente quando houver um usuário
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        // Verificar se há uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('⚠️ Nenhuma sessão ativa - pulando sincronização');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⚠️ Usuário não encontrado - pulando sincronização');
          return;
        }

        // Buscar documento do usuário na tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('documento')
          .eq('id', user.id)
          .maybeSingle();

        if (userData?.documento) {
          console.log('🔍 Documento encontrado:', userData.documento);
          await syncPolicies(userData.documento);
        } else {
          console.log('⚠️ Usuário sem documento cadastrado - sincronização InfoCap não disponível');
        }
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

