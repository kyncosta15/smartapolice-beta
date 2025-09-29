import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter ID do colaborador do body da requisição
    const { id: colaboradorId } = await req.json();
    
    if (!colaboradorId) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_ID', message: 'ID do colaborador é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Iniciando exclusão do colaborador: ${colaboradorId}`);

    // Verificar se o colaborador existe
    const { data: colaborador, error: selectError } = await supabase
      .from('colaboradores')
      .select('id, nome')
      .eq('id', colaboradorId)
      .maybeSingle();

    if (selectError) {
      console.error('Erro ao buscar colaborador:', selectError);
      throw selectError;
    }
    
    if (!colaborador) {
      console.log(`Colaborador ${colaboradorId} não encontrado`);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Colaborador não encontrado' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Excluindo colaborador: ${colaborador.nome} (${colaboradorId})`);

    // Excluir o colaborador (CASCADE irá excluir dependentes e planos automaticamente)
    const { error: deleteError } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId);

    if (deleteError) {
      console.error('Erro ao excluir colaborador:', deleteError);
      throw deleteError;
    }

    console.log(`Colaborador ${colaborador.nome} (${colaboradorId}) excluído com sucesso`);

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