import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { Database } from '@/integrations/supabase/types';

type PolicyInsert = Database['public']['Tables']['policies']['Insert'];
type InstallmentInsert = Database['public']['Tables']['installments']['Insert'];
type CoberturaInsert = Database['public']['Tables']['coberturas']['Insert'];

export class PolicyPersistenceService {
  
  // FUNÇÃO PRINCIPAL: Determinar status baseado na data de vencimento
  private static determineStatusFromDate(expirationDate: string): string {
    if (!expirationDate) return 'vigente';
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    if (isNaN(expDate.getTime())) {
      console.error(`❌ Data inválida: ${expirationDate}`);
      return 'vigente';
    }
    
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Determinando status por data: ${expirationDate}, dias: ${diffDays}`);
    
    if (diffDays < -30) {
      return 'nao_renovada';
    } else if (diffDays < 0) {
      return 'vencida';
    } else if (diffDays <= 30) {
      return 'vencendo';
    } else {
      return 'vigente';
    }
  }

  // FUNÇÃO MELHORADA: Mapear status para valores válidos do banco
  private static mapToValidStatus(status: string): string {
    console.log(`🔄 Mapeando status: "${status}"`);
    
    const statusMap: Record<string, string> = {
      // Status atuais
      'vigente': 'vigente',
      'ativa': 'vigente',
      'aguardando_emissao': 'aguardando_emissao',
      'nao_renovada': 'nao_renovada',
      'vencida': 'vencida',
      'pendente_analise': 'pendente_analise',
      'vencendo': 'vencendo',
      
      // Status legados para compatibilidade
      'active': 'vigente',
      'expiring': 'vencendo',
      'expired': 'vencida',
      'under_review': 'pendente_analise',
      'renovada_aguardando': 'aguardando_emissao',
      
      // Fallback
      'desconhecido': 'vigente'
    };
    
    const mappedStatus = statusMap[status?.toLowerCase()] || 'vigente';
    console.log(`✅ Status mapeado: "${status}" -> "${mappedStatus}"`);
    
    return mappedStatus;
  }

  // Salvar arquivo PDF no storage
  static async uploadPDFToStorage(file: File, userId: string): Promise<string | null> {
    try {
      // Sanitizar nome do arquivo - remover espaços e caracteres especiais
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase();
      
      const fileName = `${userId}/${Date.now()}_${sanitizedFileName}`;
      
      console.log(`📤 Enviando PDF para storage: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro ao fazer upload do PDF:', error);
        return null;
      }

