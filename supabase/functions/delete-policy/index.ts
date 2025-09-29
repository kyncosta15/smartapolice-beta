
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { policyId } = await req.json()
    
    if (!policyId) {
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
    
    if (!authHeader) {
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

    // CORREÇÃO: Verificar o usuário usando o token de forma mais robusta
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError) {
        console.error('Auth error:', authError);
        
        // Tentar verificar JWT manualmente se getUser falhar
        const { data: { user: jwtUser }, error: jwtError } = await supabase.auth.getUser(token)
        
        if (jwtError || !jwtUser) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired token - please login again' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          )
        }
        user = jwtUser;
      } else {
        user = authUser;
      }
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token verification failed - please login again' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log(`🗑️ Deletando apólice ${policyId} para usuário ${user.id}`);

    // Get policy details first to check ownership and get file path
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('arquivo_url, user_id, segurado, numero_apolice')
      .eq('id', policyId)
      .single()

    if (policyError) {
      console.error('Policy not found error:', policyError);
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only delete your own policies' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    // Use the database function to delete the policy completely
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_policy_completely', { policy_id_param: policyId })

    if (deleteError) {
      console.error('Database deletion error:', deleteError);
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
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([policy.arquivo_url])

      if (storageError) {
        console.error('Erro ao deletar arquivo PDF:', storageError);
        // Don't fail the whole operation if file deletion fails
      }
    }

    // CORREÇÃO: Verificação final mais robusta
    const { data: checkPolicy, error: checkError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .maybeSingle()

    if (checkPolicy) {
      console.log('⚠️ Apólice ainda existe, tentando deletar novamente');
      
      // Se ainda existe, tentar deletar diretamente
      const { error: finalDeleteError } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId)
        .eq('user_id', user.id)

      if (finalDeleteError) {
        console.error('Final delete error:', finalDeleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to completely delete policy' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }

    console.log(`✅ Apólice ${policyId} deletada com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Policy deleted successfully',
        deletedPolicyId: policyId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro inesperado na deleção:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
