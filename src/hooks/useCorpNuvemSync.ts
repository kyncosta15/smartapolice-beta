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

  const syncPolicies = async (userDocument: string, showToast: boolean = true, force: boolean = false) => {
    if (!userDocument || isSyncing) return;

    try {
      setIsSyncing(true);

      // Verificar se precisa sincronizar (a menos que seja forçado)
      let needsSync = true;
      if (!force) {
        needsSync = await CorpNuvemSyncService.needsSync(userDocument);
      }
      
      if (!needsSync) {
        console.log('⏭️ Sincronização não necessária (última sync < 24h)');
        return;
      }

      console.log(`🔄 Iniciando sincronização para documento ${userDocument}...`);
      
      const count = await CorpNuvemSyncService.syncUserPolicies(userDocument);
      
      setLastSyncDate(new Date());

      if (count > 0 && showToast) {
        toast({
          title: "Apólices Sincronizadas",
          description: `${count} apólice(s) da API foram vinculadas à sua conta.`,
          duration: 8000,
          variant: "success",
        });
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática:', error);
      // Não mostrar toast de erro para não incomodar o usuário
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllLinkedDocuments = async (showToast: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar CPF/CNPJ do usuário principal
      const { data: userData } = await supabase
        .from('users')
        .select('documento')
        .eq('id', user.id)
        .single();

      // Buscar TODOS os CPFs/CNPJs vinculados
      const { data: vinculos } = await supabase
        .from('user_cpf_vinculos')
        .select('cpf')
        .eq('user_id', user.id)
        .eq('ativo', true);

      const documentosParaSincronizar: string[] = [];
      
      if (userData?.documento) {
        documentosParaSincronizar.push(userData.documento);
      }
      
      if (vinculos && vinculos.length > 0) {
        vinculos.forEach(v => {
          if (v.cpf) {
            documentosParaSincronizar.push(v.cpf);
          }
        });
      }

      if (documentosParaSincronizar.length === 0) {
        if (showToast) {
          toast({
            title: "Nenhum documento vinculado",
            description: "Adicione CPFs/CNPJs para sincronizar apólices.",
            variant: "destructive",
          });
        }
        return;
      }

      console.log(`🔄 Sincronizando ${documentosParaSincronizar.length} documento(s) vinculado(s)...`);
      let totalSynced = 0;

      for (const doc of documentosParaSincronizar) {
        const count = await CorpNuvemSyncService.syncUserPolicies(doc);
        totalSynced += count;
      }

      if (showToast) {
        toast({
          title: "Sincronização Completa",
          description: `${totalSynced} apólice(s) sincronizadas de ${documentosParaSincronizar.length} documento(s).`,
          duration: 8000,
          variant: "success",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar documentos vinculados:', error);
      if (showToast) {
        toast({
          title: "Erro na Sincronização",
          description: "Não foi possível sincronizar todas as apólices.",
          variant: "destructive",
        });
      }
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

      // Buscar TODOS os CPFs/CNPJs vinculados
      const { data: vinculos } = await supabase
        .from('user_cpf_vinculos')
        .select('cpf')
        .eq('user_id', user.id)
        .eq('ativo', true);

      const documentosParaSincronizar: string[] = [];
      
      if (userData?.documento) {
        documentosParaSincronizar.push(userData.documento);
      }
      
      if (vinculos && vinculos.length > 0) {
        vinculos.forEach(v => {
          if (v.cpf) {
            documentosParaSincronizar.push(v.cpf);
          }
        });
      }

      if (documentosParaSincronizar.length > 0) {
        console.log(`🔍 ${documentosParaSincronizar.length} documento(s) encontrado(s), iniciando sincronização...`);
        // Sincronizar apólices para cada documento vinculado
        for (const doc of documentosParaSincronizar) {
          await syncPolicies(doc, false);
        }
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
    syncAllLinkedDocuments,
  };
}

