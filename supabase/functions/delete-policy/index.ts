
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
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

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Get policy details first to check ownership and get file path
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('arquivo_url, user_id, segurado, numero_apolice')
      .eq('id', policyId)
      .single()

    if (policyError) {
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

    // CORREÇÃO: Verificar se a apólice foi realmente deletada
    const { data: checkPolicy, error: checkError } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policyId)
      .maybeSingle()

    if (checkPolicy) {
      // Se ainda existe, tentar deletar novamente
      const { error: finalDeleteError } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId)
        .eq('user_id', user.id)

      if (finalDeleteError) {
        return new Response(
          JSON.stringify({ error: 'Failed to completely delete policy' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }

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
    console.error('Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
