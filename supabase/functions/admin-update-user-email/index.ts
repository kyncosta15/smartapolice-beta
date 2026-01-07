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
        JSON.stringify({ error: 'Acesso negado: apenas administradores podem alterar emails' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { user_id, new_email } = await req.json();

    if (!user_id || !new_email) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário e novo email são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Atualizando email do usuário ${user_id} para ${new_email}`);

    // Atualizar email no auth.users usando admin API
    const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user_id,
      { email: new_email, email_confirm: true }
    );
    
    if (updateError) {
      console.error('Erro ao atualizar email no auth:', updateError);
      throw updateError;
    }

    console.log(`Email do usuário ${user_id} atualizado com sucesso para ${new_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email atualizado com sucesso',
        user: updatedUser.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao atualizar email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
