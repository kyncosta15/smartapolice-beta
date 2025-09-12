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

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar solicitações aprovadas pelo RH
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        protocol_code,
        kind,
        status,
        submitted_at,
        metadata
      `)
      .eq('draft', false)
      .in('status', ['aprovado_rh', 'em_validacao_adm'])
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar requests:', error);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao buscar solicitações' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const formattedRequests = (requests || []).map((req: any) => {
      const employeeData = req.metadata?.employee_data || {};
      return {
        id: req.id,
        protocol_code: req.protocol_code,
        colaborador: employeeData.nome || 'Nome não informado',
        cpf: employeeData.cpf || '',
        tipo: req.kind,
        status: req.status,
        submitted_at: req.submitted_at,
        qtd_itens: 1 // Para requests de funcionários, sempre 1 item
      };
    });

    return new Response(
      JSON.stringify({ ok: true, data: formattedRequests }),
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