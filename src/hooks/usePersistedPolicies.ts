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
    if (user?.id) {
      loadPersistedPolicies();
    } else {
      // Limpar dados quando usuário faz logout
      setPolicies([]);
    }
  }, [user?.id]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, limpar duplicatas se existirem
      const cleanedCount = await PolicyPersistenceService.cleanupDuplicatePolicies(user.id);
      if (cleanedCount > 0) {
        toast({
          title: "🧹 Limpeza Realizada",
          description: `${cleanedCount} apólices duplicadas foram removidas`,
        });
      }
      
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      // Mapear status para novos valores
      const mappedPolicies = loadedPolicies.map(policy => ({
        ...policy,
        status: mapLegacyStatus(policy.status)
      }));
      
      setPolicies(mappedPolicies);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      
      toast({
        title: "❌ Erro ao Carregar Dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar nova apólice à lista
  const addPolicy = (policy: ParsedPolicyData) => {
    const mappedPolicy = {
      ...policy,
      status: mapLegacyStatus(policy.status)
    };
    
    setPolicies(prev => [mappedPolicy, ...prev]);
  };

  // Remover apólice da lista - FUNÇÃO CORRIGIDA
  const removePolicy = (policyId: string) => {
    setPolicies(prev => {
      const newPolicies = prev.filter(p => p.id !== policyId);
      console.log(`🗑️ Apólice ${policyId} removida do estado local. Restam: ${newPolicies.length}`);
      return newPolicies;
    });
  };

  // CORREÇÃO PRINCIPAL: Deletar apólice do banco de dados com token atualizado
  const deletePolicy = async (policyId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    // Verificar se a apólice existe no estado local antes de deletar
    const policyExists = policies.find(p => p.id === policyId);
    if (!policyExists) {
      toast({
        title: "❌ Apólice não encontrada",
        description: "A apólice não foi encontrada no sistema",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`🗑️ Iniciando deleção da apólice: ${policyId}`);
      
      // CORREÇÃO: Obter token de autenticação mais atual e robusto
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
        throw new Error("Erro na sessão de usuário");
      }
      
      if (!session?.access_token) {
        console.error('Token de acesso não encontrado');
        throw new Error("Token de acesso não encontrado - faça login novamente");
      }

      console.log(`🔑 Token obtido, fazendo chamada para Edge Function`);
      
      // Chamar a Edge Function para deletar a apólice e todos os dados relacionados
      const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/delete-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg'
        },
        body: JSON.stringify({ policyId })
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na resposta da Edge Function:', errorData);
        
        if (response.status === 401) {
          throw new Error('Sessão expirada - faça login novamente');
        }
        
        throw new Error(errorData.error || `Erro ${response.status} ao deletar apólice`);
      }
      
      const result = await response.json();
      console.log('✅ Resposta da Edge Function:', result);

      // CORREÇÃO: Remover do estado local IMEDIATAMENTE após confirmação
      removePolicy(policyId);
      
      toast({
        title: "✅ Apólice Deletada",
        description: "A apólice foi removida com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro detalhado na deleção:', error);
      
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
      if (updates.insuredName !== undefined) dbUpdates.segurado = updates.insuredName;
      if (updates.documento !== undefined) dbUpdates.documento = updates.documento;
      if (updates.documento_tipo !== undefined) dbUpdates.documento_tipo = updates.documento_tipo;
      if (updates.vehicleModel !== undefined) dbUpdates.modelo_veiculo = updates.vehicleModel;
      if (updates.uf !== undefined) dbUpdates.uf = updates.uf;
      if (updates.deductible !== undefined) dbUpdates.franquia = updates.deductible;

      const { error } = await supabase
        .from('policies')
        .update(dbUpdates)
        .eq('id', policyId)
        .eq('user_id', user.id);

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
    
    if (!policy?.pdfPath) {
      toast({
        title: "❌ Arquivo não encontrado",
        description: "PDF não está disponível para download",
        variant: "destructive",
      });
      return null;
    }

    try {
      const downloadUrl = await PolicyPersistenceService.getPDFDownloadUrl(policy.pdfPath);
      
      if (!downloadUrl) {
        toast({
          title: "❌ Erro no Download",
          description: "Não foi possível gerar o link de download",
          variant: "destructive",
        });
        return null;
      }

      return downloadUrl;
    } catch (error) {
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