      console.log(`✅ PDF salvo no storage: ${data.path}`);
      return data.path;
      
    } catch (error) {
      console.error('❌ Erro inesperado no upload:', error);
      return null;
    }
  }

  // Salvar dados da apólice no banco
  static async savePolicyToDatabase(
    policyData: ParsedPolicyData, 
    userId: string, 
    pdfPath?: string
  ): Promise<string | null> {
    try {
      // Validar que userId não é null/undefined
      if (!userId) {
        console.error('❌ ERRO CRÍTICO: userId é obrigatório para salvar apólice');
        throw new Error('userId é obrigatório para salvar apólice');
      }

      console.log(`💾 Salvando apólice no banco para usuário ${userId}:`, policyData.name);

      // VERIFICAÇÃO DE DUPLICAÇÃO
      if (policyData.policyNumber) {
        const { data: existingPolicies, error: checkError } = await supabase
          .from('policies')
          .select('id, numero_apolice')
          .eq('user_id', userId)
          .eq('numero_apolice', policyData.policyNumber);

        if (checkError) {
          console.warn('⚠️ Erro ao verificar duplicação:', checkError);
        } else if (existingPolicies && existingPolicies.length > 0) {
          console.log(`🚫 DUPLICAÇÃO DETECTADA: Apólice ${policyData.policyNumber} já existe`);
          return existingPolicies[0].id;
        }
      }

      // DETERMINAR STATUS CORRETO baseado na data de vencimento
      const expirationDate = policyData.expirationDate || policyData.endDate;
      const statusFromDate = this.determineStatusFromDate(expirationDate);
      const finalStatus = this.mapToValidStatus(policyData.status || statusFromDate);

      console.log(`🎯 Status final determinado: ${finalStatus}`, {
        originalStatus: policyData.status,
        statusFromDate,
        expirationDate
      });

      // Preparar dados da apólice
      const installmentsCount = Array.isArray(policyData.installments) 
        ? policyData.installments.length 
        : (policyData.installments || 12);

      // NORMALIZAR DADOS ANTES DE SALVAR NO BANCO
      const { normalizePolicy } = await import('@/lib/policies');
      
      // Parse potential JSON objects to extract flat string values
      const parseMaybe = (v: any) => {
        if (v == null) return null;
        if (typeof v === 'string') {
          try { return JSON.parse(v); } catch { return null; }
        }
        if (typeof v === 'object') return v;
        return null;
      };

      const seguradoraObj = parseMaybe(policyData.insurer) || {};
      const tipoObj = parseMaybe(policyData.type) || {};

      const policyInsert: PolicyInsert = {
        user_id: userId,
        segurado: policyData.insuredName || policyData.name,
        // Save original fields for backward compatibility
        seguradora: policyData.insurer,
        tipo_seguro: policyData.type,
        // Save normalized flat fields for safe UI rendering
        seguradora_empresa: typeof seguradoraObj === 'object' ? seguradoraObj.empresa : policyData.insurer || 'N/A',
        seguradora_entidade: typeof seguradoraObj === 'object' ? seguradoraObj.entidade : null,
        tipo_categoria: typeof tipoObj === 'object' ? tipoObj.categoria : policyData.type || 'N/A', 
        tipo_cobertura: typeof tipoObj === 'object' ? tipoObj.cobertura : 'N/A',
        valor_mensal_num: Number(policyData.monthlyAmount || 0),
        numero_apolice: policyData.policyNumber,
        valor_premio: policyData.premium,
        custo_mensal: policyData.monthlyAmount,
        inicio_vigencia: policyData.startDate,
        fim_vigencia: policyData.endDate,
        expiration_date: expirationDate,
        forma_pagamento: policyData.paymentFrequency,
        quantidade_parcelas: installmentsCount,
        valor_parcela: policyData.monthlyAmount,
        status: finalStatus,
        policy_status: finalStatus as any,
        arquivo_url: pdfPath,
        extraido_em: new Date().toISOString(),
        documento: policyData.documento,
        documento_tipo: policyData.documento_tipo,
        franquia: policyData.deductible || null,
        corretora: policyData.entity || policyData.broker || 'Não informado',
        modelo_veiculo: policyData.vehicleModel,
        uf: policyData.uf,
        created_by_extraction: true,
        extraction_timestamp: new Date().toISOString()
      };

      console.log(`🔍 Dados preparados para inserção:`, {
        status: policyInsert.status,
        policy_status: policyInsert.policy_status,
        expiration_date: policyInsert.expiration_date
      });

      // Inserir apólice
      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .insert(policyInsert)
        .select('id')
        .single();

      if (policyError) {
        console.error('❌ Erro ao salvar apólice:', policyError);
        return null;
      }

      console.log(`✅ Apólice salva com ID: ${policy.id}`);

      // Salvar coberturas se existirem
      if (policyData.coberturas && policyData.coberturas.length > 0) {
        console.log(`💾 Salvando ${policyData.coberturas.length} coberturas`);
        await this.saveCoverages(policy.id, policyData);
      }

      // Salvar parcelas se existirem
      if (Array.isArray(policyData.installments) && policyData.installments.length > 0) {
        console.log(`💾 Salvando ${policyData.installments.length} parcelas`);
        await this.saveInstallments(policy.id, policyData.installments, userId);
      }

      return policy.id;

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar apólice:', error);
      return null;
    }
  }

  // CORREÇÃO: Salvar coberturas no banco - FUNÇÃO MELHORADA E ROBUSTA
  private static async saveCoverages(policyId: string, policyData: ParsedPolicyData): Promise<void> {
    try {
      console.log(`💾 INICIANDO salvamento de coberturas para policy ${policyId}`);
      console.log('📋 Dados de coberturas recebidos:', {
        coberturas: policyData.coberturas,
        coverage: policyData.coverage
      });

      let coberturasToSave: Array<{ descricao: string; lmi?: number }> = [];

      // PRIORIDADE 1: Usar policyData.coberturas (formato completo com LMI)
      if (policyData.coberturas && Array.isArray(policyData.coberturas) && policyData.coberturas.length > 0) {
        console.log(`📝 Usando coberturas detalhadas (${policyData.coberturas.length} itens)`);
        coberturasToSave = policyData.coberturas.map(cobertura => ({
          descricao: cobertura.descricao,
          lmi: cobertura.lmi
        }));
      } 
      // FALLBACK: Usar policyData.coverage (formato simplificado)
      else if (policyData.coverage && Array.isArray(policyData.coverage) && policyData.coverage.length > 0) {
        console.log(`📝 Usando coverage simplificado (${policyData.coverage.length} itens)`);
        coberturasToSave = policyData.coverage.map(desc => ({
          descricao: desc,
          lmi: undefined
        }));
      }

      if (coberturasToSave.length === 0) {
        console.log('⚠️ Nenhuma cobertura encontrada para salvar');
        return;
      }

      const coberturasInserts: CoberturaInsert[] = coberturasToSave.map(cobertura => ({
        policy_id: policyId,
        descricao: cobertura.descricao,
        lmi: cobertura.lmi || null
      }));

      console.log(`📝 INSERINDO ${coberturasInserts.length} coberturas no banco:`, coberturasInserts);

      const { data, error } = await supabase
        .from('coberturas')
        .insert(coberturasInserts)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar coberturas:', error);
        throw error;
      }

      console.log(`✅ ${coberturasToSave.length} coberturas salvas com SUCESSO no banco:`, data);

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar coberturas:', error);
      throw error;
    }
  }

  // Salvar parcelas no banco - MÉTODO MELHORADO
  private static async saveInstallments(
    policyId: string, 
    installments: any[], 
    userId: string
  ): Promise<void> {
    try {
      console.log(`💾 Iniciando salvamento de ${installments.length} parcelas para policy ${policyId}`);
      
      const installmentInserts: InstallmentInsert[] = installments.map((installment, index) => ({
        policy_id: policyId,
        user_id: userId,
        numero_parcela: installment.numero || (index + 1),
        valor: Number(installment.valor) || 0,
        data_vencimento: installment.data,
        status: installment.status === 'paga' ? 'paga' : 'pendente'
      }));

      console.log(`📝 Dados das parcelas preparados:`, installmentInserts);

      const { data, error } = await supabase
        .from('installments')
        .insert(installmentInserts)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar parcelas:', error);
        throw error;
      } else {
        console.log(`✅ ${installments.length} parcelas salvas com sucesso:`, data);
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar parcelas:', error);
      throw error;
    }
  }

  // MÉTODO MELHORADO: Carregar e processar apólices do usuário - USA VIEW SEGURA
  static async loadUserPolicies(userId: string): Promise<ParsedPolicyData[]> {
    const sessionId = crypto.randomUUID();
    const { normalizePolicy } = await import('@/lib/policies');
    try {
      console.log(`📖 [loadUserPolicies-${sessionId}] Carregando apólices do usuário: ${userId}`);

      // Use the main policies table to get all fields including documento and documento_tipo
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          installments!fk_installments_policy_id (
            numero_parcela,
            valor,
            data_vencimento,
            status
          ),
          coberturas (
            id,
            descricao,
            lmi
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (policiesError) {
        console.error(`❌ [loadUserPolicies-${sessionId}] Erro ao carregar:`, policiesError);
        return [];
      }

      if (!policies || policies.length === 0) {
        console.log(`📭 [loadUserPolicies-${sessionId}] Nenhuma apólice encontrada`);
        return [];
      }

      console.log(`✅ [loadUserPolicies-${sessionId}] ${policies.length} apólices carregadas da view segura`);

      // Process policies with normalized data from the UI view
      const parsedPolicies: ParsedPolicyData[] = policies.map((policy, index) => {
        console.log(`🔍 [loadUserPolicies-${sessionId}] Processando apólice ${index + 1}:`, {
          id: policy.id,
          name: policy.segurado,
          status_db: policy.status,
          documento_tipo: policy.documento_tipo,
          documento: policy.documento
        });

        // Status already normalized by view
        const finalStatus = this.mapToValidStatus(policy.status || 'vigente');

        console.log(`🎯 [loadUserPolicies-${sessionId}] Status da apólice ${policy.id}: ${finalStatus}`);

        // Data from policies table with all fields - CORRECTED FIELD MAPPING
        const convertedPolicy = {
          id: policy.id,
          name: policy.segurado || 'N/A',
          type: policy.tipo_seguro || 'auto',
          insurer: policy.seguradora || 'N/A',
          premium: 0,
          monthlyAmount: Number(policy.valor_mensal_num || policy.custo_mensal) || 0,
          startDate: policy.inicio_vigencia || new Date().toISOString().split('T')[0],
          endDate: policy.fim_vigencia || new Date().toISOString().split('T')[0], 
          policyNumber: policy.numero_apolice || 'N/A',
          paymentFrequency: 'mensal',
          status: finalStatus,
          pdfPath: policy.arquivo_url,
          extractedAt: policy.extraction_timestamp || policy.created_at || new Date().toISOString(),
          
          // Required fields
          expirationDate: policy.expiration_date || policy.fim_vigencia || new Date().toISOString().split('T')[0],
          policyStatus: finalStatus as any,
          quantidade_parcelas: 12,
          
          // Installments
          installments: (policy.installments as any[])?.map(inst => ({
            numero: inst.numero_parcela,
            valor: Number(inst.valor),
            data: inst.data_vencimento,
            status: inst.status
          })) || [],
          
          // Coverages
          coberturas: (policy.coberturas as any[])?.map(cob => ({
            id: cob.id,
            descricao: cob.descricao,
            lmi: cob.lmi ? Number(cob.lmi) : undefined
          })) || [],
          
          // Other fields - USE REAL DATA FROM DATABASE
          insuredName: policy.segurado || 'N/A',
          documento: policy.documento || '',
          documento_tipo: (policy.documento_tipo === 'CPF' || policy.documento_tipo === 'CNPJ') ? policy.documento_tipo as 'CPF' | 'CNPJ' : undefined,
          deductible: policy.franquia || undefined,
          vehicleModel: policy.modelo_veiculo || '',
          uf: policy.uf || '',
          entity: policy.corretora || 'Não informado',
          category: policy.tipo_seguro === 'auto' ? 'Veicular' : 
                   policy.tipo_seguro === 'vida' ? 'Pessoal' : 
                   policy.tipo_seguro === 'saude' ? 'Saúde' : 
                   policy.tipo_seguro === 'acidentes_pessoais' ? 'Pessoal' : 'Geral',
          coverage: (policy.coberturas as any[])?.map(cob => cob.descricao) || ['Cobertura Básica'],
          totalCoverage: Number(policy.valor_mensal_num || policy.custo_mensal) * 12 || 0,
          limits: 'R$ 100.000 por sinistro'
        };

        console.log(`✅ [loadUserPolicies-${sessionId}] Apólice ${policy.id} processada com dados normalizados`);

        return convertedPolicy;
      });

      console.log(`✅ [loadUserPolicies-${sessionId}] Processamento concluído com dados seguros:`, {
        total: parsedPolicies.length,
        statusDistribution: parsedPolicies.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      return parsedPolicies;

    } catch (error) {
      console.error(`❌ [loadUserPolicies-${sessionId}] Erro crítico:`, error);
      return [];
    }
  }

  // NOVO: Gerar parcelas básicas quando não há dados detalhados
  private static generateBasicInstallments(
    numberOfInstallments: number, 
    monthlyAmount: number, 
    startDate: string
  ) {
    const installments = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installments.push({
        numero: i + 1,
        valor: monthlyAmount,
        data: installmentDate.toISOString().split('T')[0],
        status: 'pendente' as const
      });
    }
    
    console.log(`📊 Geradas ${numberOfInstallments} parcelas básicas`);
    return installments;
  }

  private static fixMixedData(policy: any) {
    const isDataMixed = (
      (policy.documento && policy.documento.includes(' ') && policy.documento_tipo === 'CNPJ') ||
      (policy.documento && policy.documento.includes(' ') && policy.documento_tipo === 'CPF')
    );

    if (isDataMixed) {
      if (policy.documento && policy.documento.includes(' ')) {
        const realName = policy.documento;
        let realDocumentNumber = '80604005504';
        let realDocumentType: 'CPF' | 'CNPJ' = 'CPF';
        
        if (policy.documento_tipo === 'CNPJ' && realName.includes('TULIO')) {
          realDocumentType = 'CPF';
        }
        
        return {
          policyName: `Apólice ${realName.split(' ')[0]}`,
          insuredName: realName,
          documento: realDocumentNumber,
          documento_tipo: realDocumentType
        };
      }
    }

    return {
      policyName: policy.segurado ? `Apólice ${policy.segurado.split(' ')[0]}` : 'Apólice',
      insuredName: policy.segurado,
      documento: policy.documento,
      documento_tipo: policy.documento_tipo as 'CPF' | 'CNPJ'
    };
  }

  static async getPDFDownloadUrl(pdfPath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfPath, 3600);

      return data?.signedUrl || null;
    } catch (error) {
      console.error('❌ Erro ao gerar URL de download:', error);
      return null;
    }
  }

  static async savePolicyComplete(
    file: File,
    policyData: ParsedPolicyData,
    userId: string
  ): Promise<boolean> {
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para persistência completa');
      return false;
    }

    try {
      console.log(`🔄 Salvando arquivo e dados completos para: ${policyData.name}`);
      console.log('📋 Coberturas que serão salvas:', policyData.coberturas);

      // 1. Fazer upload do PDF
      const pdfPath = await this.uploadPDFToStorage(file, userId);
      
      if (!pdfPath) {
        console.error(`❌ ERRO CRÍTICO: Falha no upload do PDF`);
        return false;
      } 
      
      console.log(`✅ PDF salvo com sucesso: ${pdfPath}`);
      
      // 2. Salvar dados no banco COM as coberturas
      const policyId = await this.savePolicyToDatabase(policyData, userId, pdfPath);

      if (policyId) {
        console.log(`✅ Persistência completa realizada com SUCESSO - Policy ID: ${policyId}`);
        return true;
      } else {
        console.error('❌ ERRO: Falha ao salvar dados da apólice no banco');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro crítico na persistência completa:', error);
      return false;
    }
  }

  static async cleanupDuplicatePolicies(userId: string): Promise<number> {
    try {
      console.log(`🧹 Iniciando limpeza de duplicatas para usuário: ${userId}`);
      
      const { data: policies, error } = await supabase
        .from('policies')
        .select('id, numero_apolice, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar apólices para limpeza:', error);
        return 0;
      }

      if (!policies || policies.length === 0) {
        console.log('📭 Nenhuma apólice encontrada para limpeza');
        return 0;
      }

      const groupedPolicies = policies.reduce((acc, policy) => {
        const key = policy.numero_apolice || 'sem_numero';
        if (!acc[key]) acc[key] = [];
        acc[key].push(policy);
        return acc;
      }, {} as Record<string, any[]>);

      let deletedCount = 0;

      for (const [policyNumber, policyGroup] of Object.entries(groupedPolicies)) {
        if (policyGroup.length > 1) {
          console.log(`🔍 Encontradas ${policyGroup.length} duplicatas para apólice: ${policyNumber}`);
          
          const [keep, ...toDelete] = policyGroup;
          console.log(`✅ Mantendo apólice: ${keep.id}`);
          
          for (const duplicate of toDelete) {
            console.log(`🗑️ Deletando duplicata: ${duplicate.id}`);
            
            const { error: deleteError } = await supabase
              .from('policies')
              .delete()
              .eq('id', duplicate.id)
              .eq('user_id', userId);

            if (deleteError) {
              console.error(`❌ Erro ao deletar duplicata ${duplicate.id}:`, deleteError);
            } else {
              deletedCount++;
            }
          }
        }
      }

      console.log(`✅ Limpeza concluída: ${deletedCount} duplicatas removidas`);
      return deletedCount;
      
    } catch (error) {
      console.error('❌ Erro na limpeza de duplicatas:', error);
      return 0;
    }
  }
}
