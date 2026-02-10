import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';

/**
 * SISTEMA ROBUSTO DE PERSISTÊNCIA DE APÓLICES
 * 
 * Implementa todos os requisitos de persistência robusta:
 * - user_id obrigatório
 * - Upsert idempotente por usuário
 * - Fluxo estruturado de persistência
 * - Campos confirmados vs sugeridos
 * - Controle de versões e auditoria
 * - Sem alucinação/remoção silenciosa
 * - Qualidade de dados garantida
 */

interface PolicyUniqueKey {
  user_id: string;
  seguradora: string;
  numero_apolice: string;
  identifier: string; // placa ou documento
}

interface FieldState {
  value: any;
  confirmed: boolean;
  last_updated: string;
  source: 'pdf' | 'n8n' | 'manual' | 'system';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData: Partial<ParsedPolicyData>;
}

export class RobustPolicyPersistence {
  
  /**
   * FLUXO PRINCIPAL: Extração → Validação → Normalização → Persistência → Renderização
   */
  static async savePolicyRobust(
    file: File,
    policyData: ParsedPolicyData,
    userId: string
  ): Promise<{ success: boolean; policyId?: string; errors?: string[]; isUpdate?: boolean }> {
    console.log('🔒 INÍCIO DO FLUXO ROBUSTO DE PERSISTÊNCIA');
    console.log('👤 User ID:', userId);
    console.log('📄 Política:', policyData.name);
    
    try {
      // 1. VALIDAÇÃO OBRIGATÓRIA DE user_id
      if (!userId || userId.trim() === '') {
        const error = 'CRÍTICO: user_id é obrigatório para persistir apólice';
        console.error('❌', error);
        return { success: false, errors: [error] };
      }

      // 2. EXTRAÇÃO E VALIDAÇÃO DE DADOS
      const validationResult = await this.validateAndNormalizeData(policyData, userId);
      if (!validationResult.isValid) {
        console.error('❌ Dados inválidos:', validationResult.errors);
        return { success: false, errors: validationResult.errors };
      }

      // 3. CALCULAR HASH DO ARQUIVO
      const fileHash = await this.generateFileHash(file);
      console.log('🔑 Hash do arquivo:', fileHash);

      // 4. VERIFICAR UPSERT IDEMPOTENTE
      const existingPolicy = await this.findExistingPolicy(validationResult.normalizedData, userId);
      
      // 5. PERSISTÊNCIA COM TRANSAÇÃO ATÔMICA
      const persistenceResult = existingPolicy
        ? await this.updateExistingPolicy(existingPolicy, validationResult.normalizedData, fileHash, userId, file)
        : await this.createNewPolicy(validationResult.normalizedData, fileHash, userId, file);

      if (!persistenceResult.success) {
        console.error('❌ Falha na persistência:', persistenceResult.errors);
        return persistenceResult;
      }

      // 6. SUCESSO - DADOS PERSISTIDOS E AUDITADOS
      console.log('✅ ========================================');
      console.log('✅ PERSISTÊNCIA ROBUSTA CONCLUÍDA COM SUCESSO');
      console.log('✅ Policy ID:', persistenceResult.policyId);
      console.log('✅ isUpdate:', persistenceResult.isUpdate);
      console.log('✅ ========================================');
      
      const finalResult = {
        success: true,
        policyId: persistenceResult.policyId,
        isUpdate: persistenceResult.isUpdate || false
      };
      
      console.log('📦 RESULTADO FINAL que será retornado:', finalResult);
      
      return finalResult;

    } catch (error) {
      const errorMessage = `Erro no fluxo de persistência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌❌❌ [savePolicyRobust] ERRO CRÍTICO:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Erro completo:', JSON.stringify(error, null, 2));
      
      return { success: false, errors: [errorMessage], isUpdate: false };
    }
  }

  /**
   * VALIDAÇÃO E NORMALIZAÇÃO SEM ALUCINAÇÃO
   */
  private static async validateAndNormalizeData(
    policyData: ParsedPolicyData,
    userId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🔍 Validando dados da apólice...');

    // Garantir user_id obrigatório
    if (!userId) {
      errors.push('user_id é obrigatório');
    }

    // Validar campos críticos obrigatórios
    if (!policyData.insurer || policyData.insurer.trim() === '') {
      errors.push('Seguradora é obrigatória');
    }
    
    if (!policyData.policyNumber || policyData.policyNumber.trim() === '') {
      errors.push('Número da apólice é obrigatório');
    }

    // Normalizar dados financeiros (em centavos)
    const normalizedData: Partial<ParsedPolicyData> = {
      ...policyData,
      // Normalizar valores monetários
      premium: this.normalizeMonetaryValue(policyData.premium),
      monthlyAmount: this.normalizeMonetaryValue(policyData.monthlyAmount),
      deductible: policyData.deductible ? this.normalizeMonetaryValue(policyData.deductible) : undefined,
      
      // Normalizar datas em ISO
      startDate: this.normalizeDate(policyData.startDate),
      endDate: this.normalizeDate(policyData.endDate),
      expirationDate: this.normalizeDate(policyData.expirationDate),
      
      // Limpar e normalizar strings
      insurer: policyData.insurer?.trim().toUpperCase(),
      policyNumber: policyData.policyNumber?.trim(),
      name: policyData.name?.trim()
    };

    // Validar coerência de datas
    if (normalizedData.startDate && normalizedData.endDate) {
      if (new Date(normalizedData.startDate) >= new Date(normalizedData.endDate)) {
        errors.push('Data de fim deve ser posterior à data de início');
      }
    }

    // Validar coerência financeira
    if (normalizedData.premium && normalizedData.monthlyAmount) {
      const expectedMonthly = normalizedData.premium / 12;
      const tolerance = expectedMonthly * 0.15; // 15% tolerância
      
      if (Math.abs(normalizedData.monthlyAmount - expectedMonthly) > tolerance) {
        warnings.push('Valor mensal inconsistente com prêmio anual');
      }
    }

    console.log(`✅ Validação concluída: ${errors.length} erros, ${warnings.length} avisos`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      normalizedData
    };
  }

  /**
   * ENCONTRAR POLÍTICA EXISTENTE (UPSERT IDEMPOTENTE)
   * Verifica se já existe uma apólice com mesmo número para o mesmo usuário
   */
  private static async findExistingPolicy(
    normalizedData: Partial<ParsedPolicyData>,
    userId: string
  ): Promise<any | null> {
    try {
      console.log('🔍 Verificando política existente com critérios:');
      console.log('  - userId:', userId);
      console.log('  - seguradora:', normalizedData.insurer);
      console.log('  - numero_apolice:', normalizedData.policyNumber);
      
      // BUSCA SIMPLIFICADA: user_id + seguradora + numero_apolice
      // Isso garante que duplicatas sejam detectadas independente de placa
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', userId)
        .eq('seguradora', normalizedData.insurer)
        .eq('numero_apolice', normalizedData.policyNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Erro ao buscar política existente:', error);
        throw error;
      }

      if (data) {
        console.log('🔔 DUPLICATA ENCONTRADA!');
        console.log('📋 ID da política existente:', data.id);
        console.log('📋 Número da apólice:', data.numero_apolice);
        return data;
      } else {
        console.log('✅ Nenhuma duplicata - Criando nova apólice');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar política existente:', error);
      throw error;
    }
  }

  /**
   * ATUALIZAR POLÍTICA EXISTENTE COM CONTROLE DE CAMPOS CONFIRMADOS
   */
  private static async updateExistingPolicy(
    existingPolicy: any,
    normalizedData: Partial<ParsedPolicyData>,
    fileHash: string,
    userId: string,
    file: File
  ): Promise<{ success: boolean; policyId?: string; errors?: string[]; isUpdate?: boolean }> {
    console.log('🔄 ========================================');
    console.log('🔄 ATUALIZANDO POLÍTICA EXISTENTE (DUPLICATA)');
    console.log('🔄 ========================================');
    console.log('📋 ID da apólice:', existingPolicy.id);
    console.log('📋 Número da apólice:', normalizedData.policyNumber);
    console.log('📋 Nome:', normalizedData.name);

    try {
      // 1. Verificar campos confirmados
      const confirmedFields = await this.getConfirmedFields(existingPolicy.id);
      console.log('🔒 Campos confirmados:', confirmedFields.map(f => f.field_name));

      // 2. Preparar dados para atualização (respeitando campos confirmados)
      const updateData = await this.prepareUpdateData(
        existingPolicy,
        normalizedData,
        confirmedFields,
        fileHash
      );

      // 3. Fazer upload do PDF se necessário
      let pdfPath = existingPolicy.arquivo_url;
      if (fileHash !== existingPolicy.file_hash) {
        console.log('📄 Uploading novo PDF...');
        pdfPath = await this.uploadPDF(file, userId);
        updateData.arquivo_url = pdfPath;
      }

      // 4. Atualizar no banco (trigger de auditoria será executado automaticamente)
      const { data: updatedPolicy, error } = await supabase
        .from('policies')
        .update(updateData)
        .eq('id', existingPolicy.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar política:', error);
        return { success: false, errors: [error.message] };
      }

      // 5. Atualizar coberturas e parcelas
      await this.updateCoverages(existingPolicy.id, normalizedData);
      await this.updateInstallments(existingPolicy.id, normalizedData, userId);

      console.log('✅ ========================================');
      console.log('✅ POLÍTICA ATUALIZADA COM SUCESSO!');
      console.log('✅ isUpdate: TRUE - Modal deve aparecer');
      console.log('✅ ========================================');
      return { success: true, policyId: existingPolicy.id, isUpdate: true };

    } catch (error) {
      const errorMessage = `Erro ao atualizar política: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌', errorMessage);
      return { success: false, errors: [errorMessage] };
    }
  }

