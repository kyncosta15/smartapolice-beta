import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { submissaoId, acao } = await req.json();

    if (!submissaoId || !acao) {
      return new Response(
        JSON.stringify({ error: 'submissaoId e acao são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar dados da submissão
    const { data: submissao, error: submissaoError } = await supabase
      .from('colaborador_submissoes')
      .select(`
        *,
        colaborador_links (
          titulo,
          empresa_id,
          campos_solicitados
        )
      `)
      .eq('id', submissaoId)
      .single();

    if (submissaoError) {
      console.error('Erro ao buscar submissão:', submissaoError);
      return new Response(
        JSON.stringify({ error: 'Submissão não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let resultado = {};

    switch (acao) {
      case 'processar':
        // Criar ou atualizar colaborador com os dados da submissão
        const dadosColaborador = submissao.dados_preenchidos;
        
        // Verificar se já existe um colaborador com o CPF
        const { data: colaboradorExistente } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('cpf', dadosColaborador.cpf)
          .eq('empresa_id', submissao.colaborador_links.empresa_id)
          .single();

        if (colaboradorExistente) {
          // Atualizar colaborador existente
          const { data: colaboradorAtualizado, error: updateError } = await supabase
            .from('colaboradores')
            .update({
              nome: dadosColaborador.nome || null,
              email: dadosColaborador.email || null,
              telefone: dadosColaborador.telefone || null,
              data_nascimento: dadosColaborador.data_nascimento || null,
              cargo: dadosColaborador.cargo || null,
              centro_custo: dadosColaborador.centro_custo || null,
              data_admissao: dadosColaborador.data_admissao || null,
              observacoes: dadosColaborador.observacoes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', colaboradorExistente.id)
            .select()
            .single();

          if (updateError) {
            console.error('Erro ao atualizar colaborador:', updateError);
            throw new Error('Erro ao atualizar colaborador');
          }

          resultado = { tipo: 'atualizado', colaborador: colaboradorAtualizado };
        } else {
          // Criar novo colaborador
          const { data: novoColaborador, error: insertError } = await supabase
            .from('colaboradores')
            .insert([{
              empresa_id: submissao.colaborador_links.empresa_id,
              nome: dadosColaborador.nome,
              cpf: dadosColaborador.cpf,
              email: dadosColaborador.email || null,
              telefone: dadosColaborador.telefone || null,
              data_nascimento: dadosColaborador.data_nascimento || null,
              cargo: dadosColaborador.cargo || null,
              centro_custo: dadosColaborador.centro_custo || null,
              data_admissao: dadosColaborador.data_admissao || null,
              observacoes: dadosColaborador.observacoes || null,
              status: 'ativo'
            }])
            .select()
            .single();

          if (insertError) {
            console.error('Erro ao criar colaborador:', insertError);
            throw new Error('Erro ao criar colaborador');
          }

          resultado = { tipo: 'criado', colaborador: novoColaborador };
        }

        // Atualizar status da submissão para processada
        await supabase
          .from('colaborador_submissoes')
          .update({ 
            status: 'processada',
            observacoes: `Processado automaticamente em ${new Date().toISOString()}`
          })
          .eq('id', submissaoId);

        break;

      case 'rejeitar':
        // Atualizar status para rejeitada
        await supabase
          .from('colaborador_submissoes')
          .update({ 
            status: 'rejeitada',
            observacoes: `Rejeitado em ${new Date().toISOString()}`
          })
          .eq('id', submissaoId);

        resultado = { tipo: 'rejeitado' };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida. Use "processar" ou "rejeitar"' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        submissao: submissao,
        resultado: resultado
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});