import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestBodySchema = z.object({
  kind: z.enum(['inclusao', 'exclusao']),
  employee_data: z.record(z.unknown()),
  observacoes: z.string().max(2000).optional().nullable(),
});
type RequestBody = z.infer<typeof RequestBodySchema>;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Token de autorização necessário' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Validar token
    const { data: { user }, error: authError } = await (supabase.auth as any).getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Token inválido' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Processar requisição
    const { kind, employee_data, observacoes }: RequestBody = await req.json();

    console.log('📝 Criando solicitação RH:', { kind, employee_data, user_id: user.id });

    // Validar dados obrigatórios
    if (!kind || !employee_data) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'INVALID_REQUEST', message: 'Campos obrigatórios: kind, employee_data' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar perfil do usuário para obter a empresa
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.company) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa do usuário não encontrada' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verificar permissões
    if (!['rh', 'admin', 'administrador', 'gestor_rh'].includes(userProfile.role)) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'FORBIDDEN', message: 'Usuário sem permissão para criar solicitações' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Buscar empresa no banco
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('nome', userProfile.company)
      .single();

    if (empresaError || !empresa) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa não encontrada no sistema' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Gerar protocolo único
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const protocolCode = `SB-${year}-${sequence}`;

    // Preparar metadata
    const metadata = {
      employee_data,
      observacoes,
      company_id: empresa.id,
      created_by: user.id,
      user_company: userProfile.company
    };

    // Criar solicitação
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        protocol_code: protocolCode,
        kind,
        status: 'aguardando_aprovacao',
        submitted_at: new Date().toISOString(),
        draft: false,
        channel: 'rh_portal',
        metadata
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Erro ao criar solicitação:', requestError);
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao criar solicitação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Solicitação criada:', request);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          request_id: request.id,
          protocol_code: protocolCode,
          status: 'aguardando_aprovacao',
          kind,
          submitted_at: request.submitted_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro na edge function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});