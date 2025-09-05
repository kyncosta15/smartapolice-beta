import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter ID do colaborador da URL
    const url = new URL(req.url);
    const colaboradorId = url.searchParams.get('id');
    
    if (!colaboradorId) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_ID', message: 'ID do colaborador é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verificar se o colaborador existe
    const { data: colaborador, error: selectError } = await supabase
      .from('colaboradores')
      .select('id, nome')
      .eq('id', colaboradorId)
      .maybeSingle();

    if (selectError) throw selectError;
    
    if (!colaborador) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Colaborador não encontrado' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Excluir o colaborador (CASCADE irá excluir dependentes e planos automaticamente)
    const { error: deleteError } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ ok: true, message: 'Colaborador excluído com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'DELETE_FAILED', message: 'Falha ao excluir colaborador' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});