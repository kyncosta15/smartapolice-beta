import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useAuth } from '@/contexts/AuthContext';
import { RobustPolicyPersistence } from '@/services/robustPolicyPersistence';
import { useToast } from '@/hooks/use-toast';

/**
 * HOOK ROBUSTO PARA DADOS DE APÓLICES
 * 
 * - Sempre carrega do banco (nunca do cache)
 * - Recarrega automaticamente no login/logout
 * - Garante consistência de dados
 * - Implementa controle de concorrência
 */
export function useRobustPolicyData() {
  const [policies, setPolicies] = useState<ParsedPolicyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<Date | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * CARREGAR SEMPRE DO BANCO - NUNCA DO CACHE
   */
  const loadPoliciesFromDatabase = async (forceReload = false) => {
    if (!user?.id) {
      console.log('👤 Usuário não autenticado, limpando dados');
      setPolicies([]);
      setError(null);
      return;
    }

    if (isLoading && !forceReload) {
      console.log('⏳ Carregamento já em andamento...');
      return;
    }

    console.log('🔄 Carregando apólices SEMPRE do banco para:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      const loadedPolicies = await RobustPolicyPersistence.loadUserPoliciesFromDatabase(user.id);
      
      console.log(`✅ ${loadedPolicies.length} apólices carregadas do banco`);
      console.log('🕒 Horário do carregamento:', new Date().toISOString());
      
      setPolicies(loadedPolicies);
      setLastLoadTime(new Date());

      // Log de auditoria
      console.log('📊 AUDITORIA - Dados carregados:', {
        userId: user.id,
        count: loadedPolicies.length,
        timestamp: new Date().toISOString(),
        source: 'database_direct'
      });

    } catch (error) {
      const errorMessage = `Erro ao carregar apólices: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌', errorMessage);
      
      setError(errorMessage);
      
      toast({
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar suas apólices. Tentando novamente...",
        variant: "destructive",
      });

      // Tentar novamente após 2 segundos
      setTimeout(() => loadPoliciesFromDatabase(true), 2000);

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * RECARREGAR FORÇADO DO BANCO
   */
  const forceReloadFromDatabase = async () => {
    console.log('🔄 FORÇA RELOAD do banco solicitado');
    await loadPoliciesFromDatabase(true);
  };

  /**
   * ADICIONAR NOVA APÓLICE E RECARREGAR DO BANCO
   */
  const addPolicyAndReload = async (newPolicy: ParsedPolicyData) => {
    console.log('➕ Nova apólice adicionada, recarregando do banco:', newPolicy.name);
    
    // Não adicionar ao state local - sempre recarregar do banco
    await forceReloadFromDatabase();
    
    toast({
      title: "✅ Apólice Processada",
      description: `${newPolicy.name} foi salva com sucesso`,
    });
  };

  /**
   * AUTO-RELOAD EM LOGIN/LOGOUT E MUDANÇAS DE USUÁRIO
   */
  useEffect(() => {
    console.log('👤 Usuário mudou:', user?.id || 'não autenticado');
    
    if (user?.id) {
      // Usuário logou - carregar dados do banco
      loadPoliciesFromDatabase(true);
    } else {
      // Usuário deslogou - limpar dados
      setPolicies([]);
      setError(null);
      setLastLoadTime(null);
    }
  }, [user?.id]);

  /**
   * VERIFICAR CONSISTÊNCIA PERIODICAMENTE
   */
  useEffect(() => {
    if (!user?.id) return;

    const consistencyInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastLoad = lastLoadTime 
        ? now.getTime() - lastLoadTime.getTime() 
        : Infinity;

      // Recarregar se mais de 5 minutos desde o último carregamento
      if (timeSinceLastLoad > 5 * 60 * 1000) {
        console.log('🔄 Verificação de consistência - recarregando do banco');
        loadPoliciesFromDatabase(true);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(consistencyInterval);
  }, [user?.id, lastLoadTime]);

  /**
   * STATISTICS E DEBUGGING
   */
  const getLoadingStats = () => ({
    policiesCount: policies.length,
    lastLoadTime: lastLoadTime?.toISOString(),
    isLoading,
    hasError: !!error,
    userId: user?.id,
    cacheSource: 'database_only' // Sempre do banco
  });

  return {
    // Dados principais
    policies,
    isLoading,
    error,
    lastLoadTime,
    
    // Métodos de controle
    forceReloadFromDatabase,
    addPolicyAndReload,
    loadPoliciesFromDatabase: () => loadPoliciesFromDatabase(true),
    
    // Debugging
    getLoadingStats,
    
    // Estado de loading para UI
    isEmpty: policies.length === 0 && !isLoading,
    hasData: policies.length > 0
  };
}