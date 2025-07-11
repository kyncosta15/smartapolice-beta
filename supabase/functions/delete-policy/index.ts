
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🚀 [delete-policy-${requestId}] Requisição iniciada às ${new Date().toISOString()}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [delete-policy-${requestId}] CORS preflight - respondendo OK`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { policyId } = await req.json()
    console.log(`🔍 [delete-policy-${requestId}] Dados recebidos:`, { policyId });
    
    if (!policyId) {
      console.log(`❌ [delete-policy-${requestId}] Policy ID não fornecido`);
      return new Response(
        JSON.stringify({ error: 'Policy ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log(`🔐 [delete-policy-${requestId}] Auth header presente:`, !!authHeader);
    
    if (!authHeader) {
      console.log(`❌ [delete-policy-${requestId}] Authorization header ausente`);
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log(`👤 [delete-policy-${requestId}] Verificação de usuário:`, {
      userExists: !!user,
      userId: user?.id,
      authError: authError?.message
    });
    
    if (authError || !user) {
      console.log(`❌ [delete-policy-${requestId}] Token inválido ou expirado`);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log(`🗑️ [delete-policy-${requestId}] Deletando apólice ${policyId} para usuário ${user.id}`);

    // Get policy details first to check ownership and get file path
    console.log(`🔍 [delete-policy-${requestId}] Buscando detalhes da apólice no banco...`);
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('arquivo_url, user_id, segurado, numero_apolice')
      .eq('id', policyId)
      .single()

    console.log(`📋 [delete-policy-${requestId}] Resultado da busca da apólice:`, {
      found: !!policy,
      policyData: policy ? {
        arquivo_url: policy.arquivo_url,
        user_id: policy.user_id,
        segurado: policy.segurado,
        numero_apolice: policy.numero_apolice
      } : null,
      error: policyError?.message
    });

    if (policyError) {
      console.error(`❌ [delete-policy-${requestId}] Erro ao buscar apólice:`, policyError);
      return new Response(
        JSON.stringify({ error: 'Policy not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if user owns the policy
    if (policy.user_id !== user.id) {
      console.log(`🚫 [delete-policy-${requestId}] Usuário não autorizado:`, {
        policyUserId: policy.user_id,
        requestUserId: user.id
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only delete your own policies' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    console.log(`✅ [delete-policy-${requestId}] Verificação de propriedade passou - iniciando deleção`);

    // Use the database function to delete the policy completely
    console.log(`🔄 [delete-policy-${requestId}] Chamando função delete_policy_completely...`);
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_policy_completely', { policy_id_param: policyId })

    console.log(`📊 [delete-policy-${requestId}] Resultado da função delete_policy_completely:`, {
      success: !!deleteResult,
      result: deleteResult,
      error: deleteError?.message
    });

    if (deleteError) {
      console.error(`❌ [delete-policy-${requestId}] Erro ao deletar apólice:`, deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete policy from database' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Delete the PDF file from storage if it exists
    if (policy.arquivo_url) {
      console.log(`🗑️ [delete-policy-${requestId}] Deletando arquivo PDF: ${policy.arquivo_url}`);
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([policy.arquivo_url])

      console.log(`📁 [delete-policy-${requestId}] Resultado da deleção do arquivo:`, {
        filePath: policy.arquivo_url,
        success: !storageError,
        error: storageError?.message
      });

      if (storageError) {
        console.error(`⚠️ [delete-policy-${requestId}] Erro ao deletar arquivo PDF (continuando):`, storageError);
        // Don't fail the whole operation if file deletion fails
      } else {
        console.log(`✅ [delete-policy-${requestId}] Arquivo PDF deletado com sucesso`);
      }
    } else {
      console.log(`📄 [delete-policy-${requestId}] Nenhum arquivo PDF para deletar`);
    }

    // Verificar se a apólice foi realmente deletada
    console.log(`🔍 [delete-policy-${requestId}] Verificando se apólice foi deletada do banco...`);
    const { data: checkPolicy, error: checkError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .maybeSingle()

    console.log(`🔍 [delete-policy-${requestId}] Verificação pós-deleção:`, {
      policyStillExists: !!checkPolicy,
      checkError: checkError?.message,
      policyId
    });

    console.log(`✅ [delete-policy-${requestId}] Apólice deletada completamente às ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Policy deleted successfully',
        deletedPolicyId: policyId,
        verification: {
          policyStillExists: !!checkPolicy,
          deletionConfirmed: !checkPolicy
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error(`❌ [delete-policy] Erro inesperado:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