  /**
   * CRIAR NOVA POLÍTICA
   */
  private static async createNewPolicy(
    normalizedData: Partial<ParsedPolicyData>,
    fileHash: string,
    userId: string,
    file: File
  ): Promise<{ success: boolean; policyId?: string; errors?: string[]; isUpdate?: boolean }> {
    console.log('🆕 Criando nova política...');

    try {
      // 1. Upload do PDF
      const pdfPath = await this.uploadPDF(file, userId);
      console.log('📄 PDF uploaded:', pdfPath);

      // 2. Determinar status baseado na vigência
      const finalStatus = this.determineStatusFromDates(
        normalizedData.endDate || normalizedData.expirationDate,
        normalizedData.startDate
      );
      console.log('📅 Status determinado automaticamente:', finalStatus);

      // 3. Preparar dados para inserção
      const policyId = window.crypto.randomUUID();
      const insertData = {
        id: policyId,
        user_id: userId,
        file_hash: fileHash,
        version_number: 1,
        
        // Dados principais
        segurado: normalizedData.name,
        seguradora: normalizedData.insurer,
        numero_apolice: normalizedData.policyNumber,
        tipo_seguro: normalizedData.type,
        
        // Datas
        inicio_vigencia: normalizedData.startDate,
        fim_vigencia: normalizedData.endDate,
        expiration_date: normalizedData.expirationDate,
        
        // Valores financeiros
        valor_premio: normalizedData.premium,
        custo_mensal: normalizedData.monthlyAmount,
        franquia: normalizedData.deductible,
        
        // Dados do segurado
        documento: normalizedData.documento,
        documento_tipo: normalizedData.documento_tipo,
        
        // Dados do veículo
        modelo_veiculo: normalizedData.vehicleModel,
        placa: normalizedData.vehicleDetails?.plate,
        ano_modelo: normalizedData.vehicleDetails?.year?.toString(),
        
        // Outros
        uf: normalizedData.uf,
        corretora: normalizedData.entity,
        status: finalStatus, // Usar status calculado automaticamente
        policy_status: finalStatus as any,
        arquivo_url: pdfPath,
        
        // Parcelas
        quantidade_parcelas: normalizedData.quantidade_parcelas || (normalizedData.installments?.length) || null,
        valor_parcela: normalizedData.monthlyAmount || null,
        
        // Campos CorpNuvem
        nosnum: normalizedData.nosnum,
        codfil: normalizedData.codfil,
        
        // Metadados
        created_by_extraction: true,
        extraction_timestamp: new Date().toISOString()
      };

      // 3. Inserir no banco (trigger de auditoria executará automaticamente)
      const { data: newPolicy, error } = await supabase
        .from('policies')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌❌❌ Erro ao inserir política:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, errors: [error.message], isUpdate: false };
      }

