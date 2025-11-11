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
    // Primeiro normalizar o status para minúsculas
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'active':
      case 'ativa':
        return 'vigente';
      case 'expiring':
        return 'vencendo';
      case 'expired':
      case 'vencida':
        return 'nao_renovada';
      case 'aguardando_emissao':
      case 'aguardando emissao':
        return 'aguardando_emissao';
      case 'nao_renovada':
      case 'não renovada':
        return 'nao_renovada';
      case 'pendente_analise':
      case 'pendente analise':
        return 'pendente_analise';
      case 'vigente':
        return 'vigente';
      case 'vencendo':
        return 'vencendo';
      default:
        // Se não encontrar mapeamento, retornar o status original
        return status || 'vigente';
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
      // CORREÇÃO: Verificar sessão antes de fazer queries - mas permitir para novos usuários
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro na sessão:', sessionError);
        // Para novos usuários, não falhar imediatamente
        console.log('⚠️ Erro de sessão, mas continuando para novos usuários...');
      }

      // Para novos usuários, retornar lista vazia e não bloquear outras funcionalidades
      if (!session && user?.id) {
        console.log('⚠️ Sessão temporariamente indisponível, mas user.id existe - continuando...');
        setPolicies([]);
        setIsLoading(false);
        setError(null); // Importante: limpar erro
        return;
      }

      if (!session) {
        console.error('❌ Sessão não encontrada e user.id também não existe');
        throw new Error('Sessão não encontrada - faça login novamente');
      }

      console.log('✅ Sessão válida encontrada, prosseguindo com carregamento');
      
      console.log('📖 Chamando PolicyPersistenceService.loadUserPolicies...');
      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      console.log(`✅ Apólices carregadas do serviço: ${loadedPolicies.length}`);
      
      // DEBUG: Verificar documento_tipo nas apólices carregadas
      console.log('🔍 DEBUG APÓLICES DO BANCO:', loadedPolicies.map(p => ({
        id: p.id,
        name: p.name,
        documento_tipo: p.documento_tipo,
        documento: p.documento
      })));
      
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
      // CRÍTICO: Criar objeto limpo DIRETAMENTE dos updates, sem buscar dados antigos
      const dbUpdates: any = {
        segurado: updates.name, // SEMPRE usar o valor de updates.name
      };
      
      // Adicionar outros campos apenas se estiverem definidos
      if (updates.type !== undefined) dbUpdates.tipo_seguro = updates.type;
      if ((updates as any).tipo_seguro !== undefined) dbUpdates.tipo_seguro = (updates as any).tipo_seguro;
      if (updates.insurer !== undefined) dbUpdates.seguradora = updates.insurer;
      if (updates.policyNumber !== undefined) dbUpdates.numero_apolice = updates.policyNumber;
      
      // Valores financeiros
      const premiumValue = (updates as any).valor_premio !== undefined 
        ? (typeof (updates as any).valor_premio === 'number' ? (updates as any).valor_premio : parseFloat((updates as any).valor_premio) || 0)
        : (updates.premium !== undefined 
          ? (typeof updates.premium === 'number' ? updates.premium : parseFloat(String(updates.premium)) || 0)
          : null);
      
      if (premiumValue !== null) {
        dbUpdates.valor_premio = premiumValue;
      }
      
      const monthlyValue = (updates as any).custo_mensal !== undefined
        ? (typeof (updates as any).custo_mensal === 'number' ? (updates as any).custo_mensal : parseFloat((updates as any).custo_mensal) || 0)
        : (updates.monthlyAmount !== undefined
          ? (typeof updates.monthlyAmount === 'number' ? updates.monthlyAmount : parseFloat(String(updates.monthlyAmount)) || 0)
          : null);
      
      if (monthlyValue !== null) {
        dbUpdates.custo_mensal = monthlyValue;
        dbUpdates.valor_parcela = monthlyValue;
      }
      
      if (updates.startDate !== undefined) dbUpdates.inicio_vigencia = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.fim_vigencia = updates.endDate;
      
      if ((updates as any).quantidade_parcelas !== undefined) {
        dbUpdates.quantidade_parcelas = typeof (updates as any).quantidade_parcelas === 'number' ? (updates as any).quantidade_parcelas : parseInt((updates as any).quantidade_parcelas) || 1;
      } else if (updates.installments !== undefined) {
        dbUpdates.quantidade_parcelas = typeof updates.installments === 'number' ? updates.installments : parseInt(String(updates.installments)) || 1;
      }
      
      if (updates.status !== undefined) {
        const mappedStatus = mapLegacyStatus(updates.status);
        dbUpdates.status = mappedStatus;
      }
      
      if (updates.category !== undefined) dbUpdates.forma_pagamento = updates.category;
      if (updates.entity !== undefined) dbUpdates.corretora = updates.entity;
      // REMOVIDO: if (updates.insuredName !== undefined) - usar apenas updates.name como fonte
      if (updates.documento !== undefined) dbUpdates.documento = String(updates.documento).substring(0, 20);
      if (updates.documento_tipo !== undefined) dbUpdates.documento_tipo = String(updates.documento_tipo).substring(0, 10);
      if (updates.vehicleModel !== undefined) dbUpdates.modelo_veiculo = updates.vehicleModel;
      if ((updates as any).marca !== undefined) dbUpdates.marca = (updates as any).marca;
      if ((updates as any).placa !== undefined) dbUpdates.placa = String((updates as any).placa).substring(0, 10);
      if ((updates as any).nome_embarcacao !== undefined) dbUpdates.nome_embarcacao = (updates as any).nome_embarcacao;
      if ((updates as any).ano_modelo !== undefined) dbUpdates.ano_modelo = (updates as any).ano_modelo;
      if (updates.uf !== undefined) dbUpdates.uf = String(updates.uf).toUpperCase().substring(0, 2);
      if (updates.deductible !== undefined) dbUpdates.franquia = updates.deductible;
      if (updates.responsavel_nome !== undefined) dbUpdates.responsavel_nome = updates.responsavel_nome;

      console.log('💾 [updatePolicy] Atualizando apólice no banco:', {
        policyId,
        dbUpdates,
        todasChaves: Object.keys(dbUpdates)
      });

      const { data, error } = await supabase
        .from('policies')
        .update(dbUpdates)
        .eq('id', policyId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('❌ [updatePolicy] Erro do Supabase:', error);
        toast({
          title: "❌ Erro ao Atualizar",
          description: `${error.message}${error.hint ? ` - ${error.hint}` : ''}`,
          variant: "destructive",
        });
        throw error;
      }

      const dbRecord = data && data.length > 0 ? data[0] : null;
      
      console.log('✅ [updatePolicy] Dados retornados do banco:', {
        id: dbRecord?.id,
        marca: dbRecord?.marca,
        placa: dbRecord?.placa,
        modelo_veiculo: dbRecord?.modelo_veiculo,
        nome_embarcacao: dbRecord?.nome_embarcacao,
        ano_modelo: dbRecord?.ano_modelo
      });
      
      // Atualizar estado local com os dados REAIS do banco
      setPolicies(prev => 
        prev.map(p => {
          if (p.id === policyId) {
            const updated: any = {
              ...p,
              ...(dbRecord || {}),
              name: dbRecord?.segurado || p.name,
              type: dbRecord?.tipo_seguro || p.type,
              tipo_seguro: dbRecord?.tipo_seguro || (p as any).tipo_seguro,
              insurer: dbRecord?.seguradora || p.insurer,
              policyNumber: dbRecord?.numero_apolice || p.policyNumber,
              numero_apolice: dbRecord?.numero_apolice || (p as any).numero_apolice,
              premium: dbRecord?.valor_premio || p.premium,
              valor_premio: dbRecord?.valor_premio || (p as any).valor_premio,
              monthlyAmount: dbRecord?.custo_mensal || p.monthlyAmount,
              custo_mensal: dbRecord?.custo_mensal || (p as any).custo_mensal,
              valor_parcela: dbRecord?.valor_parcela || (p as any).valor_parcela,
              installments: dbRecord?.quantidade_parcelas || (p as any).installments,
              quantidade_parcelas: dbRecord?.quantidade_parcelas || (p as any).quantidade_parcelas,
              startDate: dbRecord?.inicio_vigencia || p.startDate,
              endDate: dbRecord?.fim_vigencia || p.endDate,
              status: dbRecord?.status ? mapLegacyStatus(dbRecord.status) : p.status,
              // Campos de veículo/embarcação
              vehicleModel: dbRecord?.modelo_veiculo || p.vehicleModel,
              modelo_veiculo: dbRecord?.modelo_veiculo || (p as any).modelo_veiculo,
              marca: dbRecord?.marca || (p as any).marca,
              placa: dbRecord?.placa || (p as any).placa,
              nome_embarcacao: dbRecord?.nome_embarcacao || (p as any).nome_embarcacao,
              ano_modelo: dbRecord?.ano_modelo || (p as any).ano_modelo,
              deductible: dbRecord?.franquia || p.deductible,
              franquia: dbRecord?.franquia || (p as any).franquia
            };
            
            return updated;
          }
          return p;
        })
      );
      
      toast({
        title: "✅ Apólice Atualizada",
        description: "As alterações foram salvas com sucesso",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Atualizar",
        description: error?.message || "Não foi possível salvar as alterações",
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

  // Baixar PDF de uma apólice - OTIMIZADO PARA MOBILE/IPHONE
  const downloadPDF = async (policyId: string, policyName: string) => {
    console.log('📥 Iniciando download do PDF:', policyId, policyName);
    
    toast({
      title: "⏳ Download iniciado",
      description: `Baixando ${policyName}`,
    });

    const downloadUrl = await getPDFDownloadUrl(policyId);
    
    if (downloadUrl) {
      console.log('✅ URL do PDF obtida, iniciando download otimizado para mobile');
      
      try {
        // Fazer fetch do PDF para obter como blob
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        
        // Criar blob com MIME type explícito
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const filename = `${policyName}.pdf`;
        
        // Verificar se Web Share API está disponível (iOS/Safari)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });
            
            // Verificar se pode compartilhar arquivos
            if (navigator.canShare({ files: [file] })) {
              console.log('📱 Usando Web Share API (iOS nativo)');
              await navigator.share({
                title: policyName,
                text: `Apólice ${policyName}`,
                files: [file]
              });
              
              toast({
                title: "✅ Download Concluído",
                description: `${policyName} foi salvo com sucesso`,
              });
              return;
            }
          } catch (shareError: any) {
            // Usuário cancelou ou erro - continuar com fallback
            if (shareError.name !== 'AbortError') {
              console.log('⚠️ Web Share não disponível, usando fallback:', shareError);
            } else {
              // Usuário cancelou
              console.log('ℹ️ Usuário cancelou o compartilhamento');
              return;
            }
          }
        }
        
        // Fallback: Download tradicional otimizado para mobile
        console.log('📥 Usando método de download tradicional otimizado');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.setAttribute('download', filename); // Força download
        link.style.display = 'none';
        link.target = '_self'; // Evita abrir em nova aba
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast({
          title: "✅ Download Concluído",
          description: `${policyName} foi baixado com sucesso`,
        });
        
      } catch (error) {
        console.error('❌ Erro ao processar download:', error);
        toast({
          title: "❌ Erro no Download",
          description: "Falha ao baixar o arquivo. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      console.error('❌ Falha ao obter URL do PDF');
      toast({
        title: "❌ Erro no Download",
        description: "Não foi possível obter o arquivo PDF",
        variant: "destructive",
      });
    }
  };

  // MÉTODO MELHORADO: Recarregar dados COM FORÇA
  const refreshPolicies = async () => {
    console.log('🔄 [refreshPolicies] Forçando reload completo do banco...');
    setIsLoading(true);
    try {
      await loadPersistedPolicies();
      console.log('✅ [refreshPolicies] Reload concluído');
    } finally {
      setIsLoading(false);
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
