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

    // Buscar request completo para criar ticket
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        employees!inner(
          full_name,
          cpf,
          email,
          phone,
          company_id
        ),
        request_items(
          id,
          target,
          action,
          notes,
          dependent_id,
          dependents(
            full_name,
            relationship,
            cpf,
            birth_date
          )
        ),
        files(
          id,
          original_name,
          mime_type,
          size,
          path
        )
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

    if (request.status !== 'aprovado_rh') {
      console.error('Invalid status for admin approval:', request.status);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'INVALID_STATUS', message: 'Solicitação deve estar aprovada pelo RH' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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

    // Criar snapshot do request para o ticket
    const snapshot = {
      request_id: request.id,
      protocol_code: request.protocol_code,
      employee: request.employees,
      items: request.request_items,
      files: request.files,
      metadata: request.metadata,
      kind: request.kind,
      channel: request.channel,
      submitted_at: request.submitted_at,
      approved_at: new Date().toISOString()
    };

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