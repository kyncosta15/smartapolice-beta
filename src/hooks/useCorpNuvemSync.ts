import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CorpNuvemSyncService } from '@/services/corpnuvemSyncService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para sincronizar apólices da API CorpNuvem automaticamente
 * quando o usuário loga com CPF/CNPJ
 */
export function useCorpNuvemSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const syncPolicies = async (userDocument: string) => {
    if (!userDocument || isSyncing) return;

    try {
      setIsSyncing(true);

      // Verificar se precisa sincronizar
      const needsSync = await CorpNuvemSyncService.needsSync(userDocument);
      
      if (!needsSync) {
        console.log('⏭️ Sincronização não necessária (última sync < 24h)');
        return;
      }

      console.log('🔄 Iniciando sincronização automática...');
      
      const count = await CorpNuvemSyncService.syncUserPolicies(userDocument);
      
      setLastSyncDate(new Date());

      if (count > 0) {
        toast({
          title: "Apólices Sincronizadas",
          description: `${count} apólice(s) da API foram vinculadas à sua conta.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática:', error);
      // Não mostrar toast de erro para não incomodar o usuário
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronizar automaticamente quando o usuário loga
  useEffect(() => {
    const checkAndSync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar CPF/CNPJ do usuário na tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('documento')
        .eq('id', user.id)
        .single();

      if (userData?.documento) {
        console.log('🔍 Documento encontrado, iniciando sincronização automática...');
        await syncPolicies(userData.documento);
      } else {
        console.log('⚠️ Nenhum documento cadastrado para este usuário');
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

