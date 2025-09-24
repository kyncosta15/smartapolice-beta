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

    // Get N8N webhook configuration
    const n8nWebhookUrl = Deno.env.get('N8N_FROTA_WEBHOOK');
    const n8nSecret = Deno.env.get('N8N_FROTA_SECRET');

    if (!n8nWebhookUrl) {
      console.log('N8N webhook URL not configured, skipping webhook call');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Request processed (webhook not configured)' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json();
    console.log('Received fleet request webhook payload:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.request_id || !body.empresa_id || !body.tipo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: request_id, empresa_id, tipo' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare webhook payload for N8N
    const webhookPayload = {
      request_id: body.request_id,
      empresa_id: body.empresa_id,
      user_id: body.user_id,
      tipo: body.tipo,
      identificacao: {
        placa: body.identificacao?.placa || null,
        chassi: body.identificacao?.chassi || null,
        renavam: body.identificacao?.renavam || null,
      },
      payload: body.payload || {},
      anexos: body.anexos || [],
      created_at: body.created_at || new Date().toISOString(),
    };

    console.log('Sending to N8N webhook:', webhookPayload);

    // Send to N8N webhook
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (n8nSecret) {
      webhookHeaders['X-Webhook-Secret'] = n8nSecret;
    }

    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify(webhookPayload),
    });

    console.log('N8N webhook response status:', webhookResponse.status);

    if (webhookResponse.ok) {
      // Update request status to 'em_triagem' if webhook succeeded
      const { error: updateError } = await supabase
        .from('fleet_change_requests')
        .update({ 
          status: 'em_triagem',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.request_id);

      if (updateError) {
        console.error('Error updating request status:', updateError);
      } else {
        console.log('Request status updated to em_triagem');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Request sent to N8N successfully',
          webhook_status: webhookResponse.status
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      const errorText = await webhookResponse.text();
      console.error('N8N webhook error:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Webhook call failed',
          webhook_status: webhookResponse.status,
          webhook_error: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in fleet request webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});