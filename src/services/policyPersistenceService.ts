
import { ParsedPolicyData, InstallmentData, CoverageData } from '@/utils/policyDataParser';
import { supabase } from '@/integrations/supabase/client';

export class PolicyPersistenceService {
  /**
   * Carrega as apólices de um usuário específico do banco de dados.
   */
  static async loadUserPolicies(userId: string): Promise<ParsedPolicyData[]> {
    try {
      const { data: policies, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar apólices:', error);
        throw new Error(error.message);
      }

      if (!policies) {
        console.warn('Nenhuma apólice encontrada para o usuário:', userId);
        return [];
      }

      // Mapear os resultados para o tipo ParsedPolicyData
      const parsedPolicies: ParsedPolicyData[] = policies.map(policy => ({
        id: policy.id,
        name: policy.segurado || policy.segurado || 'Segurado não informado',
        type: policy.tipo_seguro || 'Tipo não informado',
        insurer: policy.seguradora || 'Seguradora não informada',
        policyNumber: policy.numero_apolice || 'Número não informado',
        premium: policy.valor_premio?.toString() || 'Prêmio não informado',
        monthlyAmount: policy.custo_mensal?.toString() || 'Custo mensal não informado',
        startDate: policy.inicio_vigencia || 'Início não informado',
        endDate: policy.fim_vigencia || 'Fim não informado',
        status: policy.status || 'desconhecido',
        pdfPath: policy.arquivo_url || null,
        installments: [], // Carregar parcelas separadamente se necessário
        coverages: [],   // Carregar coberturas separadamente se necessário
        category: policy.forma_pagamento || 'Não informado',
        entity: policy.corretora || 'Não informado',

        // Campos obrigatórios que estavam faltando
        paymentFrequency: 'monthly',
        extractedAt: policy.created_at || new Date().toISOString(),
        expirationDate: policy.fim_vigencia || new Date().toISOString(),
        policyStatus: 'vigente',

        // Campos específicos do N8N
        insuredName: policy.segurado,
        documento: policy.documento,
        documento_tipo: policy.documento_tipo,
        vehicleModel: policy.modelo_veiculo,
        uf: policy.uf,
        deductible: policy.franquia?.toString(),
      }));

      console.log(`✅ Apólices carregadas com sucesso para o usuário ${userId}:`, parsedPolicies.length);
      return parsedPolicies;

    } catch (error: any) {
      console.error('Erro ao carregar apólices do usuário:', error);
      throw new Error(error.message || 'Falha ao carregar apólices do banco de dados.');
    }
  }

  /**
   * Remove apólices duplicadas de um usuário, mantendo a mais recente.
   */
  static async cleanupDuplicatePolicies(userId: string): Promise<number> {
    try {
      // 1. Buscar todas as apólices do usuário agrupadas por número de apólice
      const { data: duplicatePolicies, error: selectError } = await supabase.from('policies')
        .select('numero_apolice, id, created_at')
        .eq('user_id', userId)
        .not('numero_apolice', 'is', null) // Ignorar apólices sem número
        .order('created_at', { ascending: false });

      if (selectError) {
        console.error('Erro ao buscar apólices para limpeza:', selectError);
        throw new Error(selectError.message);
      }

      // 2. Agrupar apólices por número de apólice
      const groupedPolicies: { [numero_apolice: string]: { id: string, created_at: string }[] } = {};
      duplicatePolicies?.forEach(policy => {
        if (policy.numero_apolice) {
          if (!groupedPolicies[policy.numero_apolice]) {
            groupedPolicies[policy.numero_apolice] = [];
          }
          groupedPolicies[policy.numero_apolice].push({ id: policy.id, created_at: policy.created_at });
        }
      });

      let deletedCount = 0;

      // 3. Para cada grupo de apólices duplicadas, manter a mais recente e deletar as outras
      for (const numero_apolice in groupedPolicies) {
        const policies = groupedPolicies[numero_apolice];
        if (policies.length > 1) {
          // Ordenar as apólices por data de criação (mais recente primeiro)
          policies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // Manter a primeira apólice (mais recente) e deletar as outras
          const policyToKeep = policies[0].id;
          const policiesToDelete = policies.slice(1).map(policy => policy.id);

          // Deletar as apólices duplicadas
          const { error: deleteError } = await supabase.from('policies')
            .delete()
            .in('id', policiesToDelete);

          if (deleteError) {
            console.error(`Erro ao deletar apólices duplicadas (número ${numero_apolice}):`, deleteError);
          } else {
            deletedCount += policiesToDelete.length;
            console.log(`🧹 Apólices duplicadas removidas (número ${numero_apolice}):`, policiesToDelete.length);
          }
        }
      }

      console.log(`🧹 Limpeza de duplicatas concluída. Total removido: ${deletedCount}`);
      return deletedCount;

    } catch (error: any) {
      console.error('Erro durante a limpeza de apólices duplicadas:', error);
      throw new Error(error.message || 'Falha ao limpar apólices duplicadas.');
    }
  }

