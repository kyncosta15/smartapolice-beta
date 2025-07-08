
import { supabase } from '@/integrations/supabase/client';
import { ParsedPolicyData } from '@/utils/policyDataParser';

export class PolicyPersistenceService {
  static async savePolicy(policy: ParsedPolicyData, userId: string): Promise<string> {
    try {
      console.log(`💾 Salvando apólice para usuário: ${userId}`, policy);
      
      // Converter dados para formato do banco
      const policyData = {
        id: policy.id,
        user_id: userId,
        segurado: policy.insuredName || policy.name,
        seguradora: policy.insurer,
        tipo_seguro: policy.type,
        numero_apolice: policy.policyNumber,
        valor_premio: policy.premium,
        custo_mensal: policy.monthlyAmount,
        inicio_vigencia: policy.startDate,
        fim_vigencia: policy.endDate,
        status: policy.status || 'ativa',
        forma_pagamento: policy.category,
        corretora: policy.entity,
        documento: policy.documento,
        documento_tipo: policy.documento_tipo,
        modelo_veiculo: policy.vehicleModel,
        uf: policy.uf,
        franquia: policy.deductible,
        arquivo_url: policy.pdfPath,
        extraido_em: policy.extractedAt || new Date().toISOString(),
        quantidade_parcelas: Array.isArray(policy.installments) ? policy.installments.length : policy.installments,
        valor_parcela: policy.monthlyAmount
      };

      console.log('📝 Dados formatados para o banco:', policyData);
      
      // Salvar apólice principal
      const { error: policyError } = await supabase
        .from('policies')
        .upsert(policyData);
      
      if (policyError) {
        console.error('❌ Erro ao salvar apólice:', policyError);
        throw policyError;
      }
      
      // Salvar coberturas se existirem
      if (policy.coberturas && Array.isArray(policy.coberturas) && policy.coberturas.length > 0) {
        console.log(`💾 Salvando ${policy.coberturas.length} coberturas...`);
        
        // Primeiro, deletar coberturas existentes
        await supabase
          .from('coberturas')
          .delete()
          .eq('policy_id', policy.id);
        
        // Inserir novas coberturas
        const coveragesData = policy.coberturas.map(cobertura => ({
          policy_id: policy.id,
          descricao: typeof cobertura === 'string' ? cobertura : cobertura.descricao,
          lmi: typeof cobertura === 'object' ? cobertura.lmi : null
        }));
        
        const { error: coverageError } = await supabase
          .from('coberturas')
          .insert(coveragesData);
        
        if (coverageError) {
          console.error('❌ Erro ao salvar coberturas:', coverageError);
          // Não falhar a operação inteira por causa das coberturas
        } else {
          console.log(`✅ ${policy.coberturas.length} coberturas salvas`);
        }
      }
      
      // Salvar parcelas se existirem
      if (policy.installments && Array.isArray(policy.installments) && policy.installments.length > 0) {
        console.log(`💾 Salvando ${policy.installments.length} parcelas...`);
        
        // Primeiro, deletar parcelas existentes
        await supabase
          .from('parcelas')
          .delete()
          .eq('policy_id', policy.id);
        
        // Inserir novas parcelas
        const installmentsData = policy.installments.map(installment => ({
          policy_id: policy.id,
          numero: installment.numero,
          valor: installment.valor,
          data: installment.data,
          status: installment.status || 'pendente'
        }));
        
        const { error: installmentError } = await supabase
          .from('parcelas')
          .insert(installmentsData);
        
        if (installmentError) {
          console.error('❌ Erro ao salvar parcelas:', installmentError);
          // Não falhar a operação inteira por causa das parcelas
        } else {
          console.log(`✅ ${policy.installments.length} parcelas salvas`);
        }
      }
      
      console.log(`✅ Apólice salva com sucesso: ${policy.id}`);
      return policy.id;
      
    } catch (error) {
      console.error('❌ Erro ao salvar apólice:', error);
      throw error;
    }
  }

