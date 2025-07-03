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
    setPolicies(prev => [policy, ...prev]);
  };

  // Remover apólice da lista
  const removePolicy = (policyId: string) => {
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
      
      toast({
        title: "✅ Apólice Deletada",
        description: "A apólice foi removida com sucesso",
      });
      
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
      console.log(`✏️ Atualizando apólice: ${policyId}`);
      
      // Converter dados para formato do banco
      const dbUpdates = {
        segurado: updates.name,
        seguradora: updates.insurer,
        tipo_seguro: updates.type,
        numero_apolice: updates.policyNumber,
        valor_premio: updates.premium,
        custo_mensal: updates.monthlyAmount,
        inicio_vigencia: updates.startDate,
        fim_vigencia: updates.endDate,
        forma_pagamento: updates.paymentFrequency,
        status: updates.status,
      };

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
    if (user?.id) {
      loadPersistedPolicies();
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