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

  // Accept both GET and POST methods for Supabase functions invoke
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let requestId: string;
    
    if (req.method === 'POST') {
      const body = await req.json();
      requestId = body.requestId;
    } else {
      const url = new URL(req.url);
      requestId = url.searchParams.get('requestId') || '';
    }

    if (!requestId) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_PARAM', message: 'requestId é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('🔍 Buscando detalhes da solicitação:', requestId);

    // Buscar dados detalhados da solicitação
    const { data: request, error } = await supabase
      .from('requests')
      .select(`
        id,
        protocol_code,
        kind,
        status,
        submitted_at,
        metadata
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar request:', error);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao buscar solicitação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!request) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Solicitação não encontrada' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Buscar aprovações da solicitação
    const { data: approvals, error: approvalsError } = await supabase
      .from('request_approvals')
      .select(`
        id,
        role,
        decision,
        decided_at,
        note
      `)
      .eq('request_id', requestId)
      .order('decided_at', { ascending: false });

    if (approvalsError) {
      console.error('❌ Erro ao buscar aprovações:', approvalsError);
    }

    // Formatar resposta
    const requestDetail = {
      id: request.id,
      protocol_code: request.protocol_code,
      kind: request.kind,
      status: request.status,
      submitted_at: request.submitted_at,
      employee: {
        full_name: request.metadata?.employee_data?.nome || 'Nome não informado',
        cpf: request.metadata?.employee_data?.cpf || '',
        email: request.metadata?.employee_data?.email || '',
        phone: request.metadata?.employee_data?.telefone || ''
      },
      request_items: [
        {
          id: '1',
          target: 'titular',
          action: request.kind,
          notes: request.metadata?.observacoes || ''
        }
      ],
      approvals: approvals || []
    };

    console.log('✅ Detalhes da solicitação encontrados');

    return new Response(
      JSON.stringify({ ok: true, data: requestDetail }),
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