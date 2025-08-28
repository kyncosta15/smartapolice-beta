
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
    if (user?.id) {
      loadPersistedPolicies();
    } else {
      setPolicies([]);
    }
  }, [user?.id]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Limpar duplicatas se existirem
      const cleanedCount = await PolicyPersistenceService.cleanupDuplicatePolicies(user.id);
      if (cleanedCount > 0) {
        toast({
          title: "🧹 Limpeza Realizada",
          description: `${cleanedCount} apólices duplicadas foram removidas`,
        });
      }
      
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      setPolicies(loadedPolicies);

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

  // Adicionar nova apólice à lista PRESERVANDO dados originais
  const addPolicy = (policy: ParsedPolicyData) => {
    console.log('➕ Adicionando apólice ORIGINAL ao estado:', policy.name);
    setPolicies(prev => [policy, ...prev]);
  };

  // Remover apólice IMEDIATAMENTE do estado para melhor UX
  const removePolicy = (policyId: string) => {
    setPolicies(prev => {
      const newPolicies = prev.filter(p => p.id !== policyId);
      console.log(`🗑️ Apólice ${policyId} removida do estado local. Restam: ${newPolicies.length}`);
      return newPolicies;
    });
  };

  // FUNÇÃO MELHORADA: Deletar apólice com persistência completa
  const deletePolicy = async (policyId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    const policyExists = policies.find(p => p.id === policyId);
    if (!policyExists) {
      toast({
        title: "❌ Apólice não encontrada",
        description: "A apólice não foi encontrada no sistema",
        variant: "destructive",
      });
      return false;
    }

    console.log(`🗑️ Iniciando deleção COMPLETA da apólice: ${policyId}`);
    
    // Remover do estado local IMEDIATAMENTE
    removePolicy(policyId);

    try {
      // Verificar se existe no banco
      const { data: existingPolicy, error: checkError } = await supabase
        .from('policies')
        .select('id')
        .eq('id', policyId)
        .eq('user_id', user.id)
        .single();

      if (checkError?.code === 'PGRST116') {
        console.log(`✅ Apólice ${policyId} já foi removida do banco`);
        return true;
      }

      if (checkError) {
        console.error('❌ Erro ao verificar existência da apólice:', checkError);
        setPolicies(prev => [policyExists, ...prev]);
        throw new Error("Erro ao verificar apólice no banco");
      }

      // Obter sessão atualizada
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('❌ Erro na sessão:', sessionError);
        setPolicies(prev => [policyExists, ...prev]);
        throw new Error("Sessão inválida - faça login novamente");
      }

      console.log(`🔑 Chamando Edge Function para deletar ${policyId}`);
      
      // Chamar Edge Function para deleção completa
      const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/delete-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg'
        },
        body: JSON.stringify({ policyId }),
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da Edge Function:', errorText);
        setPolicies(prev => [policyExists, ...prev]);
        
        if (response.status === 401) {
          throw new Error('Sessão expirada - faça login novamente');
        }
        
        throw new Error(`Erro ${response.status} ao deletar apólice`);
      }
      
      const result = await response.json();
      console.log('✅ Apólice deletada COMPLETAMENTE:', result);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro detalhado na deleção:', error);
      
      const stillExists = policies.find(p => p.id === policyId);
      if (!stillExists) {
        setPolicies(prev => [policyExists, ...prev]);
      }
      
      return false;
    }
  };

  // Atualizar apólice PRESERVANDO dados originais
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
      // Converter dados para formato do banco PRESERVANDO originais
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.segurado = updates.name;
      if (updates.insurer !== undefined) dbUpdates.seguradora = updates.insurer;
      if (updates.type !== undefined) dbUpdates.tipo_seguro = updates.type;
      if (updates.policyNumber !== undefined) dbUpdates.numero_apolice = updates.policyNumber;
      if (updates.premium !== undefined) dbUpdates.valor_premio = updates.premium;
      if (updates.monthlyAmount !== undefined) dbUpdates.custo_mensal = updates.monthlyAmount;
      if (updates.startDate !== undefined) dbUpdates.inicio_vigencia = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.fim_vigencia = updates.endDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.entity !== undefined) dbUpdates.corretora = updates.entity;
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

      if (error) throw error;

      // Atualizar estado local PRESERVANDO dados originais
      setPolicies(prev => 
        prev.map(p => p.id === policyId ? { ...p, ...updates } : p)
      );
      
      toast({
        title: "✅ Apólice Atualizada",
        description: "As alterações foram salvas preservando dados originais",
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

  // Obter URL de download para PDF
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

  // Recarregar dados PRESERVANDO originais
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
