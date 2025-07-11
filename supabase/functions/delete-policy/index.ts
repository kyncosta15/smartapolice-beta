
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { policyId } = await req.json();

    if (!policyId) {
      throw new Error('ID da apólice é obrigatório');
    }

    console.log(`🗑️ Iniciando deleção da apólice: ${policyId} para usuário: ${user.id}`);

    // Verificar se a apólice pertence ao usuário
    const { data: policy, error: policyError } = await supabaseClient
      .from('policies')
      .select('arquivo_url, user_id')
      .eq('id', policyId)
      .single();

    if (policyError) {
      console.error('Erro ao buscar apólice:', policyError);
      throw new Error('Apólice não encontrada');
    }

    if (policy.user_id !== user.id) {
      throw new Error('Acesso negado: você não tem permissão para deletar esta apólice');
    }

    // Usar a função do banco de dados para deletar tudo
    const { error: deleteError } = await supabaseClient
      .rpc('delete_policy_completely', { policy_id_param: policyId });

    if (deleteError) {
      console.error('Erro ao deletar apólice completamente:', deleteError);
      throw new Error(`Erro ao deletar apólice: ${deleteError.message}`);
    }

    // Se houver arquivo PDF, tentar deletar do storage
    if (policy.arquivo_url) {
      try {
        console.log(`🗑️ Tentando deletar arquivo: ${policy.arquivo_url}`);
        
        // Extrair o caminho do arquivo da URL
        const filePath = policy.arquivo_url.split('/').pop();
        const fullPath = `${user.id}/${filePath}`;
        
        const { error: storageError } = await supabaseClient.storage
          .from('pdfs')
          .remove([fullPath]);

        if (storageError) {
          console.warn('Aviso: Erro ao deletar arquivo do storage:', storageError);
          // Não falha a operação se o arquivo não puder ser deletado
        } else {
          console.log('✅ Arquivo deletado do storage com sucesso');
        }
      } catch (storageErr) {
        console.warn('Aviso: Erro inesperado ao deletar arquivo:', storageErr);
        // Continuar mesmo se houver erro no storage
      }
    }

    console.log('✅ Apólice deletada completamente com sucesso');

    return new Response(
      JSON.stringify({ success: true, message: 'Apólice deletada com sucesso' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na função delete-policy:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
