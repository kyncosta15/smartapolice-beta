import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { Database } from '@/integrations/supabase/types';

type PolicyInsert = Database['public']['Tables']['policies']['Insert'];
type InstallmentInsert = Database['public']['Tables']['installments']['Insert'];

export class PolicyPersistenceService {
  
  // Salvar arquivo PDF no storage
  static async uploadPDFToStorage(file: File, userId: string): Promise<string | null> {
    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      
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

      // Preparar dados da apólice
      const policyInsert: PolicyInsert = {
        user_id: userId,
        segurado: policyData.name,
        seguradora: policyData.insurer,
        tipo_seguro: policyData.type,
        numero_apolice: policyData.policyNumber,
        valor_premio: policyData.premium,
        custo_mensal: policyData.monthlyAmount,
        inicio_vigencia: policyData.startDate,
        fim_vigencia: policyData.endDate,
        forma_pagamento: policyData.paymentFrequency,
        quantidade_parcelas: Array.isArray(policyData.installments) ? policyData.installments.length : 12,
        valor_parcela: policyData.monthlyAmount,
        status: policyData.status,
        arquivo_url: pdfPath,
        extraido_em: new Date().toISOString()
      };

      console.log(`🔍 Dados da apólice preparados para usuário ${userId}:`, {
        user_id: policyInsert.user_id,
        segurado: policyInsert.segurado,
        seguradora: policyInsert.seguradora
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

      // Salvar parcelas se existirem
      if (Array.isArray(policyData.installments) && policyData.installments.length > 0) {
        await this.saveInstallments(policy.id, policyData.installments, userId);
      }

      return policy.id;

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar apólice:', error);
      return null;
    }
  }

  // Salvar parcelas no banco
  private static async saveInstallments(
    policyId: string, 
    installments: any[], 
    userId: string
  ): Promise<void> {
    try {
      const installmentInserts: InstallmentInsert[] = installments.map(installment => ({
        policy_id: policyId,
        user_id: userId,
        numero_parcela: installment.numero,
        valor: installment.valor,
        data_vencimento: installment.data,
        status: installment.status === 'paga' ? 'paga' : 'pendente' // Garantir apenas valores válidos
      }));

      const { error } = await supabase
        .from('installments')
        .insert(installmentInserts);

      if (error) {
        console.error('❌ Erro ao salvar parcelas:', error);
      } else {
        console.log(`✅ ${installments.length} parcelas salvas para apólice ${policyId}`);
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar parcelas:', error);
    }
  }

  // Carregar apólices do usuário
  static async loadUserPolicies(userId: string): Promise<ParsedPolicyData[]> {
    try {
      console.log(`📖 Carregando apólices do usuário: ${userId}`);

      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          installments!fk_installments_policy_id (
            numero_parcela,
            valor,
            data_vencimento,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (policiesError) {
        console.error('❌ Erro ao carregar apólices:', policiesError);
        return [];
      }

      if (!policies || policies.length === 0) {
        console.log('📭 Nenhuma apólice encontrada para o usuário');
        return [];
      }

      console.log(`✅ ${policies.length} apólices carregadas do banco`);

      // Converter dados do banco para formato ParsedPolicyData
      const parsedPolicies: ParsedPolicyData[] = policies.map(policy => ({
        id: policy.id,
        name: policy.segurado || 'Apólice',
        type: policy.tipo_seguro || 'auto',
        insurer: policy.seguradora || 'Seguradora',
        premium: Number(policy.valor_premio) || 0,
        monthlyAmount: Number(policy.custo_mensal) || 0,
        startDate: policy.inicio_vigencia || new Date().toISOString().split('T')[0],
        endDate: policy.fim_vigencia || new Date().toISOString().split('T')[0],
        policyNumber: policy.numero_apolice || 'N/A',
        paymentFrequency: policy.forma_pagamento || 'mensal',
        status: policy.status || 'active',
        pdfPath: policy.arquivo_url,
        extractedAt: policy.extraido_em || policy.created_at || new Date().toISOString(),
        installments: (policy.installments as any[])?.map(inst => ({
          numero: inst.numero_parcela,
          valor: Number(inst.valor),
          data: inst.data_vencimento,
          status: inst.status
        })) || []
      }));

      return parsedPolicies;

    } catch (error) {
      console.error('❌ Erro inesperado ao carregar apólices:', error);
      return [];
    }
  }

  // Obter URL para download do PDF
  static async getPDFDownloadUrl(pdfPath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfPath, 3600); // URL válida por 1 hora

      return data?.signedUrl || null;
    } catch (error) {
      console.error('❌ Erro ao gerar URL de download:', error);
      return null;
    }
  }

  // Método combinado: salvar arquivo e dados
  static async savePolicyComplete(
    file: File,
    policyData: ParsedPolicyData,
    userId: string
  ): Promise<boolean> {
    // Validar que userId não é null/undefined
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para persistência completa');
      return false;
    }
    try {
      console.log(`🔄 Salvando arquivo e dados completos para: ${policyData.name}`);

      // 1. Fazer upload do PDF
      const pdfPath = await this.uploadPDFToStorage(file, userId);
      
      // 2. Salvar dados no banco (com ou sem PDF path)
      const policyId = await this.savePolicyToDatabase(policyData, userId, pdfPath || undefined);

      if (policyId) {
        console.log(`✅ Persistência completa realizada para apólice: ${policyId}`);
        return true;
      } else {
        console.error('❌ Falha ao salvar dados da apólice');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro na persistência completa:', error);
      return false;
    }
  }
}