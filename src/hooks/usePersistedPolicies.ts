import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyPersistenceService } from '@/services/policyPersistenceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePolicySync } from './usePolicySync';

export function usePersistedPolicies() {
  const [policies, setPolicies] = useState<ParsedPolicyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();
  const { syncStatus, syncPolicyToDatabase, loadPoliciesFromDatabase } = usePolicySync();

  // Mapeamento de status para compatibilidade
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

  // Carregar apólices quando usuário faz login e auth está inicializada
  useEffect(() => {
    console.log('🔄 usePersistedPolicies useEffect:', { 
      userId: user?.id, 
      isInitialized,
      currentPoliciesCount: policies.length 
    });

    if (isInitialized) {
      if (user?.id) {
        console.log('📋 Usuário autenticado, carregando apólices...');
        loadPersistedPolicies();
      } else {
        console.log('🚫 Usuário não autenticado, limpando dados...');
        setPolicies([]);
        setError(null);
      }
    }
  }, [user?.id, isInitialized]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) {
      console.log('⚠️ loadPersistedPolicies: Usuário não identificado');
      return;
    }

    console.log('🔄 Iniciando carregamento de apólices para usuário:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // Usar o hook de sincronização para carregar do banco
      const loadedPolicies = await loadPoliciesFromDatabase();
      console.log(`📋 ${loadedPolicies.length} apólices carregadas do banco`);
      
      // Mapear status para novos valores
      const mappedPolicies = loadedPolicies.map(policy => ({
        ...policy,
        status: mapLegacyStatus(policy.status)
      }));
      
      setPolicies(mappedPolicies);
      console.log('✅ Apólices definidas no estado:', mappedPolicies.length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('❌ Erro ao carregar apólices:', err);
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

  // NOVA FUNÇÃO: Adicionar e sincronizar apólice automaticamente
  const addPolicy = async (policy: ParsedPolicyData, file?: File) => {
    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    const mappedPolicy = {
      ...policy,
      status: mapLegacyStatus(policy.status)
    };
    
    console.log('➕ Adicionando e sincronizando apólice:', mappedPolicy.id);
    
    // Adicionar ao estado local primeiro para UX responsivo
    setPolicies(prev => {
      const exists = prev.some(p => p.id === mappedPolicy.id);
      if (exists) {
        console.log('⚠️ Apólice já existe, não adicionando');
        return prev;
      }
      return [mappedPolicy, ...prev];
    });

    // Sincronizar com o banco em background
    try {
      const success = await syncPolicyToDatabase(mappedPolicy, file);
      
      if (success) {
        console.log(`✅ Apólice ${mappedPolicy.id} sincronizada com sucesso`);
        toast({
          title: "✅ Apólice Salva",
          description: `${mappedPolicy.name} foi salva com sucesso`,
        });
        return true;
      } else {
        // Remover do estado local se falhou a sincronização
        setPolicies(prev => prev.filter(p => p.id !== mappedPolicy.id));
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na sincronização da apólice:', error);
      // Remover do estado local se falhou a sincronização
      setPolicies(prev => prev.filter(p => p.id !== mappedPolicy.id));
      return false;
    }
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

  // Recarregar dados
  const refreshPolicies = () => {
    if (user?.id && isInitialized) {
      console.log('🔄 Refresh manual das apólices solicitado');
      loadPersistedPolicies();
    }
  };

  return {
    policies,
    isLoading: isLoading || syncStatus === 'syncing',
    error,
    addPolicy, // Função atualizada com sincronização automática
    removePolicy,
    deletePolicy,
    updatePolicy,
    downloadPDF,
    refreshPolicies,
    hasPersistedData: policies.length > 0,
    syncStatus // Expor status da sincronização
  };
}
