
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

  // Carregar apólices quando usuário faz login
  useEffect(() => {
    console.log(`🔍 usePersistedPolicies - Verificando estado do usuário:`, {
      userId: user?.id,
      userExists: !!user
    });
    
    if (user?.id) {
      console.log(`🔄 Usuário logado detectado - Iniciando carregamento de apólices para: ${user.id}`);
      loadPersistedPolicies();
    } else {
      console.log(`🚪 Usuário não logado - Limpando dados das apólices`);
      // Limpar dados quando usuário faz logout
      setPolicies([]);
    }
  }, [user?.id]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) {
      console.log(`⚠️ loadPersistedPolicies chamado sem userId válido`);
      return;
    }

    console.log(`🚀 Iniciando loadPersistedPolicies para userId: ${user.id}`);
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Carregando apólices persistidas do usuário: ${user.id}`);
      
      // Primeiro, limpar duplicatas se existirem
      const cleanedCount = await PolicyPersistenceService.cleanupDuplicatePolicies(user.id);
      if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} apólices duplicadas foram removidas`);
        toast({
          title: "🧹 Limpeza Realizada",
          description: `${cleanedCount} apólices duplicadas foram removidas`,
        });
      }
      
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      console.log(`🔍 Resultado do PolicyPersistenceService.loadUserPolicies:`, {
        length: loadedPolicies.length,
        policies: loadedPolicies
      });
      
      setPolicies(loadedPolicies);
      
      if (loadedPolicies.length > 0) {
        console.log(`✅ ${loadedPolicies.length} apólices carregadas com sucesso`);
        console.log(`📚 Apólices carregadas:`, loadedPolicies.map(p => ({ id: p.id, name: p.name, pdfPath: p.pdfPath })));
      } else {
        console.log('📭 Nenhuma apólice encontrada no histórico');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('❌ Erro ao carregar apólices persistidas:', err);
      
      toast({
        title: "❌ Erro ao Carregar Dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log(`🏁 loadPersistedPolicies finalizado para userId: ${user.id}`);
    }
  };

  // Adicionar nova apólice à lista
  const addPolicy = (policy: ParsedPolicyData) => {
    console.log('➕ Adicionando nova apólice ao estado local:', policy.name);
    setPolicies(prev => [policy, ...prev]);
  };

  // Remover apólice da lista
  const removePolicy = (policyId: string) => {
    console.log('➖ Removendo apólice do estado local:', policyId);
    setPolicies(prev => prev.filter(p => p.id !== policyId));
  };

  // Deletar apólice do banco de dados
  const deletePolicy = async (policyId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`🗑️ Deletando apólice: ${policyId}`);
      
      // Primeiro, deletar o arquivo PDF do storage se existir
      const policy = policies.find(p => p.id === policyId);
      if (policy?.pdfPath) {
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([policy.pdfPath]);
        
        if (storageError) {
          console.warn('⚠️ Erro ao remover PDF do storage:', storageError);
        }
      }
      
      // Deletar coberturas relacionadas
      const { error: coverageError } = await supabase
        .from('coberturas')
        .delete()
        .eq('policy_id', policyId);
      
      if (coverageError) {
        console.warn('⚠️ Erro ao remover coberturas:', coverageError);
      }
      
      // Deletar parcelas relacionadas
      const { error: installmentError } = await supabase
        .from('parcelas')
        .delete()
        .eq('policy_id', policyId);
      
      if (installmentError) {
        console.warn('⚠️ Erro ao remover parcelas:', installmentError);
      }
      
      // Deletar a apólice
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId)
        .eq('user_id', user.id); // Garantir que só delete as próprias

      if (error) {
        throw error;
      }

      // Remover do estado local
      removePolicy(policyId);
      
      console.log(`✅ Apólice ${policyId} deletada com sucesso`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao deletar apólice:', error);
      toast({
        title: "❌ Erro ao Deletar",
        description: "Não foi possível remover a apólice",
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
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.category !== undefined) dbUpdates.forma_pagamento = updates.category;
      if (updates.entity !== undefined) dbUpdates.corretora = updates.entity;
      
      // Campos específicos do N8N
      if (updates.insuredName !== undefined) dbUpdates.segurado = updates.insuredName; // Priorizar insuredName sobre name
      if (updates.documento !== undefined) dbUpdates.documento = updates.documento;
      if (updates.documento_tipo !== undefined) dbUpdates.documento_tipo = updates.documento_tipo;
      if (updates.vehicleModel !== undefined) dbUpdates.modelo_veiculo = updates.vehicleModel;
      if (updates.uf !== undefined) dbUpdates.uf = updates.uf;
      if (updates.deductible !== undefined) dbUpdates.franquia = updates.deductible;

      console.log('📝 Dados preparados para atualização:', dbUpdates);

      const { error } = await supabase
        .from('policies')
        .update(dbUpdates)
        .eq('id', policyId)
        .eq('user_id', user.id); // Garantir que só edite as próprias

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setPolicies(prev => 
        prev.map(p => p.id === policyId ? { ...p, ...updates } : p)
      );
      
      console.log(`✅ Apólice ${policyId} atualizada com sucesso`);
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

  // Baixar PDF de uma apólice
  const downloadPDF = async (policyId: string, policyName: string) => {
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
      return;
    }

    try {
      console.log(`📥 Solicitando download do arquivo: ${policy.pdfPath}`);
      
      // Tentar download direto via storage.download()
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('pdfs')
        .download(policy.pdfPath);
        
      if (downloadError) {
        console.warn('⚠️ Download direto falhou:', downloadError);
        throw downloadError;
      }
      
      if (fileBlob) {
        console.log('✅ Arquivo obtido via download direto');
        const blobUrl = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${policyName || 'apolice'}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        toast({
          title: "📥 Download Concluído",
          description: `Arquivo ${policyName}.pdf baixado com sucesso`,
        });
        
        console.log('✅ Download concluído com sucesso');
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao baixar PDF:', error);
      toast({
        title: "❌ Erro no Download",
        description: "Não foi possível baixar o arquivo PDF",
        variant: "destructive",
      });
    }
  };

  // Recarregar dados com promise para aguardar conclusão
  const refreshPolicies = async (): Promise<void> => {
    if (user?.id) {
      console.log('🔄 Refresh de apólices solicitado');
      await loadPersistedPolicies();
      console.log('✅ Refresh de apólices concluído');
    }
  };

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
