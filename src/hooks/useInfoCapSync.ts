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

  const syncPolicies = async (documento: string, showToast: boolean = true) => {
    if (!documento || isSyncing) return;

    try {
      // Verificar sessão antes de chamar edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⚠️ Sem sessão ativa - sincronização cancelada');
        return;
      }

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

      if (data?.synced > 0 && showToast) {
        toast({
          title: "Apólices Sincronizadas",
          description: `${userPoliciesCount || data.synced} apólice(s) suas foram encontradas e sincronizadas.`,
          duration: 8000,
          variant: "success",
        });
      } else {
        console.log('ℹ️ Nenhuma apólice nova encontrada');
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

        // Buscar documento do usuário na tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('documento')
          .eq('id', user.id)
          .maybeSingle();

        if (userData?.documento) {
          console.log('🔍 Documento encontrado:', userData.documento);
          console.log('ℹ️ Sincronização automática no login - sem toast');
          // Sincronizar automaticamente sem mostrar toast
          await syncPolicies(userData.documento, false);
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

