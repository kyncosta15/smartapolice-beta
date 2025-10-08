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
        JSON.stringify({ error: 'Acesso negado: apenas administradores podem deletar empresas' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { company_ids } = await req.json();

    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'IDs de empresas inválidos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Deletando ${company_ids.length} empresas:`, company_ids);

    // Deletar dados relacionados em cascata
    const deletionSteps = [];

    // 1. Deletar documentos de frotas
    const { error: docError } = await supabaseClient
      .from('frota_documentos')
      .delete()
      .in('veiculo_id', 
        supabaseClient
          .from('frota_veiculos')
          .select('id')
          .in('empresa_id', company_ids)
      );
    if (docError) console.error('Erro ao deletar documentos:', docError);
    deletionSteps.push('frota_documentos');

    // 2. Deletar veículos
    const { error: veiculosError } = await supabaseClient
      .from('frota_veiculos')
      .delete()
      .in('empresa_id', company_ids);
    if (veiculosError) console.error('Erro ao deletar veículos:', veiculosError);
    deletionSteps.push('frota_veiculos');

    // 3. Deletar colaboradores e dependentes
    const { error: dependentesError } = await supabaseClient
      .from('dependentes')
      .delete()
      .in('colaborador_id',
        supabaseClient
          .from('colaboradores')
          .select('id')
          .in('empresa_id', company_ids)
      );
    if (dependentesError) console.error('Erro ao deletar dependentes:', dependentesError);

    const { error: colaboradoresError } = await supabaseClient
      .from('colaboradores')
      .delete()
      .in('empresa_id', company_ids);
    if (colaboradoresError) console.error('Erro ao deletar colaboradores:', colaboradoresError);
    deletionSteps.push('colaboradores');

    // 4. Deletar apólices de benefícios
    const { error: apolicesError } = await supabaseClient
      .from('apolices_beneficios')
      .delete()
      .in('empresa_id', company_ids);
    if (apolicesError) console.error('Erro ao deletar apólices:', apolicesError);
    deletionSteps.push('apolices_beneficios');

    // 5. Deletar tickets
    const { error: ticketsError } = await supabaseClient
      .from('tickets')
      .delete()
      .in('empresa_id', company_ids);
    if (ticketsError) console.error('Erro ao deletar tickets:', ticketsError);
    deletionSteps.push('tickets');

    // 6. Deletar requests
    const { error: requestsError } = await supabaseClient
      .from('insurance_approval_requests')
      .delete()
      .in('empresa_id', company_ids);
    if (requestsError) console.error('Erro ao deletar requests:', requestsError);

    // 7. Deletar memberships
    const { error: membershipsError } = await supabaseClient
      .from('user_memberships')
      .delete()
      .in('empresa_id', company_ids);
    if (membershipsError) console.error('Erro ao deletar memberships:', membershipsError);
    deletionSteps.push('user_memberships');

    // 8. Deletar empresas
    const { error: empresasError } = await supabaseClient
      .from('empresas')
      .delete()
      .in('id', company_ids);

    if (empresasError) {
      throw empresasError;
    }

    deletionSteps.push('empresas');

    console.log(`Empresas deletadas com sucesso. Steps: ${deletionSteps.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${company_ids.length} empresa(s) deletada(s) com sucesso`,
        deleted_count: company_ids.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao deletar empresas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
