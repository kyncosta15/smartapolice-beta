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

  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(() => {
        loadPersistedPolicies();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setPolicies([]);
    }
  }, [user?.id, user?.email]);

  const loadPersistedPolicies = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro na sessão:', sessionError);
      }

      if (!session && user?.id) {
        setPolicies([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!session) {
        throw new Error('Sessão não encontrada - faça login novamente');
      }

      const loadedPolicies = await PolicyPersistenceService.loadUserPolicies(user.id);
      
      console.log(`✅ ${loadedPolicies.length} apólices carregadas`);
      
      const mappedPolicies = loadedPolicies.map(policy => {
        const normalized = normalizePolicy(policy);
        return {
          ...normalized,
          status: mapLegacyStatus(normalized.status)
        };
      });
      
      setPolicies(mappedPolicies);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('❌ Erro ao carregar apólices:', errorMessage);
      
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
      // Helper para truncar strings com segurança
      const truncate = (val: any, maxLen: number): string | null => {
        if (val === undefined || val === null) return null;
        const str = String(val).trim();
        return str ? str.substring(0, maxLen) : null;
      };

      // CRÍTICO: Criar objeto limpo DIRETAMENTE dos updates
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) {
        dbUpdates.segurado = truncate(updates.name, 255);
      }
      
      // Campos de texto com truncamento baseado nos limites do banco
      if (updates.type !== undefined) dbUpdates.tipo_seguro = truncate(updates.type, 100);
      if ((updates as any).tipo_seguro !== undefined) dbUpdates.tipo_seguro = truncate((updates as any).tipo_seguro, 100);
      if (updates.insurer !== undefined) dbUpdates.seguradora = truncate(updates.insurer, 255);
      if (updates.policyNumber !== undefined) dbUpdates.numero_apolice = truncate(updates.policyNumber, 255);
      
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
        dbUpdates.status = truncate(mappedStatus, 50);
      }
      
      // Campos de texto com limites específicos
      if (updates.category !== undefined) dbUpdates.forma_pagamento = truncate(updates.category, 100);
      if (updates.entity !== undefined) dbUpdates.corretora = truncate(updates.entity, 255);
      if (updates.documento !== undefined) dbUpdates.documento = truncate(updates.documento, 20);
      if (updates.documento_tipo !== undefined) dbUpdates.documento_tipo = truncate(updates.documento_tipo, 10);
      if (updates.vehicleModel !== undefined) dbUpdates.modelo_veiculo = truncate(updates.vehicleModel, 255);
      if ((updates as any).modelo_veiculo !== undefined) dbUpdates.modelo_veiculo = truncate((updates as any).modelo_veiculo, 255);
      
      // Campos de veículo/embarcação
      if ((updates as any).marca !== undefined) {
        dbUpdates.marca = truncate((updates as any).marca, 255);
      }
      if ((updates as any).placa !== undefined) {
        const placaValue = String((updates as any).placa || '').trim().toUpperCase();
        dbUpdates.placa = placaValue ? placaValue.substring(0, 20) : null;
      }
      if ((updates as any).nome_embarcacao !== undefined) {
        dbUpdates.nome_embarcacao = truncate((updates as any).nome_embarcacao, 255);
      }
      if ((updates as any).ano_modelo !== undefined) {
        dbUpdates.ano_modelo = truncate((updates as any).ano_modelo, 10); // varchar(10)
      }
      
      if (updates.uf !== undefined) {
        const ufValue = String(updates.uf || '').toUpperCase().trim();
        dbUpdates.uf = ufValue ? ufValue.substring(0, 2) : null;
      }
      if (updates.deductible !== undefined) dbUpdates.franquia = updates.deductible;
      if ((updates as any).franquia !== undefined) dbUpdates.franquia = (updates as any).franquia;
      if (updates.responsavel_nome !== undefined) dbUpdates.responsavel_nome = truncate(updates.responsavel_nome, 255);
      
      // Campo específico para saúde
      if ((updates as any).nome_plano_saude !== undefined) {
        dbUpdates.nome_plano_saude = truncate((updates as any).nome_plano_saude, 255);
      }

      console.log('💾 [updatePolicy] Atualizando apólice:', policyId, Object.keys(dbUpdates));

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
        return false;
      }

      const dbRecord = data && data.length > 0 ? data[0] : null;
      
      console.log('✅ [updatePolicy] Dados retornados do banco:', {
        id: dbRecord?.id,
        marca: dbRecord?.marca,
        placa: dbRecord?.placa,
        modelo_veiculo: dbRecord?.modelo_veiculo,
        nome_embarcacao: dbRecord?.nome_embarcacao,
        ano_modelo: dbRecord?.ano_modelo,
        franquia: dbRecord?.franquia,
        segurado: dbRecord?.segurado
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
              // Campos de veículo/embarcação - usar valor do banco sempre que disponível
              vehicleModel: dbRecord ? (dbRecord.modelo_veiculo ?? null) : p.vehicleModel,
              modelo_veiculo: dbRecord ? (dbRecord.modelo_veiculo ?? null) : (p as any).modelo_veiculo,
              marca: dbRecord ? (dbRecord.marca ?? null) : (p as any).marca,
              placa: dbRecord ? (dbRecord.placa ?? null) : (p as any).placa,
              nome_embarcacao: dbRecord ? (dbRecord.nome_embarcacao ?? null) : (p as any).nome_embarcacao,
              ano_modelo: dbRecord ? (dbRecord.ano_modelo ?? null) : (p as any).ano_modelo,
              deductible: dbRecord ? (dbRecord.franquia ?? 0) : p.deductible,
              franquia: dbRecord ? (dbRecord.franquia ?? 0) : (p as any).franquia
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
      console.error('❌ [updatePolicy] Erro inesperado:', error);
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
        
        // Usar Web Share API APENAS em dispositivos móveis
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints > 0 && window.innerWidth <= 768);
        
        if (isMobile && navigator.share && navigator.canShare) {
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
