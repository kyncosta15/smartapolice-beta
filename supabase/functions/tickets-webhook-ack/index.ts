import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WebhookAckBody {
  protocol_code: string
  status: 'processando' | 'concluido' | 'recusado' | 'erro'
  external_ref?: string
  note?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate authorization
    const auth = req.headers.get('authorization')
    const expectedToken = `Bearer ${Deno.env.get('BACKEND_WRITE_TOKEN')}`
    
    if (auth !== expectedToken) {
      console.log('Unauthorized webhook attempt')
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'FORBIDDEN', message: 'No auth' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body: WebhookAckBody = await req.json()
    const { protocol_code, status, external_ref, note } = body

    console.log(`Processing webhook ack for protocol: ${protocol_code}, status: ${status}`)

    // Validate required fields
    if (!protocol_code || !status) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'MISSING_FIELDS', message: 'protocol_code and status are required' } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate status values
    const validStatuses = ['processando', 'concluido', 'recusado', 'erro']
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'INVALID_STATUS', message: 'Invalid status value' } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find ticket by protocol_code
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, request_id')
      .eq('protocol_code', protocol_code)
      .single()

    if (ticketError || !ticket) {
      console.error('Ticket not found:', ticketError)
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update ticket
    const { error: updateTicketError } = await supabase
      .from('tickets')
      .update({
        status,
        external_ref: external_ref || null,
        rh_note: note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id)

    if (updateTicketError) {
      console.error('Error updating ticket:', updateTicketError)
      throw updateTicketError
    }

    console.log(`Ticket ${ticket.id} updated successfully`)

    // Map ticket status to request status
    const requestStatus = status === 'concluido' ? 'concluido'
                        : status === 'recusado' ? 'recusado'
                        : 'em_validacao'

    // Update request status
    const { error: updateRequestError } = await supabase
      .from('requests')
      .update({
        status: requestStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.request_id)

    if (updateRequestError) {
      console.error('Error updating request:', updateRequestError)
      throw updateRequestError
    }

    console.log(`Request ${ticket.request_id} status updated to: ${requestStatus}`)

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook ack error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: { 
          code: 'WEBHOOK_FAILED', 
          message: 'Falha ao processar webhook' 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})