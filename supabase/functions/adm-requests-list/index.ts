import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';

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

    // Buscar solicitações que precisam de aprovação do Admin
    // - Status 'aguardando_aprovacao': Solicitações do RH aguardando aprovação
    // - Status 'aprovado_rh': Solicitações já aprovadas pelo RH (se houver um fluxo duplo)
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
      .in('status', ['aguardando_aprovacao', 'aprovado_rh'])
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar requests:', error);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao buscar solicitações' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const formattedRequests = (requests || []).map((req: any) => {
      // Handle metadata structure - check if it exists and has the expected format
      let colaboradorName = 'Nome não informado';
      let cpfValue = '';
      
      if (req.metadata) {
        // If metadata has employee_data (new format)
        if (req.metadata.employee_data) {
          colaboradorName = req.metadata.employee_data.nome || 'Nome não informado';
          cpfValue = req.metadata.employee_data.cpf || '';
        }
        // If metadata has direct employee info (alternative format)
        else if (req.metadata.nome) {
          colaboradorName = req.metadata.nome;
          cpfValue = req.metadata.cpf || '';
        }
      }

      return {
        id: req.id,
        protocol_code: req.protocol_code,
        colaborador: colaboradorName,
        cpf: cpfValue,
        tipo: req.kind === 'inclusao' ? 'inclusao' : 'exclusao',
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