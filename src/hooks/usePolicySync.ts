
import { useState, useEffect, useCallback } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyPersistenceService } from '@/services/policyPersistenceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePolicySync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  // Função para sincronizar uma política específica com o banco
  const syncPolicyToDatabase = useCallback(async (
    policy: ParsedPolicyData, 
    file?: File
  ): Promise<boolean> => {
    if (!user?.id) {
      console.error('❌ usePolicySync: Usuário não autenticado para sincronização');
      return false;
    }

    console.log(`🔄 Sincronizando política com o banco: ${policy.name}`);
    setSyncStatus('syncing');

    try {
      // Se há arquivo, fazer persistência completa
      if (file) {
        const success = await PolicyPersistenceService.savePolicyComplete(
          file, 
          policy, 
          user.id
        );
        
        if (success) {
          console.log(`✅ Política ${policy.name} sincronizada com arquivo`);
          setSyncStatus('success');
          return true;
        } else {
          throw new Error('Falha na persistência com arquivo');
        }
      } else {
        // Apenas salvar dados da política
        const policyId = await PolicyPersistenceService.savePolicyToDatabase(
          policy,
          user.id
        );
        
        if (policyId) {
          console.log(`✅ Política ${policy.name} sincronizada sem arquivo`);
          setSyncStatus('success');
          return true;
        } else {
          throw new Error('Falha ao salvar dados da política');
        }
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      setSyncStatus('error');
      
      toast({
        title: "❌ Erro na Sincronização",
        description: `Falha ao sincronizar: ${policy.name}`,
        variant: "destructive",
      });
      
      return false;
    }
  }, [user?.id, toast]);

  // Função para carregar todas as políticas do banco
  const loadPoliciesFromDatabase = useCallback(async (): Promise<ParsedPolicyData[]> => {
    if (!user?.id || !isInitialized) {
      console.log('⚠️ usePolicySync: Aguardando autenticação para carregar políticas');
      return [];
    }

    console.log(`📖 Carregando políticas do banco para usuário: ${user.id}`);
    setSyncStatus('syncing');

    try {
      const policies = await PolicyPersistenceService.loadUserPolicies(user.id);
      console.log(`✅ ${policies.length} políticas carregadas do banco`);
      setSyncStatus('success');
      return policies;
    } catch (error) {
      console.error('❌ Erro ao carregar políticas:', error);
      setSyncStatus('error');
      return [];
    }
  }, [user?.id, isInitialized]);

  // Reset do status quando usuário muda
  useEffect(() => {
    if (!user?.id) {
      setSyncStatus('idle');
    }
  }, [user?.id]);

  return {
    syncStatus,
    syncPolicyToDatabase,
    loadPoliciesFromDatabase
  };
}
