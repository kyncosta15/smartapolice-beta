import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';

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
    console.log('Received fleet request approval:', JSON.stringify(body, null, 2));

    const { requestId, action, comments, approvedBy } = body;

    if (!requestId || !action || !approvedBy) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'requestId, action e approvedBy são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar solicitação
    const { data: request, error: requestError } = await supabase
      .from('fleet_change_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solicitação não encontrada' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se pode ser processada
    if (!['aberto', 'em_triagem'].includes(request.status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solicitação não pode ser processada no status atual' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const newStatus = action === 'approve' ? 'aprovado' : 'recusado';

    // Atualizar status da solicitação
    const updatedPayload = {
      ...request.payload,
      approval: {
        action,
        comments,
        approved_by: approvedBy,
        processed_at: new Date().toISOString(),
      }
    };

    const { error: updateError } = await supabase
      .from('fleet_change_requests')
      .update({
        status: newStatus,
        payload: updatedPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw updateError;
    }

    // Se aprovado, processar a alteração na frota
    if (action === 'approve') {
      try {
        await processFleetChange(supabase, request);
        
        // Marcar como executado
        await supabase
          .from('fleet_change_requests')
          .update({
            status: 'executado',
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        console.log('Fleet change processed successfully');
      } catch (error) {
        console.error('Error processing fleet change:', error);
        // Manter como aprovado mas não executado em caso de erro
      }
    }

    console.log(`Fleet request ${requestId} ${action}ed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Solicitação ${action === 'approve' ? 'aprovada' : 'recusada'} com sucesso`,
        newStatus
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fleet request approval:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : 'Unknown error') || 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processFleetChange(supabase: any, request: any) {
  console.log('Processing fleet change:', request.tipo, request.id);

  switch (request.tipo) {
    case 'inclusao_veiculo':
      await processVehicleInclusion(supabase, request);
      break;
    
    case 'exclusao_veiculo':
      await processVehicleExclusion(supabase, request);
      break;
    
    case 'tirar_do_seguro':
      await processRemoveFromInsurance(supabase, request);
      break;
    
    case 'colocar_no_seguro':
      await processAddToInsurance(supabase, request);
      break;
    
    case 'atualizacao_dados':
      await processDataUpdate(supabase, request);
      break;
    
    case 'mudanca_responsavel':
      await processResponsibleChange(supabase, request);
      break;
    
    case 'documentacao':
      // Documentação não requer alteração automática na frota
      console.log('Documentation request - no automatic fleet change required');
      break;
    
    default:
      console.log('Unknown request type:', request.tipo);
  }
}

async function processVehicleInclusion(supabase: any, request: any) {
  // Criar novo veículo na frota
  const vehicleData = {
    empresa_id: request.empresa_id,
    placa: request.placa,
    chassi: request.chassi,
    renavam: request.renavam,
    status_seguro: 'sem_seguro',
    observacoes: `Incluído via solicitação ${request.id}`,
    created_by: request.user_id,
  };

  const { data: vehicle, error } = await supabase
    .from('frota_veiculos')
    .insert(vehicleData)
    .select()
    .single();

  if (error) throw error;

  console.log('Vehicle created:', vehicle.id);
}

async function processVehicleExclusion(supabase: any, request: any) {
  if (!request.vehicle_id) {
    throw new Error('ID do veículo é necessário para exclusão');
  }

  // Marcar veículo como inativo ou deletar
  const { error } = await supabase
    .from('frota_veiculos')
    .update({
      status_veiculo: 'inativo',
      observacoes: `Excluído via solicitação ${request.id}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.vehicle_id);

  if (error) throw error;

  console.log('Vehicle excluded:', request.vehicle_id);
}

async function processRemoveFromInsurance(supabase: any, request: any) {
  if (!request.vehicle_id) {
    throw new Error('ID do veículo é necessário');
  }

  const { error } = await supabase
    .from('frota_veiculos')
    .update({
      status_seguro: 'sem_seguro',
      observacoes: `Seguro removido via solicitação ${request.id}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.vehicle_id);

  if (error) throw error;

  console.log('Vehicle removed from insurance:', request.vehicle_id);
}

async function processAddToInsurance(supabase: any, request: any) {
  if (!request.vehicle_id) {
    throw new Error('ID do veículo é necessário');
  }

  const { error } = await supabase
    .from('frota_veiculos')
    .update({
      status_seguro: 'segurado',
      observacoes: `Seguro adicionado via solicitação ${request.id}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.vehicle_id);

  if (error) throw error;

  console.log('Vehicle added to insurance:', request.vehicle_id);
}

async function processDataUpdate(supabase: any, request: any) {
  if (!request.vehicle_id) {
    throw new Error('ID do veículo é necessário para atualização');
  }

  // Atualizar dados básicos do veículo
  const updateData: any = {
    observacoes: `Dados atualizados via solicitação ${request.id}`,
    updated_at: new Date().toISOString(),
  };

  if (request.placa) updateData.placa = request.placa;
  if (request.chassi) updateData.chassi = request.chassi;
  if (request.renavam) updateData.renavam = request.renavam;

  const { error } = await supabase
    .from('frota_veiculos')
    .update(updateData)
    .eq('id', request.vehicle_id);

  if (error) throw error;

  console.log('Vehicle data updated:', request.vehicle_id);
}

async function processResponsibleChange(supabase: any, request: any) {
  if (!request.vehicle_id) {
    throw new Error('ID do veículo é necessário para mudança de responsável');
  }

  const responsavelData = request.payload.responsavel;
  if (!responsavelData?.nome) {
    throw new Error('Dados do novo responsável são necessários');
  }

  // Desativar responsáveis atuais
  await supabase
    .from('frota_responsaveis')
    .delete()
    .eq('veiculo_id', request.vehicle_id);

  // Criar novo responsável
  const { error } = await supabase
    .from('frota_responsaveis')
    .insert({
      veiculo_id: request.vehicle_id,
      nome: responsavelData.nome,
      telefone: responsavelData.telefone,
    });

  if (error) throw error;

  console.log('Vehicle responsible changed:', request.vehicle_id);
}