  /**
   * Salva as parcelas de uma apólice no banco de dados.
   */
  static async saveInstallments(policyId: string, installments: InstallmentData[], userId: string): Promise<boolean> {
    try {
      // Preparar dados para inserção em lote
      const installmentsToInsert = installments.map(installment => ({
        policy_id: policyId,
        user_id: userId,
        numero_parcela: installment.numero,
        valor: installment.valor,
        data_vencimento: installment.data,
        status: installment.status
      }));

      // Inserir as parcelas no banco de dados
      const { data, error } = await supabase
        .from('installments')
        .insert(installmentsToInsert);

      if (error) {
        console.error('❌ Erro ao salvar parcelas:', error);
        return false;
      }

      console.log(`✅ Parcelas salvas com sucesso para a apólice ${policyId}:`, data);
      return true;

    } catch (error) {
      console.error('❌ Erro ao salvar parcelas:', error);
      return false;
    }
  }

  /**
   * Salva as coberturas de uma apólice no banco de dados.
   */
  static async saveCoverages(policyId: string, coverages: CoverageData[]): Promise<boolean> {
    try {
      // Preparar dados para inserção em lote usando o nome correto da tabela
      const coveragesToInsert = coverages.map(coverage => ({
        policy_id: policyId,
        descricao: coverage.descricao,
        lmi: coverage.lmi
      }));

      // Inserir as coberturas no banco de dados usando 'coberturas' (nome correto da tabela)
      const { data, error } = await supabase
        .from('coberturas')
        .insert(coveragesToInsert);

      if (error) {
        console.error('❌ Erro ao salvar coberturas:', error);
        return false;
      }

      console.log(`✅ Coberturas salvas com sucesso para a apólice ${policyId}:`, data);
      return true;

    } catch (error) {
      console.error('❌ Erro ao salvar coberturas:', error);
      return false;
    }
  }

  /**
   * Obtém a URL de download para um arquivo PDF no bucket de armazenamento.
   */
  static async getPDFDownloadUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      console.log(`✅ URL de download obtida com sucesso: ${data.publicUrl}`);
      return data.publicUrl;

    } catch (error) {
      console.error('Erro ao obter URL de download:', error);
      return null;
    }
  }

  /**
   * Salva uma apólice no banco de dados com metadados de senha
   */
  static async savePolicyWithPasswordMetadata(
    userId: string,
    policyData: ParsedPolicyData,
    pdfPath?: string,
    wasPasswordProtected: boolean = false
  ): Promise<boolean> {
    try {
      console.log(`💾 Salvando apólice com metadados de senha:`, {
        policyId: policyData.id,
        wasPasswordProtected,
        pdfPath
      });

      // Preparar dados para inserção
      const insertData = {
        id: policyData.id,
        user_id: userId,
        segurado: policyData.name || policyData.insuredName,
        seguradora: policyData.insurer,
        numero_apolice: policyData.policyNumber,
        tipo_seguro: policyData.type,
        valor_premio: policyData.premium ? parseFloat(policyData.premium.toString()) : null,
        custo_mensal: policyData.monthlyAmount ? parseFloat(policyData.monthlyAmount.toString()) : null,
        inicio_vigencia: policyData.startDate,
        fim_vigencia: policyData.endDate,
        status: policyData.status || 'vigente',
        arquivo_url: pdfPath,
        created_by_extraction: true,
        extraction_timestamp: new Date().toISOString(),
        // Campos específicos do N8N
        documento: policyData.documento,
        documento_tipo: policyData.documento_tipo,
        modelo_veiculo: policyData.vehicleModel,
        uf: policyData.uf,
        franquia: policyData.deductible ? parseFloat(policyData.deductible.toString()) : null,
        forma_pagamento: policyData.category,
        corretora: policyData.entity,
        // Metadados de senha (se necessário, adicionar campo na tabela)
        // password_status: wasPasswordProtected ? 'Desbloqueado com senha' : 'Sem senha'
      };

      const { data, error } = await supabase
        .from('policies')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar apólice:', error);
        return false;
      }

      console.log('✅ Apólice salva com sucesso:', data);

      // Se havia parcelas, salvar também
      if (policyData.installments && policyData.installments.length > 0) {
        await this.saveInstallments(policyData.id, policyData.installments, userId);
      }

      // Se havia coberturas, salvar também
      if (policyData.coverages && policyData.coverages.length > 0) {
        await this.saveCoverages(policyData.id, policyData.coverages);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar apólice com metadados:', error);
      return false;
    }
  }

  /**
   * Método completo para salvar apólice com arquivo PDF
   */
  static async savePolicyComplete(
    file: File,
    policyData: ParsedPolicyData,
    userId: string,
    wasPasswordProtected: boolean = false
  ): Promise<boolean> {
    try {
      // Upload do arquivo PDF primeiro
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Erro no upload do arquivo:', uploadError);
        return false;
      }

      // Salvar a apólice com o caminho do arquivo
      return await this.savePolicyWithPasswordMetadata(
        userId,
        policyData,
        fileName,
        wasPasswordProtected
      );

    } catch (error) {
      console.error('❌ Erro ao salvar apólice completa:', error);
      return false;
    }
  }
}