  // New method to handle complete policy saving with file upload
  static async savePolicyComplete(file: File, policy: ParsedPolicyData, userId: string): Promise<string> {
    try {
      console.log(`💾 Salvando apólice completa com arquivo para usuário: ${userId}`, policy);
      
      // Upload do arquivo PDF para o storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('❌ Erro ao fazer upload do PDF:', uploadError);
        throw uploadError;
      }
      
      // Atualizar o policy com o caminho do arquivo
      const policyWithFile = {
        ...policy,
        pdfPath: fileName,
        arquivo_url: fileName
      };
      
      // Salvar a apólice no banco
      return await this.savePolicy(policyWithFile, userId);
      
    } catch (error) {
      console.error('❌ Erro ao salvar apólice completa:', error);
      throw error;
    }
  }

  static async loadUserPolicies(userId: string): Promise<ParsedPolicyData[]> {
    try {
      console.log(`🔍 Carregando apólices do usuário: ${userId}`);
      
      // Buscar apólices do usuário
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (policiesError) {
        console.error('❌ Erro ao carregar apólices:', policiesError);
        throw policiesError;
      }
      
      console.log(`📊 Encontradas ${policies?.length || 0} apólices`);
      
      if (!policies || policies.length === 0) {
        return [];
      }
      
      // Buscar coberturas para todas as apólices
      const policyIds = policies.map(p => p.id);
      const { data: coverages } = await supabase
        .from('coberturas')
        .select('*')
        .in('policy_id', policyIds);
      
      console.log(`📊 Encontradas ${coverages?.length || 0} coberturas`);
      
      // Buscar parcelas para todas as apólices
      const { data: installments } = await supabase
        .from('parcelas')
        .select('*')
        .in('policy_id', policyIds);
      
      console.log(`📊 Encontradas ${installments?.length || 0} parcelas`);
      
      // Converter dados do banco para formato ParsedPolicyData
      const parsedPolicies: ParsedPolicyData[] = policies.map(policy => {
        // Buscar coberturas desta apólice
        const policyCoverages = coverages?.filter(c => c.policy_id === policy.id) || [];
        
        // Buscar parcelas desta apólice
        const policyInstallments = installments?.filter(i => i.policy_id === policy.id) || [];
        
        return {
          id: policy.id,
          name: policy.segurado || 'Segurado não informado',
          insuredName: policy.segurado,
          insurer: policy.seguradora || 'Seguradora não informada',
          type: policy.tipo_seguro || 'auto',
          policyNumber: policy.numero_apolice || '',
          premium: policy.valor_premio || 0,
          monthlyAmount: policy.custo_mensal || 0,
          startDate: policy.inicio_vigencia || new Date().toISOString(),
          endDate: policy.fim_vigencia || new Date().toISOString(),
          status: policy.status || 'ativa',
          category: policy.forma_pagamento || 'mensal',
          entity: policy.corretora || '',
          documento: policy.documento,
          documento_tipo: (policy.documento_tipo === 'CPF' || policy.documento_tipo === 'CNPJ') 
            ? policy.documento_tipo as 'CPF' | 'CNPJ'
            : 'CPF' as const,
          vehicleModel: policy.modelo_veiculo,
          uf: policy.uf,
          deductible: policy.franquia || 0,
          pdfPath: policy.arquivo_url,
          extractedAt: policy.extraido_em || policy.created_at,
          paymentFrequency: 'mensal' as const,
          
          // Coberturas formatadas
          coberturas: policyCoverages.map(coverage => ({
            descricao: coverage.descricao || '',
            lmi: coverage.lmi || undefined
          })),
          
          // Parcelas formatadas com status tipado corretamente
          installments: policyInstallments.map(installment => ({
            numero: installment.numero || 1,
            valor: installment.valor || 0,
            data: installment.data || new Date().toISOString(),
            status: (installment.status === 'paga' || installment.status === 'pendente') 
              ? installment.status as 'paga' | 'pendente'
              : 'pendente' as const
          }))
        };
      });
      
      console.log(`✅ ${parsedPolicies.length} apólices carregadas e convertidas`);
      return parsedPolicies;
      
    } catch (error) {
      console.error('❌ Erro ao carregar apólices do usuário:', error);
      throw error;
    }
  }

  static async cleanupDuplicatePolicies(userId: string): Promise<number> {
    try {
      console.log(`🧹 Iniciando limpeza de duplicatas para usuário: ${userId}`);
      
      // Buscar todas as apólices do usuário
      const { data: policies, error } = await supabase
        .from('policies')
        .select('id, numero_apolice, segurado, seguradora, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error || !policies) {
        console.error('Erro ao buscar apólices para limpeza:', error);
        return 0;
      }
      
      const seen = new Set<string>();
      const duplicates: string[] = [];
      
      policies.forEach(policy => {
        const key = `${policy.numero_apolice}-${policy.segurado}-${policy.seguradora}`;
        if (seen.has(key)) {
          duplicates.push(policy.id);
        } else {
          seen.add(key);
        }
      });
      
      if (duplicates.length > 0) {
        console.log(`🗑️ Removendo ${duplicates.length} apólices duplicadas`);
        
        // Remover coberturas das apólices duplicadas
        await supabase
          .from('coberturas')
          .delete()
          .in('policy_id', duplicates);
        
        // Remover parcelas das apólices duplicadas
        await supabase
          .from('parcelas')
          .delete()
          .in('policy_id', duplicates);
        
        // Remover apólices duplicadas
        const { error: deleteError } = await supabase
          .from('policies')
          .delete()
          .in('id', duplicates);
        
        if (deleteError) {
          console.error('Erro ao remover duplicatas:', deleteError);
          return 0;
        }
      }
      
      console.log(`✅ Limpeza concluída. ${duplicates.length} duplicatas removidas`);
      return duplicates.length;
      
    } catch (error) {
      console.error('Erro na limpeza de duplicatas:', error);
      return 0;
    }
  }

  static async getPDFDownloadUrl(pdfPath: string): Promise<string | null> {
    try {
      console.log(`📥 Gerando URL de download para: ${pdfPath}`);
      
      const { data } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfPath, 60); // URL válida por 60 segundos
      
      if (data?.signedUrl) {
        console.log(`✅ URL de download gerada: ${data.signedUrl}`);
        return data.signedUrl;
      }
      
      console.log(`❌ Não foi possível gerar URL para: ${pdfPath}`);
      return null;
      
    } catch (error) {
      console.error('Erro ao gerar URL de download:', error);
      return null;
    }
  }
}
