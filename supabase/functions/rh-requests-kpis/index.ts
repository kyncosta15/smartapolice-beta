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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pegar company_id do parâmetro da query se fornecido
    const url = new URL(req.url);
    const companyId = url.searchParams.get('company_id');

    // Função helper para contagem de colaboradores ativos
    const getActiveEmployeesCount = async () => {
      let query = supabase
        .from('colaboradores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');
      
      if (companyId) {
        query = query.eq('empresa_id', companyId);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    // Função para calcular custo mensal dos colaboradores ativos
    const getMonthlyCost = async () => {
      let query = supabase
        .from('colaboradores')
        .select('custo_mensal')
        .eq('status', 'ativo');
      
      if (companyId) {
        query = query.eq('empresa_id', companyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).reduce((sum, col) => sum + (col.custo_mensal || 0), 0);
    };

    // Contagem de tickets abertos
    const getOpenTicketsCount = async () => {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aberto', 'enviado', 'processando']);

      if (error) throw error;
      return count || 0;
    };

    // Executar todas as consultas em paralelo
    const [colaboradoresAtivos, custoMensal, ticketsAbertos] = await Promise.all([
      getActiveEmployeesCount(),
      getMonthlyCost(), 
      getOpenTicketsCount()
    ]);

    const custoMedioVida = colaboradoresAtivos > 0 ? custoMensal / colaboradoresAtivos : 0;

    const kpis = {
      colaboradoresAtivos,
      custoMensal,
      custoMedioVida,
      ticketsAbertos
    };

    return new Response(
      JSON.stringify({ ok: true, data: kpis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});