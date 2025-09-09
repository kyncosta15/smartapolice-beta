import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyPersistenceService } from '@/services/policyPersistenceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { normalizePolicy } from '@/lib/policies';

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

  // CORREÇÃO PRINCIPAL: Carregar apólices quando usuário faz login - COM RETRY E LOG DETALHADO
  useEffect(() => {
    console.log('🔄 usePersistedPolicies useEffect triggered:', { 
      userId: user?.id, 
      userExists: !!user,
      userEmail: user?.email 
    });

    if (user?.id) {
      // Aguardar um pouco para garantir que a sessão está estável
      const timer = setTimeout(() => {
        console.log('⏰ Timer executado, iniciando carregamento das apólices');
        loadPersistedPolicies();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Limpar dados quando usuário faz logout
      console.log('🧹 Limpando dados - usuário não autenticado');
      setPolicies([]);
    }
  }, [user?.id, user?.email]); // Adicionado user?.email como dependência

  const loadPersistedPolicies = async () => {
    if (!user?.id) {
      console.log('❌ loadPersistedPolicies: user.id não disponível');
      return;
    }

    console.log(`🔍 Iniciando carregamento de apólices para usuário: ${user.id}`);
    setIsLoading(true);
    setError(null);

    try {
      // CORREÇÃO: Verificar sessão antes de fazer queries
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro na sessão:', sessionError);
        throw new Error('Sessão inválida - faça login novamente');
      }

      if (!session) {
        console.error('❌ Sessão não encontrada');
        throw new Error('Sessão não encontrada - faça login novamente');
      }

      console.log('✅ Sessão válida encontrada, prosseguindo com carregamento');

      // Primeiro, limpar duplicatas se existirem
      const cleanedCount = await PolicyPersistenceService.cleanupDuplicatePolicies(user.id);
      if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} apólices duplicadas removidas`);
        toast({
          title: "🧹 Limpeza Realizada",
          description: `${cleanedCount} apólices duplicadas foram removidas`,
        });
      }
      
      console.log('📖 Chamando PolicyPersistenceService.loadUserPolicies...');
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      console.log(`✅ Apólices carregadas do serviço: ${loadedPolicies.length}`);
      
      // Normalizar e mapear status para novos valores
      const mappedPolicies = loadedPolicies.map(policy => {
        const normalized = normalizePolicy(policy);
        return {
          ...normalized,
          status: mapLegacyStatus(normalized.status)
        };
      });
      
      console.log(`📝 Definindo políticas no estado: ${mappedPolicies.length} apólices`);
      setPolicies(mappedPolicies);

      // Log de sucesso com detalhes
      console.log('🎉 Carregamento de apólices CONCLUÍDO com sucesso:', {
        totalPolicies: mappedPolicies.length,
        userInfo: { id: user.id, email: user.email },
        policyNames: mappedPolicies.map(p => p.name)
      });

      if (mappedPolicies.length > 0) {
        toast({
          title: "✅ Dados Carregados",
          description: `${mappedPolicies.length} apólice(s) encontrada(s)`,
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('❌ Erro DETALHADO no carregamento:', {
        error: err,
        message: errorMessage,
        userId: user.id,
        userEmail: user.email
      });
      
      setError(errorMessage);
      
      toast({
        title: "❌ Erro ao Carregar Dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 loadPersistedPolicies finalizado');
    }
  };

  // MÉTODO MELHORADO: Adicionar nova apólice à lista COM LOG
  const addPolicy = (policy: ParsedPolicyData) => {
    console.log('➕ Adicionando nova apólice ao estado:', policy.name);
    
    const normalized = normalizePolicy(policy);
    const mappedPolicy = {
      ...normalized,
      status: mapLegacyStatus(normalized.status)
    };
    
    setPolicies(prev => {
      const newPolicies = [mappedPolicy, ...prev];
      console.log(`📝 Estado atualizado: ${newPolicies.length} apólices total`);
      return newPolicies;
    });
  };

  // Remover apólice da lista IMEDIATAMENTE para melhor UX
  const removePolicy = (policyId: string) => {
    setPolicies(prev => {
      const newPolicies = prev.filter(p => p.id !== policyId);
      console.log(`🗑️ Apólice ${policyId} removida do estado local. Restam: ${newPolicies.length}`);
      return newPolicies;
    });
  };

  // FUNÇÃO MELHORADA: Deletar apólice com sincronização otimizada
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

    console.log(`🗑️ Iniciando deleção sincronizada da apólice: ${policyId}`);
    
    // OTIMIZAÇÃO 1: Remover do estado local IMEDIATAMENTE para melhor UX
    removePolicy(policyId);

    try {
      // OTIMIZAÇÃO 2: Verificar se a apólice ainda existe no banco antes de tentar deletar
      const { data: existingPolicy, error: checkError } = await supabase
        .from('policies')
        .select('id')
        .eq('id', policyId)
        .eq('user_id', user.id)
        .single();

      if (checkError?.code === 'PGRST116') {
        // Apólice já não existe no banco - sucesso silencioso
        console.log(`✅ Apólice ${policyId} já foi removida do banco`);
        return true;
      }

      if (checkError) {
        console.error('❌ Erro ao verificar existência da apólice:', checkError);
        // Restaurar no estado local em caso de erro
        setPolicies(prev => [policyExists, ...prev]);
        throw new Error("Erro ao verificar apólice no banco");
      }

      // OTIMIZAÇÃO 3: Obter token atualizado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('❌ Erro na sessão:', sessionError);
        // Restaurar no estado local
        setPolicies(prev => [policyExists, ...prev]);
        throw new Error("Sessão inválida - faça login novamente");
      }

      console.log(`🔑 Token obtido, chamando Edge Function para deletar ${policyId}`);
      
      // OTIMIZAÇÃO 4: Chamar Edge Function com timeout reduzido
      const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/delete-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg'
        },
        body: JSON.stringify({ policyId }),
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da Edge Function:', errorText);
        
        // Restaurar no estado local em caso de erro
        setPolicies(prev => [policyExists, ...prev]);
        
        if (response.status === 401) {
          throw new Error('Sessão expirada - faça login novamente');
        }
        
        throw new Error(`Erro ${response.status} ao deletar apólice`);
      }
      
      const result = await response.json();
      console.log('✅ Resposta da Edge Function:', result);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro detalhado na deleção:', error);
      
      // OTIMIZAÇÃO 5: Restaurar apólice no estado local apenas em caso de erro real
      const stillExists = policies.find(p => p.id === policyId);
      if (!stillExists) {
        setPolicies(prev => [policyExists, ...prev]);
      }
      
      // Não mostrar toast de erro aqui - será tratado no componente
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

  // MÉTODO MELHORADO: Recarregar dados COM FORÇA
  const refreshPolicies = () => {
    console.log('🔄 refreshPolicies chamado');
    if (user?.id) {
      console.log('✅ Usuário autenticado, recarregando dados');
      loadPersistedPolicies();
    } else {
      console.log('❌ Usuário não autenticado para refresh');
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
