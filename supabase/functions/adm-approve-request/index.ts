import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { requestId, note } = body;

    console.log('Processing admin approval for request:', requestId);

    if (!requestId) {
      console.error('Missing requestId in request body');
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_REQUEST_ID', message: 'Request ID é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching request details for:', requestId);

    // Buscar request completo
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        id,
        protocol_code,
        kind,
        status,
        submitted_at,
        channel,
        metadata,
        updated_at
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('Request not found:', requestError?.message || 'No request data');
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Solicitação não encontrada' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Request found:', request.protocol_code, 'Status:', request.status);

    if (request.status !== 'aguardando_aprovacao') {
      console.error('Invalid status for admin approval:', request.status);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'INVALID_STATUS', message: 'Solicitação deve estar aguardando aprovação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing admin approval and creating employee/updating status');

    // Processar a solicitação baseada no tipo
    if (request.kind === 'inclusao') {
      // Criar colaborador a partir dos dados da solicitação
      const employeeData = request.metadata?.employee_data;
      
      if (!employeeData) {
        console.error('Employee data not found in request metadata');
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'INVALID_DATA', message: 'Dados do colaborador não encontrados' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Buscar empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('id', request.metadata?.company_id)
        .single();

      if (empresaError || !empresa) {
        console.error('Company not found:', empresaError);
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa não encontrada' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Criar colaborador
      const { data: colaborador, error: colaboradorError } = await supabase
        .from('colaboradores')
        .insert({
          nome: employeeData.nome,
          cpf: employeeData.cpf?.replace(/\D/g, ''),
          email: employeeData.email,
          telefone: employeeData.telefone,
          data_nascimento: employeeData.data_nascimento,
          cargo: employeeData.cargo,
          centro_custo: employeeData.centro_custo,
          data_admissao: employeeData.data_admissao,
          empresa_id: empresa.id,
          status: 'ativo'
        })
        .select()
        .single();

      if (colaboradorError) {
        console.error('❌ Erro ao criar colaborador:', colaboradorError);
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao criar colaborador: ' + colaboradorError.message } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('✅ Colaborador criado:', colaborador.id);

    } else if (request.kind === 'exclusao') {
      // Processar exclusão de colaborador
      const employeeId = request.metadata?.employee_data?.employee_id;
      
      if (!employeeId) {
        console.error('Employee ID not found for exclusion request');
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'INVALID_DATA', message: 'ID do colaborador não encontrado' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Atualizar status do colaborador
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({
          status: 'inativo',
          data_demissao: request.metadata?.employee_data?.data_desligamento
        })
        .eq('id', employeeId);

      if (updateError) {
        console.error('❌ Erro ao inativar colaborador:', updateError);
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao inativar colaborador' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('✅ Colaborador inativado:', employeeId);
    }

    console.log('Updating request status to aprovado_adm');

    // Atualizar status para aprovado_adm
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'aprovado_adm',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'UPDATE_ERROR', message: 'Erro ao aprovar solicitação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Request status updated successfully');
    console.log('Creating ticket snapshot');

    // Criar snapshot simplificado do request para o ticket
    const employeeData = request.metadata?.employee_data;
    const snapshot = {
      request_id: request.id,
      protocol_code: request.protocol_code,
      employee_data: employeeData,
      kind: request.kind,
      channel: request.channel,
      submitted_at: request.submitted_at,
      approved_at: new Date().toISOString(),
      metadata: request.metadata
    };

    console.log('Checking if ticket already exists for request:', requestId);
    
    // Check if ticket already exists for this request
    const { data: existingTicket, error: checkError } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('request_id', requestId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing ticket:', checkError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'TICKET_CHECK_FAILED', message: 'Falha ao verificar tickets existentes' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingTicket) {
      console.log('Ticket already exists:', existingTicket.id, 'Status:', existingTicket.status);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Ticket já existe para esta solicitação',
          data: { 
            ticketId: existingTicket.id,
            protocolCode: request.protocol_code,
            externalRef: null,
            existed: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating ticket for protocol:', request.protocol_code);

    // Criar ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([{
        request_id: requestId,
        protocol_code: request.protocol_code,
        status: 'aberto',
        payload: snapshot
      }])
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'TICKET_ERROR', message: 'Erro ao criar ticket' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Ticket created successfully:', ticket.id);
    console.log('Creating approval trail');

    // Criar trilha de aprovação
    const { error: approvalError } = await supabase
      .from('request_approvals')
      .insert([{
        request_id: requestId,
        role: 'adm',
        decision: 'aprovado',
        note: note || null,
        decided_at: new Date().toISOString()
      }]);

    if (approvalError) {
      console.error('Erro ao criar aprovação:', approvalError);
    }

    // Tentar disparar webhook se configurado
    const webhookUrl = Deno.env.get('TICKETS_WEBHOOK_URL');
    if (webhookUrl) {
      try {
        const webhookPayload = {
          event: 'request.approved_by_admin',
          protocol_code: request.protocol_code,
          request_id: requestId,
          ticket_id: ticket.id,
          snapshot
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('BACKEND_WRITE_TOKEN') || ''}`
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json();
          
          // Se webhook retornou referência externa, atualizar ticket
          if (webhookResult.external_ref) {
            await supabase
              .from('tickets')
              .update({ external_ref: webhookResult.external_ref })
              .eq('id', ticket.id);
          }
        } else {
          console.warn('Webhook falhou:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Erro no webhook:', webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true,
        data: {
          ticketId: ticket.id,
          protocolCode: request.protocol_code,
          externalRef: ticket.external_ref
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});