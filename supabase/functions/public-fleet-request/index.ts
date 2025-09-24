import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Received public fleet request:', JSON.stringify(body, null, 2));

    const { token, formData, anexos } = body;

    if (!token || !formData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token e dados do formulário são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('public_fleet_tokens')
      .select('*')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido ou expirado' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gerar código de protocolo
    const protocolCode = generateProtocolCode();

    // Preparar payload para a solicitação
    const payload = {
      motivo: formData.motivo,
      solicitante: {
        nome: formData.solicitante_nome,
        email: formData.solicitante_email,
        telefone: formData.solicitante_telefone,
        setor: formData.solicitante_setor,
      },
    };

    // Adicionar dados específicos baseados no tipo
    if (['tirar_do_seguro', 'colocar_no_seguro'].includes(formData.tipo)) {
      payload.seguro = {
        seguradora: formData.seguradora,
        numero_apolice: formData.numero_apolice,
        vigencia_inicio: formData.vigencia_inicio,
        vigencia_fim: formData.vigencia_fim,
        cobertura: formData.cobertura,
      };
    }

    if (formData.tipo === 'mudanca_responsavel') {
      payload.responsavel = {
        nome: formData.responsavel_nome,
        telefone: formData.responsavel_telefone,
        email: formData.responsavel_email,
      };
    }

    // Verificar se existe veículo com a placa/chassi informado
    let vehicleId = null;
    if (formData.placa || formData.chassi) {
      const query = supabase
        .from('frota_veiculos')
        .select('id, marca, modelo, ano_modelo, categoria')
        .eq('empresa_id', tokenData.empresa_id);

      if (formData.placa) query.eq('placa', formData.placa);
      if (formData.chassi) query.eq('chassi', formData.chassi);

      const { data: vehicle } = await query.single();
      if (vehicle) {
        vehicleId = vehicle.id;
      }
    }

    // Criar solicitação
    const { data: request, error: insertError } = await supabase
      .from('fleet_change_requests')
      .insert({
        empresa_id: tokenData.empresa_id,
        user_id: tokenData.created_by, // Usuário que gerou o link
        vehicle_id: vehicleId,
        tipo: formData.tipo,
        placa: formData.placa,
        chassi: formData.chassi,
        renavam: formData.renavam,
        status: 'aberto',
        prioridade: 'normal',
        payload,
        anexos: anexos || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      throw insertError;
    }

    // Salvar documentos anexados na tabela específica
    if (anexos && anexos.length > 0) {
      const documentInserts = anexos.map(file => ({
        request_id: request.id,
        file_name: file.name,
        file_url: file.url,
        file_size: file.size,
        mime_type: file.name.split('.').pop() || 'unknown'
      }));

      const { error: docsError } = await supabase
        .from('fleet_request_documents')
        .insert(documentInserts);

      if (docsError) {
        console.error('Error saving documents:', docsError);
        // Não falhar a solicitação por causa dos documentos
      }
    }

    // Marcar token como usado
    await supabase
      .from('public_fleet_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Atualizar solicitação com protocolo
    await supabase
      .from('fleet_change_requests')
      .update({ 
        payload: { 
          ...payload, 
          protocol_code: protocolCode 
        } 
      })
      .eq('id', request.id);

    console.log('Public fleet request created successfully:', request.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        protocolCode,
        requestId: request.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in public fleet request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateProtocolCode(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `SB-${year}-${timestamp}`;
}