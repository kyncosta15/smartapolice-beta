import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas administradores podem deletar usuários' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Não permitir auto-exclusão
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode deletar sua própria conta' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Deletando usuário: ${user_id}`);

    // Deletar memberships do usuário
    const { error: membershipsError } = await supabaseClient
      .from('user_memberships')
      .delete()
      .eq('user_id', user_id);
    if (membershipsError) console.error('Erro ao deletar memberships:', membershipsError);

    // Deletar user_profiles
    const { error: profilesError } = await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', user_id);
    if (profilesError) console.error('Erro ao deletar profiles:', profilesError);

    // Deletar da tabela users
    const { error: usersError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', user_id);
    if (usersError) console.error('Erro ao deletar da tabela users:', usersError);

    // Deletar do auth.users usando admin API
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user_id);
    
    if (authDeleteError) {
      console.error('Erro ao deletar do auth:', authDeleteError);
      throw authDeleteError;
    }

    console.log(`Usuário ${user_id} deletado com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário deletado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
