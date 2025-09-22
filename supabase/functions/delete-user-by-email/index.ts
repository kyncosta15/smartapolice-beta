import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro, deletar da tabela users do public schema
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', email);

    if (deleteUserError) {
      console.error('Erro ao deletar usuário da tabela users:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Erro ao deletar usuário', details: deleteUserError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar deletar também da tabela auth.users se existir
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers.users?.find(user => user.email === email);
    
    if (authUser) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      if (deleteAuthError) {
        console.error('Erro ao deletar usuário da auth:', deleteAuthError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Usuário ${email} deletado com sucesso` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});