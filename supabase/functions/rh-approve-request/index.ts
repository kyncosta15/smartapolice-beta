import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ApproveRequestBody {
  requestId: string
  note?: string
}

interface FullRequest {
  id: string
  protocol_code: string
  kind: string
  status: string
  submitted_at: string
  draft: boolean
  metadata: any
  employee: {
    id: string
    full_name: string
    cpf: string
    email?: string
    phone?: string
    company_id: string
  }
  request_items: Array<{
    id: string
    target: string
    dependent_id?: string
    action: string
    notes?: string
  }>
  files: Array<{
    id: string
    path: string
    original_name?: string
    mime_type?: string
    size?: number
  }>
}

async function loadFullRequest(supabase: any, requestId: string): Promise<FullRequest | null> {
  console.log(`Loading full request: ${requestId}`)
  
  const { data: req, error } = await supabase
    .from('requests')
    .select(`
      id, protocol_code, kind, status, submitted_at, draft, metadata,
      employee:employees ( id, full_name, cpf, email, phone, company_id ),
      request_items ( id, target, dependent_id, action, notes ),
      files ( id, path, original_name, mime_type, size )
    `)
    .eq('id', requestId)
    .single()

  if (error) {
    console.error('Error loading request:', error)
    throw error
  }

  console.log(`Request loaded successfully: ${req.protocol_code}`)
  return req
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body: ApproveRequestBody = await req.json()
    const { requestId, note } = body

    console.log(`Processing approval for request: ${requestId}`)

    if (!requestId) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_REQUEST_ID', message: 'Request ID is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1) Load full request and validate eligibility
    const fullRequest = await loadFullRequest(supabase, requestId)
    
    if (!fullRequest || fullRequest.draft) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'INVALID_STATE', message: 'Rascunho ou inexistente' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (fullRequest.status !== 'recebido' && fullRequest.status !== 'em_validacao') {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'ALREADY_PROCESSED', message: 'Solicitação já enviada/processada' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Check if ticket already exists (idempotency)
    const { data: existing, error: ticketSelectError } = await supabase
      .from('tickets')
      .select('id, status, external_ref')
      .eq('request_id', requestId)
      .maybeSingle()

    if (ticketSelectError) {
      console.error('Error checking existing ticket:', ticketSelectError)
      throw ticketSelectError
    }

    if (existing) {
      console.log(`Ticket already exists: ${existing.id}`)
      return new Response(
        JSON.stringify({ 
          ok: true, 
          data: { 
            ticketId: existing.id, 
            status: existing.status, 
            external_ref: existing.external_ref 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Create ticket with snapshot
    const snapshot = {
      request: {
        id: fullRequest.id,
        protocol_code: fullRequest.protocol_code,
        kind: fullRequest.kind,
        submitted_at: fullRequest.submitted_at,
        metadata: fullRequest.metadata
      },
      employee: fullRequest.employee,
      items: fullRequest.request_items,
      files: fullRequest.files
    }

    console.log(`Creating ticket for request: ${fullRequest.protocol_code}`)

    const { data: ticket, error: ticketInsertError } = await supabase
      .from('tickets')
      .insert([{
        request_id: fullRequest.id,
        protocol_code: fullRequest.protocol_code,
        rh_note: note || null,
        status: 'aberto',
        payload: snapshot
      }])
      .select('id')
      .single()

    if (ticketInsertError) {
      console.error('Error creating ticket:', ticketInsertError)
      throw ticketInsertError
    }

    console.log(`Ticket created successfully: ${ticket.id}`)

    // 4) Try to send webhook to backoffice (optional)
    let externalRef: string | undefined
    const webhookUrl = Deno.env.get('TICKETS_WEBHOOK_URL')
    
    if (webhookUrl) {
      console.log('Sending webhook to backoffice...')
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('BACKEND_WRITE_TOKEN') || ''}`
          },
          body: JSON.stringify({
            event: 'request.approved',
            protocol_code: fullRequest.protocol_code,
            request_id: fullRequest.id,
            rh_note: note || null,
            employee: snapshot.employee,
            items: snapshot.items,
            files: snapshot.files
          })
        })

        const webhookResult = await webhookResponse.json().catch(() => ({}))
        if (webhookResult?.ok && webhookResult?.external_ref) {
          externalRef = webhookResult.external_ref as string
        }

        // Update ticket status based on webhook response
        await supabase.from('tickets')
          .update({ 
            status: webhookResponse.ok ? 'enviado' : 'erro', 
            external_ref: externalRef || null 
          })
          .eq('id', ticket.id)

        console.log(`Webhook sent, ticket status updated to: ${webhookResponse.ok ? 'enviado' : 'erro'}`)
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError)
        await supabase.from('tickets')
          .update({ status: 'erro' })
          .eq('id', ticket.id)
      }
    }

    // 5) Update request status
    await supabase
      .from('requests')
      .update({ 
        status: 'aprovado_rh', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', fullRequest.id)

    console.log(`Request status updated to aprovado_rh`)

    return new Response(
      JSON.stringify({ 
        ok: true, 
        data: { 
          ticketId: ticket.id, 
          external_ref: externalRef || null 
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Approve request error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: { 
          code: 'APPROVE_FAILED', 
          message: 'Falha ao aprovar/enviar ticket' 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})