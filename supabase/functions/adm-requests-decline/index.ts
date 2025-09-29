import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

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
    const { requestId, reason } = body;

    if (!requestId) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_REQUEST_ID', message: 'Request ID é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Atualizar status para recusado_adm
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'recusado_adm',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Erro ao atualizar request:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'UPDATE_ERROR', message: 'Erro ao recusar solicitação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Criar trilha de recusa
    const { error: approvalError } = await supabase
      .from('request_approvals')
      .insert([{
        request_id: requestId,
        role: 'adm',
        decision: 'recusado',
        note: reason || null,
        decided_at: new Date().toISOString()
      }]);

    if (approvalError) {
      console.error('Erro ao criar recusa:', approvalError);
    }

    return new Response(
      JSON.stringify({ ok: true }),
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