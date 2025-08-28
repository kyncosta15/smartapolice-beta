
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface N8NWebhookData {
  user_id: string | null;
  segurado: string;
  documento: string;
  documento_tipo: string;
  data_nascimento: string;
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

serve(async (req) => {
  console.log('🚀 N8N Webhook recebido:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookData: N8NWebhookData[] = await req.json();
    console.log('📋 Dados recebidos do N8N:', webhookData);

    if (!Array.isArray(webhookData) || webhookData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos recebidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const data of webhookData) {
      console.log(`📄 Processando apólice: ${data.numero_apolice}`);

      // Mapear status para formato do banco
      const statusMapping: { [key: string]: string } = {
        'Ativa': 'vigente',
        'Vencida': 'vencida',
        'Cancelada': 'cancelada',
        'Renovada': 'renovada_aguardando'
      };

      const mappedStatus = statusMapping[data.status] || 'vigente';

      // Determinar user_id - se não fornecido, buscar por documento
      let targetUserId = data.user_id;
      
      if (!targetUserId && data.documento) {
        console.log(`🔍 Buscando usuário pelo documento: ${data.documento}`);
        
        // Buscar usuário existente pelo documento (se disponível)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.email)
          .single();

        if (existingUser) {
          targetUserId = existingUser.id;
          console.log(`✅ Usuário encontrado: ${targetUserId}`);
        }
      }

      if (!targetUserId) {
        console.log('⚠️ user_id não encontrado, pulando esta apólice');
        results.push({
          numero_apolice: data.numero_apolice,
          status: 'error',
          message: 'user_id não encontrado'
        });
        continue;
      }

      // Verificar se a apólice já existe
      const { data: existingPolicy } = await supabase
        .from('policies')
        .select('id')
        .eq('numero_apolice', data.numero_apolice)
        .eq('user_id', targetUserId)
        .single();

      if (existingPolicy) {
        console.log(`⚠️ Apólice ${data.numero_apolice} já existe, pulando`);
        results.push({
          numero_apolice: data.numero_apolice,
          status: 'skipped',
          message: 'Apólice já existe'
        });
        continue;
      }

      // Preparar dados da apólice para inserção
      const policyData = {
        id: crypto.randomUUID(),
        user_id: targetUserId,
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

      console.log('💾 Inserindo apólice no banco de dados...');

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

      console.log('✅ Apólice inserida com sucesso:', insertedPolicy.id);

      // Inserir coberturas se existirem
      if (data.coberturas && data.coberturas.length > 0) {
        console.log(`📋 Inserindo ${data.coberturas.length} coberturas...`);

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
          console.log('✅ Coberturas inseridas com sucesso');
        }
      }

      results.push({
        numero_apolice: data.numero_apolice,
        status: 'success',
        policy_id: insertedPolicy.id,
        message: 'Apólice inserida com sucesso'
      });
    }

    console.log('🎉 Processamento do webhook concluído:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processadas ${webhookData.length} apólices`,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro no webhook N8N:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