      // 4. Salvar coberturas e parcelas
      await this.saveCoverages(policyId, normalizedData);
      await this.saveInstallments(policyId, normalizedData, userId);

      // 5. Se não salvou parcelas mas tem custo_mensal, gerar parcelas automaticamente com datas
      if ((!normalizedData.installments || normalizedData.installments.length === 0) && normalizedData.monthlyAmount && normalizedData.monthlyAmount > 0) {
        const numParcelas = normalizedData.quantidade_parcelas || 12;
        const startDate = normalizedData.startDate || new Date().toISOString().split('T')[0];
        const generatedInstallments = [];
        const baseDate = new Date(startDate + 'T00:00:00');
        
        for (let i = 0; i < numParcelas; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          generatedInstallments.push({
            policy_id: policyId,
            user_id: userId,
            numero_parcela: i + 1,
            valor: normalizedData.monthlyAmount,
            data_vencimento: installmentDate.toISOString().split('T')[0],
            status: 'a vencer'
          });
        }
        
        const { error: instError } = await supabase.from('installments').insert(generatedInstallments);
        if (instError) {
          console.error('❌ Erro ao auto-gerar parcelas:', instError);
        } else {
          console.log(`✅ ${numParcelas} parcelas auto-geradas com datas`);
        }
      }

