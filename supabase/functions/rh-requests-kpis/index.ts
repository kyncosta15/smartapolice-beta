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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Função helper para contagem
    const getCount = async (status?: string) => {
      let query = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('draft', false);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    // Contagem de tickets
    const { count: ticketsCount, error: ticketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    if (ticketsError) throw ticketsError;

    // Executar todas as consultas em paralelo
    const [total, recebidos, em_validacao, concluidos, recusados] = await Promise.all([
      getCount(),
      getCount('recebido'),
      getCount('em_validacao'),
      getCount('concluido'),
      getCount('recusado')
    ]);

    const kpis = {
      total,
      recebidos,
      em_validacao,
      concluidos,
      recusados,
      tickets: ticketsCount || 0
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