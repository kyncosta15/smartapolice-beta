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

    const { data, error } = await supabase
      .from('requests')
      .select(`
        id, protocol_code, kind, status, submitted_at, draft,
        employee:employees ( full_name, cpf ),
        request_items(count)
      `)
      .eq('draft', false)
      .order('submitted_at', { ascending: false })
      .limit(400);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'FETCH_FAILED', message: error.message } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const list = (data ?? []).map(r => ({
      id: r.id,
      protocol_code: r.protocol_code,
      colaborador: r.employee?.full_name,
      cpf: r.employee?.cpf,
      tipo: r.kind,
      status: r.status,
      submitted_at: r.submitted_at,
      qtd_itens: (r as any).request_items?.[0]?.count ?? 0
    }));

    return new Response(
      JSON.stringify({ ok: true, data: list }),
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