
import { supabase } from '@/integrations/supabase/client';

export interface WebhookPolicyData {
  user_id?: string | null;
  segurado: string;
  documento: string;
  documento_tipo: string;
  data_nascimento?: string;
  seguradora: string;
  numero_apolice: string;
  inicio: string;
  fim: string;
  tipo: string;
  modelo_veiculo: string;
  placa: string;
  ano_modelo: string;
  premio: number;
  parcelas: number;
  valor_parcela: number;
  pagamento: string;
  custo_mensal: number;
  vencimentos_futuros: any[];
  franquia: number;
  condutor: string;
  email: string;
  telefone: string;
  status: string;
  corretora: string;
  cidade: string;
  uf: string;
  coberturas: Array<{
    descricao: string;
    lmi: number;
  }>;
}

export class WebhookService {
  /**
   * Processa dados recebidos via webhook N8N
   */
  static async processWebhookData(
    webhookData: WebhookPolicyData[],
    userId: string
  ): Promise<{ success: boolean; results: any[] }> {
    console.log('🚀 WebhookService: Processando dados do webhook', webhookData.length);

    const results = [];

    try {
      for (const data of webhookData) {
        console.log(`📄 Processando apólice: ${data.numero_apolice}`);

        // Verificar se a apólice já existe
        const { data: existingPolicy } = await supabase
          .from('policies')
          .select('id')
          .eq('numero_apolice', data.numero_apolice)
          .eq('user_id', userId)
          .single();

        if (existingPolicy) {
          console.log(`⚠️ Apólice ${data.numero_apolice} já existe`);
          results.push({
            numero_apolice: data.numero_apolice,
            status: 'skipped',
            message: 'Apólice já existe'
          });
          continue;
        }

        // Mapear status para formato do banco
        const statusMapping: { [key: string]: string } = {
          'Ativa': 'vigente',
          'Vencida': 'vencida',
          'Cancelada': 'cancelada',
          'Renovada': 'renovada_aguardando'
        };

        const mappedStatus = statusMapping[data.status] || 'vigente';

        // Preparar dados da apólice
        const policyData = {
          id: crypto.randomUUID(),
          user_id: userId,
          segurado: data.segurado,
          documento: data.documento,
          documento_tipo: data.documento_tipo,
          data_nascimento: data.data_nascimento || null,
          seguradora: data.seguradora,
          numero_apolice: data.numero_apolice,
          inicio_vigencia: data.inicio,
          fim_vigencia: data.fim,
          tipo_seguro: data.tipo,
          modelo_veiculo: data.modelo_veiculo,
          placa: data.placa,
          ano_modelo: data.ano_modelo,
          valor_premio: data.premio,
          quantidade_parcelas: data.parcelas,
          valor_parcela: data.valor_parcela,
          forma_pagamento: data.pagamento,
          custo_mensal: data.custo_mensal || (data.premio / 12),
          franquia: data.franquia,
          condutor_principal: data.condutor,
          email: data.email,
          telefone: data.telefone,
          status: mappedStatus,
          corretora: data.corretora,
          cidade: data.cidade,
          uf: data.uf,
          created_by_extraction: true,
          extraction_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        console.log('💾 Salvando apólice no banco de dados...');

        // Inserir a apólice
        const { data: insertedPolicy, error: policyError } = await supabase
          .from('policies')
          .insert(policyData)
          .select()
          .single();

        if (policyError) {
          console.error('❌ Erro ao inserir apólice:', policyError);
          results.push({
            numero_apolice: data.numero_apolice,
            status: 'error',
            message: policyError.message
          });
          continue;
        }

        console.log('✅ Apólice salva com sucesso:', insertedPolicy.id);

        // Inserir coberturas se existirem
        if (data.coberturas && data.coberturas.length > 0) {
          console.log(`📋 Salvando ${data.coberturas.length} coberturas...`);

          const coberturasData = data.coberturas.map(cobertura => ({
            policy_id: insertedPolicy.id,
            descricao: cobertura.descricao,
            lmi: cobertura.lmi || null
          }));

          const { error: coberturasError } = await supabase
            .from('coberturas')
            .insert(coberturasData);

          if (coberturasError) {
            console.error('❌ Erro ao inserir coberturas:', coberturasError);
          } else {
            console.log('✅ Coberturas salvas com sucesso');
          }
        }

        results.push({
          numero_apolice: data.numero_apolice,
          status: 'success',
          policy_id: insertedPolicy.id,
          message: 'Apólice salva com sucesso'
        });
      }

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('❌ Erro no processamento do webhook:', error);
      return {
        success: false,
        results: []
      };
    }
  }

  /**
   * Verifica se há dados pendentes do webhook
   */
  static async checkPendingWebhookData(userId: string): Promise<any[]> {
    console.log('🔍 Verificando dados pendentes do webhook para usuário:', userId);

    try {
      const { data: recentPolicies, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', userId)
        .eq('created_by_extraction', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Erro ao verificar dados do webhook:', error);
        return [];
      }

      console.log(`📋 Encontradas ${recentPolicies?.length || 0} apólices recentes via webhook`);
      return recentPolicies || [];

    } catch (error) {
      console.error('❌ Erro na verificação de dados do webhook:', error);
      return [];
    }
  }
}
