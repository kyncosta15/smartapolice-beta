import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8NPolicyData {
  user_id: string;
  numero_apolice: string;
  segurado: string;
  seguradora: string;
  tipo_seguro: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  valor_premio: number;
  custo_mensal: number;
  quantidade_parcelas?: number;
  status?: string;
  nosnum?: number;
  codfil?: number;
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  modelo_veiculo?: string;
  placa?: string;
  ano_modelo?: number;
  uf?: string;
  franquia?: number;
  corretora?: string;
  coberturas?: Array<{
    descricao: string;
    lmi?: number;
  }>;
  installments?: Array<{
    numero: number;
    valor: number;
    data: string;
    status: 'paga' | 'pendente';
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validar token de autenticação do N8N
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('N8N_WEBHOOK_TOKEN');
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.log('❌ Token inválido');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: N8NPolicyData = await req.json();
    console.log('📦 Recebendo apólice do N8N:', body);

    // Validar campos obrigatórios
    if (!body.user_id || !body.numero_apolice || !body.segurado || !body.seguradora) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe apólice com o mesmo número
    const { data: existingPolicy } = await supabase
      .from('policies')
      .select('id')
      .eq('user_id', body.user_id)
      .eq('numero_apolice', body.numero_apolice)
      .maybeSingle();

    let policyId: string;

    if (existingPolicy) {
      // Atualizar apólice existente
      console.log('🔄 Atualizando apólice existente:', existingPolicy.id);
      policyId = existingPolicy.id;

      const { error: updateError } = await supabase
        .from('policies')
        .update({
          segurado: body.segurado,
          seguradora: body.seguradora,
          tipo_seguro: body.tipo_seguro,
          inicio_vigencia: body.inicio_vigencia,
          fim_vigencia: body.fim_vigencia,
          expiration_date: body.fim_vigencia,
          valor_premio: body.valor_premio,
          custo_mensal: body.custo_mensal,
          quantidade_parcelas: body.quantidade_parcelas,
          status: body.status || 'vigente',
          nosnum: body.nosnum,
          codfil: body.codfil,
          documento: body.documento,
          documento_tipo: body.documento_tipo,
          modelo_veiculo: body.modelo_veiculo,
          placa: body.placa,
          ano_modelo: body.ano_modelo?.toString(),
          uf: body.uf,
          franquia: body.franquia,
          corretora: body.corretora,
          updated_at: new Date().toISOString(),
        })
        .eq('id', policyId);

      if (updateError) {
        console.error('❌ Erro ao atualizar apólice:', updateError);
        throw updateError;
      }

      // Deletar coberturas antigas e criar novas
      await supabase.from('coberturas').delete().eq('policy_id', policyId);
      
      // Deletar parcelas antigas e criar novas
      await supabase.from('installments').delete().eq('policy_id', policyId);

    } else {
      // Criar nova apólice
      console.log('✨ Criando nova apólice');
      policyId = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('policies')
        .insert({
          id: policyId,
          user_id: body.user_id,
          numero_apolice: body.numero_apolice,
          segurado: body.segurado,
          seguradora: body.seguradora,
          tipo_seguro: body.tipo_seguro,
          inicio_vigencia: body.inicio_vigencia,
          fim_vigencia: body.fim_vigencia,
          expiration_date: body.fim_vigencia,
          valor_premio: body.valor_premio,
          custo_mensal: body.custo_mensal,
          quantidade_parcelas: body.quantidade_parcelas,
          status: body.status || 'vigente',
          nosnum: body.nosnum,
          codfil: body.codfil,
          documento: body.documento,
          documento_tipo: body.documento_tipo,
          modelo_veiculo: body.modelo_veiculo,
          placa: body.placa,
          ano_modelo: body.ano_modelo?.toString(),
          uf: body.uf,
          franquia: body.franquia,
          corretora: body.corretora,
          created_by_extraction: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('❌ Erro ao criar apólice:', insertError);
        throw insertError;
      }
    }

    // Inserir coberturas
    if (body.coberturas && body.coberturas.length > 0) {
      const coberturasData = body.coberturas.map((cob) => ({
        policy_id: policyId,
        descricao: cob.descricao,
        lmi: cob.lmi,
      }));

      const { error: coberturasError } = await supabase
        .from('coberturas')
        .insert(coberturasData);

      if (coberturasError) {
        console.error('⚠️ Erro ao inserir coberturas:', coberturasError);
      } else {
        console.log(`✅ ${coberturasData.length} coberturas inseridas`);
      }
    }

    // Inserir parcelas
    if (body.installments && body.installments.length > 0) {
      const installmentsData = body.installments.map((inst) => ({
        policy_id: policyId,
        user_id: body.user_id,
        numero_parcela: inst.numero,
        valor: inst.valor,
        data_vencimento: inst.data,
        status: inst.status,
      }));

      const { error: installmentsError } = await supabase
        .from('installments')
        .insert(installmentsData);

      if (installmentsError) {
        console.error('⚠️ Erro ao inserir parcelas:', installmentsError);
      } else {
        console.log(`✅ ${installmentsData.length} parcelas inseridas`);
      }
    }

    console.log('✅ Apólice processada com sucesso:', policyId);

    return new Response(
      JSON.stringify({
        success: true,
        policy_id: policyId,
        message: existingPolicy ? 'Apólice atualizada' : 'Apólice criada',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Erro ao processar apólice do N8N',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
