import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyPersistenceService } from '@/services/policyPersistenceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function usePersistedPolicies() {
  const [policies, setPolicies] = useState<ParsedPolicyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mapeamento de status para compatibilidade com dados antigos
  const mapLegacyStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'vigente';
      case 'expiring':
        return 'renovada_aguardando';
      case 'expired':
        return 'nao_renovada';
      default:
        return status;
    }
  };

  // Carregar apólices quando usuário faz login
  useEffect(() => {
    console.log(`🔍 [usePersistedPolicies] Verificando estado do usuário:`, {
      userId: user?.id,
      userExists: !!user,
      timestamp: new Date().toISOString()
    });
    
    if (user?.id) {
      console.log(`🔄 [usePersistedPolicies] Usuário logado detectado - Iniciando carregamento de apólices para: ${user.id}`);
      loadPersistedPolicies();
    } else {
      console.log(`🚪 [usePersistedPolicies] Usuário não logado - Limpando dados das apólices`);
      // Limpar dados quando usuário faz logout
      setPolicies([]);
    }
  }, [user?.id]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) {
      console.log(`⚠️ [loadPersistedPolicies] Chamado sem userId válido`);
      return;
    }

    console.log(`🚀 [loadPersistedPolicies] Iniciando para userId: ${user.id} às ${new Date().toISOString()}`);
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 [loadPersistedPolicies] Carregando apólices persistidas do usuário: ${user.id}`);
      
      // Primeiro, limpar duplicatas se existirem
      const cleanedCount = await PolicyPersistenceService.cleanupDuplicatePolicies(user.id);
      if (cleanedCount > 0) {
        console.log(`🧹 [loadPersistedPolicies] ${cleanedCount} apólices duplicadas foram removidas`);
        toast({
          title: "🧹 Limpeza Realizada",
          description: `${cleanedCount} apólices duplicadas foram removidas`,
        });
      }
      
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      console.log(`🔍 [loadPersistedPolicies] Resultado do PolicyPersistenceService.loadUserPolicies:`, {
        length: loadedPolicies.length,
        policyIds: loadedPolicies.map(p => ({ id: p.id, name: p.name })),
        timestamp: new Date().toISOString()
      });
      
      // Mapear status para novos valores
      const mappedPolicies = loadedPolicies.map(policy => ({
        ...policy,
        status: mapLegacyStatus(policy.status)
      }));
      
      console.log(`📊 [loadPersistedPolicies] Definindo ${mappedPolicies.length} apólices no estado local`);
      setPolicies(mappedPolicies);
      
      if (mappedPolicies.length > 0) {
        console.log(`✅ [loadPersistedPolicies] ${mappedPolicies.length} apólices carregadas com sucesso`);
        console.log(`📚 [loadPersistedPolicies] IDs das apólices carregadas:`, mappedPolicies.map(p => p.id));
      } else {
        console.log('📭 [loadPersistedPolicies] Nenhuma apólice encontrada no histórico');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('❌ [loadPersistedPolicies] Erro ao carregar apólices persistidas:', err);
      
      toast({
        title: "❌ Erro ao Carregar Dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log(`🏁 [loadPersistedPolicies] Finalizado para userId: ${user.id} às ${new Date().toISOString()}`);
    }
  };

  // Adicionar nova apólice à lista
  const addPolicy = (policy: ParsedPolicyData) => {
    console.log(`➕ [addPolicy] Adicionando apólice ao estado local:`, {
      policyId: policy.id,
      policyName: policy.name,
      currentPoliciesCount: policies.length,
      timestamp: new Date().toISOString()
    });
    
    const mappedPolicy = {
      ...policy,
      status: mapLegacyStatus(policy.status)
    };
    
    setPolicies(prev => {
      const newPolicies = [mappedPolicy, ...prev];
      console.log(`📊 [addPolicy] Estado atualizado - Total de apólices: ${newPolicies.length}`);
      return newPolicies;
    });
  };

  // Remover apólice da lista
  const removePolicy = (policyId: string) => {
    console.log(`➖ [removePolicy] Removendo apólice do estado local:`, {
      policyId,
      currentPoliciesCount: policies.length,
      timestamp: new Date().toISOString()
    });
    
    setPolicies(prev => {
      const newPolicies = prev.filter(p => p.id !== policyId);
      console.log(`📊 [removePolicy] Estado atualizado - Total de apólices: ${newPolicies.length}`);
      console.log(`📊 [removePolicy] IDs restantes:`, newPolicies.map(p => p.id));
      return newPolicies;
    });
  };

  // Deletar apólice do banco de dados
  const deletePolicy = async (policyId: string): Promise<boolean> => {
    console.log(`🗑️ [deletePolicy] INICIANDO deleção da apólice: ${policyId} às ${new Date().toISOString()}`);
    
    if (!user?.id) {
      console.log(`❌ [deletePolicy] Usuário não autenticado para deletar apólice: ${policyId}`);
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    // Verificar se a apólice existe no estado local antes de deletar
    const policyExists = policies.find(p => p.id === policyId);
    console.log(`🔍 [deletePolicy] Apólice existe no estado local:`, {
      exists: !!policyExists,
      policyName: policyExists?.name,
      currentPoliciesCount: policies.length
    });

    try {
      console.log(`🔄 [deletePolicy] Iniciando deleção no banco para apólice: ${policyId}`);
      
      // Obter token de autenticação atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão de usuário inválida");
      }
      
      console.log(`📡 [deletePolicy] Chamando Edge Function para deletar apólice: ${policyId}`);
      
      // Chamar a Edge Function para deletar a apólice e todos os dados relacionados
      const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/delete-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ policyId })
      });
      
      const result = await response.json();
      console.log(`📡 [deletePolicy] Resposta da Edge Function:`, {
        status: response.status,
        result,
        policyId
      });
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar apólice');
      }

      console.log(`✅ [deletePolicy] Apólice deletada com sucesso no banco: ${policyId}`);
      
      // Remover do estado local APÓS confirmação do banco
      console.log(`📊 [deletePolicy] Removendo do estado local após confirmação do banco`);
      removePolicy(policyId);
      
      toast({
        title: "✅ Apólice Deletada",
        description: "A apólice foi removida com sucesso",
      });
      
      // Verificar estado após deleção
      console.log(`🔍 [deletePolicy] Estado após deleção:`, {
        remainingPoliciesCount: policies.length - 1, // -1 porque removePolicy ainda não executou
        deletedPolicyId: policyId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('❌ [deletePolicy] ERRO CRÍTICO ao deletar apólice:', {
        policyId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "❌ Erro ao Deletar",
        description: error instanceof Error ? error.message : "Não foi possível remover a apólice",
        variant: "destructive",
      });
      return false;
    }
  };

  // Atualizar apólice no banco de dados
  const updatePolicy = async (policyId: string, updates: Partial<ParsedPolicyData>): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`✏️ Atualizando apólice: ${policyId}`, updates);
      
      // Converter dados para formato do banco - mapeando TODOS os campos editáveis
      const dbUpdates: any = {};
      
      // Campos básicos
      if (updates.name !== undefined) dbUpdates.segurado = updates.name;
      if (updates.insurer !== undefined) dbUpdates.seguradora = updates.insurer;
      if (updates.type !== undefined) dbUpdates.tipo_seguro = updates.type;
      if (updates.policyNumber !== undefined) dbUpdates.numero_apolice = updates.policyNumber;
      if (updates.premium !== undefined) dbUpdates.valor_premio = updates.premium;
      if (updates.monthlyAmount !== undefined) dbUpdates.custo_mensal = updates.monthlyAmount;
      if (updates.startDate !== undefined) dbUpdates.inicio_vigencia = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.fim_vigencia = updates.endDate;
      if (updates.status !== undefined) dbUpdates.status = mapLegacyStatus(updates.status);
      if (updates.category !== undefined) dbUpdates.forma_pagamento = updates.category;
      if (updates.entity !== undefined) dbUpdates.corretora = updates.entity;
      
      // Campos específicos do N8N
      if (updates.insuredName !== undefined) dbUpdates.segurado = updates.insuredName; // Priorizar insuredName sobre name
      if (updates.documento !== undefined) dbUpdates.documento = updates.documento;
      if (updates.documento_tipo !== undefined) dbUpdates.documento_tipo = updates.documento_tipo;
      if (updates.vehicleModel !== undefined) dbUpdates.modelo_veiculo = updates.vehicleModel;
      if (updates.uf !== undefined) dbUpdates.uf = updates.uf;
      if (updates.deductible !== undefined) dbUpdates.franquia = updates.deductible;
      
      // Coverage - se for array, converter para string separada por vírgula
      if (updates.coverage !== undefined) {
        const coverageString = Array.isArray(updates.coverage) 
          ? updates.coverage.join(', ') 
          : updates.coverage;
        // Não há campo específico na DB para coverage, pode adicionar se necessário
      }

      console.log('📝 Dados preparados para atualização:', dbUpdates);

      const { error } = await supabase
        .from('policies')
        .update(dbUpdates)
        .eq('id', policyId)
        .eq('user_id', user.id); // Garantir que só edite as próprias

      if (error) {
        throw error;
      }

      // Atualizar estado local com mapeamento de status
      const mappedUpdates = {
        ...updates,
        status: updates.status ? mapLegacyStatus(updates.status) : undefined
      };
      
      setPolicies(prev => 
        prev.map(p => p.id === policyId ? { ...p, ...mappedUpdates } : p)
      );
      
      toast({
        title: "✅ Apólice Atualizada",
        description: "As alterações foram salvas com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar apólice:', error);
      toast({
        title: "❌ Erro ao Atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
      return false;
    }
  };

  // Obter URL de download para um PDF
  const getPDFDownloadUrl = async (policyId: string): Promise<string | null> => {
    const policy = policies.find(p => p.id === policyId);
    
    console.log(`🔍 Tentativa de download - Policy ID: ${policyId}`);
    console.log(`🔍 Policy encontrada:`, policy);
    console.log(`🔍 PDF Path da policy: ${policy?.pdfPath}`);
    
    if (!policy?.pdfPath) {
      console.log(`❌ Policy sem pdfPath: ${policy?.name}`);
      toast({
        title: "❌ Arquivo não encontrado",
        description: "PDF não está disponível para download",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log(`📥 Solicitando URL de download para: ${policy.pdfPath}`);
      const downloadUrl = await PolicyPersistenceService.getPDFDownloadUrl(policy.pdfPath);
      
      if (!downloadUrl) {
        console.log(`❌ URL de download não gerada para: ${policy.pdfPath}`);
        toast({
          title: "❌ Erro no Download",
          description: "Não foi possível gerar o link de download",
          variant: "destructive",
        });
        return null;
      }

      console.log(`✅ URL de download gerada: ${downloadUrl}`);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Erro ao obter URL de download:', error);
      toast({
        title: "❌ Erro no Download",
        description: "Falha ao acessar o arquivo PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  // Baixar PDF de uma apólice
  const downloadPDF = async (policyId: string, policyName: string) => {
    const downloadUrl = await getPDFDownloadUrl(policyId);
    
    if (downloadUrl) {
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${policyName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "📥 Download Iniciado",
        description: `Baixando arquivo: ${policyName}.pdf`,
      });
    }
  };

  // Recarregar dados
  const refreshPolicies = () => {
    console.log(`🔄 [refreshPolicies] Solicitado recarregamento manual às ${new Date().toISOString()}`);
    if (user?.id) {
      console.log(`🔄 [refreshPolicies] Chamando loadPersistedPolicies para userId: ${user.id}`);
      loadPersistedPolicies();
    } else {
      console.log(`⚠️ [refreshPolicies] Usuário não logado - não é possível recarregar`);
    }
  };

  // Log do estado atual sempre que policies mudar
  useEffect(() => {
    console.log(`📊 [usePersistedPolicies] Estado atual das apólices:`, {
      count: policies.length,
      policyIds: policies.map(p => ({ id: p.id, name: p.name })),
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [policies, user?.id]);

  return {
    policies,
    isLoading,
    error,
    addPolicy,
    removePolicy,
    deletePolicy,
    updatePolicy,
    downloadPDF,
    refreshPolicies,
    hasPersistedData: policies.length > 0
  };
}