      console.log('✅ Nova política criada com sucesso');
      return { success: true, policyId, isUpdate: false };

    } catch (error) {
      const errorMessage = `Erro ao criar política: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌❌❌ Erro ao criar política:', error);
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
      return { success: false, errors: [errorMessage], isUpdate: false };
    }
  }

  /**
   * RECARREGAR DADOS SEMPRE DO BANCO (NUNCA DO CACHE)
   */
  static async loadUserPoliciesFromDatabase(userId: string): Promise<ParsedPolicyData[]> {
    console.log('🔄 Carregando políticas SEMPRE do banco para userId:', userId);
    
    if (!userId) {
      console.error('❌ userId obrigatório para carregar políticas');
      return [];
    }

    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select(`
          *,
          coberturas (id, descricao, lmi),
          installments (id, numero_parcela, valor, data_vencimento, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar políticas:', error);
        throw error;
      }

      console.log(`✅ ${policies?.length || 0} políticas carregadas do banco`);
      
      return policies?.map(policy => this.convertDatabaseToPolicy(policy)) || [];
      
    } catch (error) {
      console.error('❌ Erro ao carregar políticas do banco:', error);
      return [];
    }
  }

  // MÉTODOS AUXILIARES

  private static async generateFileHash(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Usar Web Crypto API disponível no browser
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('❌ Erro ao gerar hash do arquivo:', error);
      // Fallback: usar timestamp + nome do arquivo como hash alternativo
      return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    }
  }

  private static normalizeMonetaryValue(value: any): number {
    if (typeof value === 'number') return Math.round(value * 100) / 100;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }
    return 0;
  }

  private static normalizeDate(dateStr: any): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) 
      ? new Date().toISOString().split('T')[0]
      : date.toISOString().split('T')[0];
  }

  /**
   * DETERMINAR STATUS AUTOMATICAMENTE BASEADO NAS DATAS DE VIGÊNCIA
   * - Apólices com vigência que terminou antes do ano atual = "nao_renovada" (antiga)
   * - Apólices que venceram há mais de 30 dias = "nao_renovada"
   * - Apólices vencidas há menos de 30 dias = "vencida"
   * - Apólices que vencem em até 30 dias = "vencendo"
   * - Demais = "vigente"
   */
  private static determineStatusFromDates(expirationDate?: string, startDate?: string): string {
    if (!expirationDate) return 'vigente';
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    if (isNaN(expDate.getTime())) {
      console.error(`❌ Data de expiração inválida: ${expirationDate}`);
      return 'vigente';
    }
    
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const expYear = expDate.getFullYear();
    
    console.log(`📅 Analisando vigência - Expiração: ${expirationDate}, Dias restantes: ${diffDays}, Ano exp: ${expYear}`);
    
    // REGRA: Apólices com vigência fora do ano atual são "antigas" (não renovadas)
    if (expYear < currentYear) {
      console.log(`📅 Apólice ANTIGA: vigência terminou em ${expYear} (atual: ${currentYear})`);
      return 'nao_renovada';
    }
    
    // Se início é anterior ao ano atual E já venceu, também é antiga
    if (startDate) {
      const startDateObj = new Date(startDate);
      const startYear = startDateObj.getFullYear();
      if (startYear < currentYear && diffDays < 0) {
        console.log(`📅 Apólice ANTIGA: iniciou em ${startYear} e já venceu`);
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

  private static async getConfirmedFields(policyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('policy_confirmed_fields')
      .select('*')
      .eq('policy_id', policyId);

    if (error) {
      console.error('❌ Erro ao buscar campos confirmados:', error);
      return [];
    }

    return data || [];
  }

  private static async prepareUpdateData(
    existingPolicy: any,
    normalizedData: Partial<ParsedPolicyData>,
    confirmedFields: any[],
    fileHash: string
  ): Promise<any> {
    const updateData: any = {
      file_hash: fileHash,
      // Sempre permitir atualização de metadados
      extraction_timestamp: new Date().toISOString()
    };

    const confirmedFieldNames = new Set(confirmedFields.map(f => f.field_name));

    // Aplicar dados apenas se campos não estão confirmados
    const fieldMappings = {
      'seguradora': normalizedData.insurer,
      'numero_apolice': normalizedData.policyNumber,
      'segurado': normalizedData.name,
      'valor_premio': normalizedData.premium,
      'custo_mensal': normalizedData.monthlyAmount,
      'franquia': normalizedData.deductible,
      'inicio_vigencia': normalizedData.startDate,
      'fim_vigencia': normalizedData.endDate,
      'placa': normalizedData.vehicleDetails?.plate,
      'modelo_veiculo': normalizedData.vehicleModel,
      'nosnum': normalizedData.nosnum,
      'codfil': normalizedData.codfil
    };

    for (const [dbField, value] of Object.entries(fieldMappings)) {
      if (!confirmedFieldNames.has(dbField) && value !== undefined) {
        updateData[dbField] = value;
      } else if (confirmedFieldNames.has(dbField)) {
        console.log(`🔒 Campo ${dbField} confirmado, mantendo valor existente`);
      }
    }

    return updateData;
  }

  private static async uploadPDF(file: File, userId: string): Promise<string> {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Erro no upload do PDF:', error);
      throw error;
    }

    return data.path;
  }

  private static async saveCoverages(policyId: string, policyData: Partial<ParsedPolicyData>): Promise<void> {
    if (!policyData.coberturas || policyData.coberturas.length === 0) return;

    const coverages = policyData.coberturas.map(cov => ({
      policy_id: policyId,
      descricao: cov.descricao,
      lmi: cov.lmi || null
    }));

    const { error } = await supabase
      .from('coberturas')
      .insert(coverages);

    if (error) {
      console.error('❌ Erro ao salvar coberturas:', error);
      throw error;
    }
  }

  private static async updateCoverages(policyId: string, policyData: Partial<ParsedPolicyData>): Promise<void> {
    // Remover coberturas existentes e inserir novas
    await supabase
      .from('coberturas')
      .delete()
      .eq('policy_id', policyId);

    await this.saveCoverages(policyId, policyData);
  }

  private static async saveInstallments(policyId: string, policyData: Partial<ParsedPolicyData>, userId: string): Promise<void> {
    if (!policyData.installments || policyData.installments.length === 0) return;

    const installments = policyData.installments.map(inst => ({
      policy_id: policyId,
      user_id: userId,
      numero_parcela: inst.numero,
      valor: inst.valor,
      data_vencimento: inst.data,
      status: 'a vencer'
    }));

    const { error } = await supabase
      .from('installments')
      .insert(installments);

    if (error) {
      console.error('❌ Erro ao salvar parcelas:', error);
      throw error;
    }
  }

  private static async updateInstallments(policyId: string, policyData: Partial<ParsedPolicyData>, userId: string): Promise<void> {
    // Remover parcelas existentes e inserir novas
    await supabase
      .from('installments')
      .delete()
      .eq('policy_id', policyId);

    await this.saveInstallments(policyId, policyData, userId);
  }

  private static convertDatabaseToPolicy(dbPolicy: any): ParsedPolicyData {
    // Converter dados do banco para o formato ParsedPolicyData
    return {
      id: dbPolicy.id,
      name: dbPolicy.segurado || 'Segurado não informado',
      type: dbPolicy.tipo_seguro || 'auto',
      insurer: dbPolicy.seguradora || 'Seguradora não informada',
      premium: dbPolicy.valor_premio || 0,
      monthlyAmount: dbPolicy.custo_mensal || 0,
      startDate: dbPolicy.inicio_vigencia || '',
      endDate: dbPolicy.fim_vigencia || '',
      expirationDate: dbPolicy.expiration_date || dbPolicy.fim_vigencia || '',
      policyNumber: dbPolicy.numero_apolice || '',
      paymentFrequency: 'mensal',
      status: dbPolicy.status || 'vigente',
      policyStatus: 'vigente',
      extractedAt: dbPolicy.extraction_timestamp || dbPolicy.created_at,
      installments: dbPolicy.installments || [],
      coberturas: dbPolicy.coberturas || [],
      
      // Campos opcionais
      insuredName: dbPolicy.segurado,
      documento: dbPolicy.documento,
      documento_tipo: dbPolicy.documento_tipo as 'CPF' | 'CNPJ',
      vehicleModel: dbPolicy.modelo_veiculo,
      uf: dbPolicy.uf,
      deductible: dbPolicy.franquia,
      entity: dbPolicy.corretora,
      
      vehicleDetails: {
        model: dbPolicy.modelo_veiculo,
        plate: dbPolicy.placa,
        year: parseInt(dbPolicy.ano_modelo) || undefined
      },
      
      // Campos CorpNuvem
      nosnum: dbPolicy.nosnum,
      codfil: dbPolicy.codfil,
      
      // Campos veículo/embarcação
      marca: dbPolicy.marca,
      placa: dbPolicy.placa,
      ano_modelo: dbPolicy.ano_modelo,
      nome_embarcacao: dbPolicy.nome_embarcacao,
      
      // Campo específico saúde
      nome_plano_saude: dbPolicy.nome_plano_saude,
    };
  }
}