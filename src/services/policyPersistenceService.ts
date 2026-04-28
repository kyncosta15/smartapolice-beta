import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { Database } from '@/integrations/supabase/types';

type PolicyInsert = Database['public']['Tables']['policies']['Insert'];
type InstallmentInsert = Database['public']['Tables']['installments']['Insert'];
type CoberturaInsert = Database['public']['Tables']['coberturas']['Insert'];

import { safeString, safeConvertArray } from '@/utils/safeDataRenderer';

export class PolicyPersistenceService {
  
  // FUNÇÃO PRINCIPAL: Determinar status baseado na data de vencimento e início
  private static determineStatusFromDate(expirationDate: string, startDate?: string): string {
    if (!expirationDate) return 'vigente';
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    if (isNaN(expDate.getTime())) {
      console.error(`❌ Data inválida: ${expirationDate}`);
      return 'vigente';
    }
    
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Determinando status por data: ${expirationDate}, dias: ${diffDays}`);
    
    // REGRA NOVA: Apólices com vigência fora do ano atual são "antigas" (não renovadas)
    const expYear = expDate.getFullYear();
    if (startDate) {
      const startDateObj = new Date(startDate);
      const startYear = startDateObj.getFullYear();
      // Se a vigência terminou antes do ano atual, é antiga (não renovada)
      if (expYear < currentYear) {
        console.log(`📅 Apólice antiga: vigência terminou em ${expYear} (atual: ${currentYear})`);
        return 'nao_renovada';
      }
      // Se início é anterior ao ano atual E já venceu, também é antiga
      if (startYear < currentYear && diffDays < 0) {
        console.log(`📅 Apólice antiga: iniciou em ${startYear} e já venceu`);
        return 'nao_renovada';
      }
    }
    
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
      'renovada': 'renovada',
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
      // Validar arquivo
      if (!file || file.size === 0) {
        console.error('❌ Arquivo inválido ou vazio');
        return null;
      }

      console.log(`📤 Preparando upload - Arquivo: ${file.name}, Tamanho: ${file.size} bytes`);

      // Sanitizar nome do arquivo - remover espaços e caracteres especiais
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase();
      
      const fileName = `${userId}/${Date.now()}_${sanitizedFileName}`;
      
      console.log(`📤 Enviando PDF para storage: ${fileName}`);
      
      // Fazer upload com o arquivo original (não converter)
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (error) {
        console.error('❌ Erro ao fazer upload do PDF:', error);
        return null;
      }

      console.log(`✅ PDF salvo no storage: ${data.path}`);
      
      // Verificar se arquivo foi salvo corretamente
      const { data: checkData, error: checkError } = await supabase.storage
        .from('pdfs')
        .list(userId);
      
      if (!checkError) {
        const uploadedFile = checkData?.find(f => f.name === `${Date.now()}_${sanitizedFileName}`.split('/').pop());
        if (uploadedFile) {
          console.log(`✅ Verificação: Arquivo existe no bucket, tamanho: ${uploadedFile.metadata?.size || 'desconhecido'}`);
        }
      }
      
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

      // DETERMINAR STATUS CORRETO baseado na data de vencimento E início
      const expirationDate = policyData.expirationDate || policyData.endDate;
      const startDate = policyData.startDate;
      const statusFromDate = this.determineStatusFromDate(expirationDate, startDate);
      const finalStatus = this.mapToValidStatus(policyData.status || statusFromDate);

      console.log(`🎯 Status final determinado: ${finalStatus}`, {
        originalStatus: policyData.status,
        statusFromDate,
        expirationDate,
        startDate
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
        status: 'a vencer'
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
    const { normalizePolicy } = await import('@/lib/policies');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
        installments!fk_installments_policy_id (
            id,
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
        console.error('❌ Erro ao carregar apólices:', policiesError);
        return [];
      }

      if (!policies || policies.length === 0) {
        return [];
      }

      console.log(`✅ ${policies.length} apólices carregadas`);

      // Process policies with COMPLETE SAFE CONVERSION
      const parsedPolicies: ParsedPolicyData[] = policies.map((policy) => {
        const normalizedPolicy = normalizePolicy(policy);
        const finalStatus = this.mapToValidStatus(policy.status || 'vigente');

        const valorMensalDoBanco = Number(policy.custo_mensal || policy.valor_parcela || policy.valor_mensal_num) || 0;
        const premioDoBanco = Number(policy.valor_premio) || 0;
        
        const convertedPolicy = {
          id: policy.id,
          name: safeString(normalizedPolicy.name),
          type: safeString(normalizedPolicy.type),
          insurer: safeString(normalizedPolicy.insurer),
          premium: premioDoBanco,
          valor_premio: premioDoBanco,
          monthlyAmount: valorMensalDoBanco,
          custo_mensal: valorMensalDoBanco,
          valor_parcela: valorMensalDoBanco,
          startDate: safeString(policy.inicio_vigencia || new Date().toISOString().split('T')[0]),
          endDate: safeString(policy.fim_vigencia || new Date().toISOString().split('T')[0]), 
          policyNumber: safeString(policy.numero_apolice),
          paymentFrequency: 'mensal',
          status: finalStatus,
          pdfPath: safeString(policy.arquivo_url),
          extractedAt: safeString(policy.extraction_timestamp || policy.created_at || new Date().toISOString()),
          
          expirationDate: safeString(policy.expiration_date || policy.fim_vigencia || new Date().toISOString().split('T')[0]),
          policyStatus: finalStatus as any,
          quantidade_parcelas: policy.quantidade_parcelas || 1,
          
          installments: (policy.installments as any[])?.map(inst => ({
            id: inst.id,
            numero: Number(inst.numero_parcela) || 0,
            valor: Number(inst.valor) || 0,
            data: safeString(inst.data_vencimento),
            status: (inst.status === 'paga' || inst.status === 'pendente') ? inst.status : 'pendente'
          })) || [],
          
          coberturas: (policy.coberturas as any[])?.map(cob => ({
            id: cob.id,
            descricao: safeString(cob.descricao),
            lmi: cob.lmi ? Number(cob.lmi) : undefined
          })) || [],
          
          insuredName: safeString(policy.segurado),
          documento: safeString(policy.documento),
          documento_tipo: (policy.documento_tipo === 'CPF' || policy.documento_tipo === 'CNPJ') ? policy.documento_tipo as 'CPF' | 'CNPJ' : undefined,
          deductible: policy.franquia || undefined,
          vehicleModel: safeString(policy.modelo_veiculo),
          uf: safeString(policy.uf),
          entity: safeString(policy.corretora || 'Não informado'),
          category: safeString(normalizedPolicy.category || 'Geral'),
          coverage: (policy.coberturas as any[])?.map(cob => safeString(cob.descricao)) || ['Cobertura Básica'],
          totalCoverage: Number(policy.valor_mensal_num || policy.custo_mensal) * 12 || 0,
          limits: 'R$ 100.000 por sinistro',
          nosnum: policy.nosnum,
          codfil: policy.codfil,
          
          marca: safeString(policy.marca),
          placa: safeString(policy.placa),
          ano_modelo: safeString(policy.ano_modelo),
          nome_embarcacao: safeString(policy.nome_embarcacao),
          
          nome_plano_saude: policy.nome_plano_saude || null,

          // Campos de renovação (necessários p/ tooltip de relação entre apólices)
          renovado_nosnum: (policy as any).renovado_nosnum ?? null,
          renovado_codfil: (policy as any).renovado_codfil ?? null,
          sit_renovacao: (policy as any).sit_renovacao ?? null,
          sit_renovacao_txt: (policy as any).sit_renovacao_txt ?? null,
        };

        return convertedPolicy;
      });

      // AUTO-GERAR parcelas apenas para apólices que têm metadados mas nenhuma parcela no DB
      // Isso roda apenas uma vez pois na próxima carga as parcelas já existirão
      const policiesToGenerate = parsedPolicies.filter(p => {
        const hasNoInstallments = !p.installments || p.installments.length === 0;
        const monthlyVal = p.monthlyAmount || (p as any).valor_parcela || (p as any).custo_mensal || 0;
        const hasValue = monthlyVal > 0;
        return hasNoInstallments && hasValue;
      });

      if (policiesToGenerate.length > 0) {
        console.log(`🔄 Auto-gerando parcelas para ${policiesToGenerate.length} apólices`);
        for (const policy of policiesToGenerate) {
          try {
            const numParcelas = policy.quantidade_parcelas || 12;
            const valorParcela = Number(policy.monthlyAmount || (policy as any).valor_parcela || (policy as any).custo_mensal) || 0;
            const startDate = policy.startDate || new Date().toISOString().split('T')[0];
            
            const generatedInstallments = this.generateBasicInstallments(numParcelas, valorParcela, startDate);
            
            await this.saveInstallments(policy.id, generatedInstallments, userId);
            
            policy.installments = generatedInstallments.map((inst, idx) => ({
              id: `generated-${idx}`,
              numero: inst.numero,
              valor: inst.valor,
              data: inst.data,
              status: inst.status
            }));
          } catch (err) {
            console.error(`❌ Erro ao auto-gerar parcelas para ${policy.id}:`, err);
          }
        }
      }

      return parsedPolicies;

    } catch (error) {
      console.error('❌ Erro crítico ao carregar apólices:', error);
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
        status: 'a vencer' as const
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
      console.log('🔍 Gerando URL de download para:', pdfPath);
      
      // Usar Edge Function que tem acesso com service role
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('❌ Usuário não autenticado');
        return null;
      }

      console.log('📡 Chamando edge function download-pdf');

      const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pdfPath })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na edge function:', response.status, errorText);
        return null;
      }

      // Criar blob URL do PDF retornado
      const blob = await response.blob();
      
      console.log('📦 Blob recebido - Tamanho:', blob.size, 'Tipo:', blob.type);
      
      if (blob.size === 0) {
        console.error('❌ Blob está vazio!');
        return null;
      }
      
      const blobUrl = URL.createObjectURL(blob);
      console.log('✅ Blob URL criada:', blobUrl);
      
      return blobUrl;
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
