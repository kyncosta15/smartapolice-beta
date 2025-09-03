// Edge function para gerar links de solicitação
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateLinkRequest {
  employeeCpf: string;
  validityDays?: number;
}

// Função para gerar JWT simples
async function generateJWT(employeeId: string, validityDays = 7): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (validityDays * 24 * 60 * 60);
  
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ employeeId, exp, iat: now }));
  
  // Para simplificação, usar uma assinatura mock (em produção usar crypto real)
  const signature = btoa(`${header}.${payload}.mock_signature`);
  
  return `${header}.${payload}.${signature}`;
}

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

    const { employeeCpf, validityDays = 7 }: GenerateLinkRequest = await req.json();

    // Buscar colaborador pelo CPF
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('*')
      .eq('cpf', employeeCpf)
      .single();

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Colaborador não encontrado com este CPF'
          }
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gerar JWT
    const token = await generateJWT(employee.id, validityDays);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Salvar token no banco
    const { error: tokenError } = await supabaseClient
      .from('public_request_tokens')
      .insert({
        employee_id: employee.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Erro ao salvar token:', tokenError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erro ao salvar token'
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const baseUrl = req.headers.get('origin') || 'https://localhost:3000';
    const link = `${baseUrl}/solicitacao?token=${token}`;
    const whatsappMessage = `Olá, ${employee.full_name}! Para incluir/excluir beneficiários do seu plano, acesse este link seguro: ${link}. O formulário é simples e você pode retomar de onde parou. Ao final, você receberá seu protocolo.`;

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          link,
          whatsappMessage,
          expiresAt: expiresAt.toISOString()
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro na função generate-link:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Erro interno do servidor'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});