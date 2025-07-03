import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { Database } from '@/integrations/supabase/types';

type PolicyInsert = Database['public']['Tables']['policies']['Insert'];
type InstallmentInsert = Database['public']['Tables']['installments']['Insert'];

export class PolicyPersistenceService {
  
  // Salvar arquivo PDF no storage
  static async uploadPDFToStorage(file: File, userId: string): Promise<string | null> {
    try {
      // Sanitizar nome do arquivo - remover espaços e caracteres especiais
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_') // Substituir espaços por underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remover caracteres especiais
        .toLowerCase(); // Converter para minúsculas
      
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
        console.error('📋 Detalhes do erro:', {
          message: policiesError.message,
          details: policiesError.details,
          code: policiesError.code
        });
        return [];
      }

      console.log(`🔍 Resultado da consulta:`, {
        totalRecords: policies?.length || 0,
        userId: userId,
        policies: policies
      });

      if (!policies || policies.length === 0) {
        console.log('📭 Nenhuma apólice encontrada para o usuário');
        return [];
      }

      console.log(`✅ ${policies.length} apólices carregadas do banco`);

      // Converter dados do banco para formato ParsedPolicyData
      const parsedPolicies: ParsedPolicyData[] = policies.map(policy => {
        console.log(`🔍 Processando apólice do banco:`, {
          id: policy.id,
          segurado: policy.segurado,
          arquivo_url: policy.arquivo_url
        });
        return {
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
        };
      });

      console.log(`✅ Apólices convertidas com sucesso:`, {
        total: parsedPolicies.length,
        nomes: parsedPolicies.map(p => p.name)
      });

      return parsedPolicies;

    } catch (error) {
      console.error('❌ Erro inesperado ao carregar apólices:', error);
      console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'Erro desconhecido');
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

      // 1. Fazer upload do PDF PRIMEIRO
      console.log(`📤 Iniciando upload do PDF: ${file.name} (${file.size} bytes)`);
      const pdfPath = await this.uploadPDFToStorage(file, userId);
      
      if (!pdfPath) {
        console.error(`❌ ERRO CRÍTICO: Falha no upload do PDF para ${file.name} - Abortando persistência`);
        return false; // Não prosseguir sem o PDF
      } 
      
      console.log(`✅ PDF salvo com sucesso no caminho: ${pdfPath}`);
      
      // 2. Salvar dados no banco COM o PDF path
      console.log(`💾 Salvando dados da apólice no banco com pdfPath confirmado: ${pdfPath}`);
      const policyId = await this.savePolicyToDatabase(policyData, userId, pdfPath);

      if (policyId) {
        console.log(`✅ Persistência completa realizada com SUCESSO:
          - Policy ID: ${policyId} 
          - PDF Path: ${pdfPath}
          - File: ${file.name}`);
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
}