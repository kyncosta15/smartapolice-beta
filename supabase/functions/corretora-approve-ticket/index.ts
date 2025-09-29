import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveTicketBody {
  ticketId: string;
  action: 'approve' | 'reject';
  note?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { ticketId, action, note }: ApproveTicketBody = await req.json();

    if (!ticketId || !action) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'INVALID_INPUT', message: 'ticketId e action são obrigatórios' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar o ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket:', ticketError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'TICKET_NOT_FOUND', message: 'Ticket não encontrado' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verificar se o ticket pode ser processado
    if (!['aberto', 'em_validacao'].includes(ticket.status)) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'INVALID_STATUS', message: 'Ticket já foi processado' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'aprovado' : 'rejeitado';
    const requestStatus = action === 'approve' ? 'concluido' : 'recusado';

    // Atualizar o ticket
    const { error: updateTicketError } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        rh_note: note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateTicketError) {
      console.error('Erro ao atualizar ticket:', updateTicketError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'UPDATE_FAILED', message: 'Falha ao atualizar ticket' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Atualizar a request correspondente se existir
    if (ticket.request_id) {
      const { error: updateRequestError } = await supabase
        .from('requests')
        .update({ 
          status: requestStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.request_id);

      if (updateRequestError) {
        console.error('Erro ao atualizar request:', updateRequestError);
        // Não falhar completamente, apenas logar o erro
      }
    }

    // Se aprovado, enviar para sistema externo (se necessário)
    if (action === 'approve') {
      const ticketsWebhookUrl = Deno.env.get('TICKETS_WEBHOOK_URL');
      
      if (ticketsWebhookUrl) {
        try {
          const webhookPayload = {
            protocol_code: ticket.protocol_code,
            status: 'aprovado',
            external_ref: ticket.external_ref,
            note: note || 'Aprovado pelo administrador da corretora',
            payload: ticket.payload
          };

          const webhookResponse = await fetch(ticketsWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('BACKEND_WRITE_TOKEN') || ''}`
            },
            body: JSON.stringify(webhookPayload)
          });

          if (webhookResponse.ok) {
            console.log('Webhook enviado com sucesso para:', ticketsWebhookUrl);
            
            // Atualizar com referência externa se retornada
            const webhookResult = await webhookResponse.json();
            if (webhookResult.external_ref) {
              await supabase
                .from('tickets')
                .update({ external_ref: webhookResult.external_ref })
                .eq('id', ticketId);
            }
          } else {
            console.error('Falha no webhook:', await webhookResponse.text());
          }
        } catch (webhookError) {
          console.error('Erro ao enviar webhook:', webhookError);
          // Não falhar a operação por causa do webhook
        }
      }
    }

    console.log(`Ticket ${ticketId} ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: `Ticket ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
        data: { 
          ticketId, 
          status: newStatus,
          protocol_code: ticket.protocol_code
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});