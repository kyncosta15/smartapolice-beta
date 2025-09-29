import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// CPF validation function - DISABLED
function validateCPF(cpf: string): boolean {
  // Aceitar qualquer CPF - validação desabilitada
  return true;
}

// Rate limiting function
async function checkRateLimit(ip: string, cpf: string): Promise<{ allowed: boolean; message?: string }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Check existing rate limit record
  const { data: rateLimit } = await supabase
    .from('submission_rate_limits')
    .select('*')
    .eq('ip_address', ip)
    .eq('employee_cpf', cpf)
    .single();

  if (rateLimit) {
    // Check if blocked
    if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > now) {
      return {
        allowed: false,
        message: `Muitas tentativas. Tente novamente em ${Math.ceil((new Date(rateLimit.blocked_until).getTime() - now.getTime()) / (1000 * 60))} minutos.`
      };
    }

    // Check if within rate limit (max 5 attempts per hour)
    if (new Date(rateLimit.first_attempt_at) > oneHourAgo && rateLimit.submission_count >= 5) {
      const blockUntil = new Date(now.getTime() + 30 * 60 * 1000); // Block for 30 minutes
      
      await supabase
        .from('submission_rate_limits')
        .update({
          submission_count: rateLimit.submission_count + 1,
          last_attempt_at: now.toISOString(),
          blocked_until: blockUntil.toISOString()
        })
        .eq('id', rateLimit.id);

      return {
        allowed: false,
        message: 'Muitas tentativas. Conta temporariamente bloqueada por 30 minutos.'
      };
    }

    // Update existing record
    const isNewHour = new Date(rateLimit.first_attempt_at) <= oneHourAgo;
    await supabase
      .from('submission_rate_limits')
      .update({
        submission_count: isNewHour ? 1 : rateLimit.submission_count + 1,
        first_attempt_at: isNewHour ? now.toISOString() : rateLimit.first_attempt_at,
        last_attempt_at: now.toISOString(),
        blocked_until: null
      })
      .eq('id', rateLimit.id);
  } else {
    // Create new rate limit record
    await supabase
      .from('submission_rate_limits')
      .insert({
        ip_address: ip,
        employee_cpf: cpf,
        submission_count: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString()
      });
  }

  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf, fullName, phone } = await req.json();

    // Validate input
    if (!cpf || !fullName) {
      return Response.json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'CPF e nome completo são obrigatórios' }
      }, { headers: corsHeaders });
    }

    // Validate CPF
    if (!validateCPF(cpf)) {
      return Response.json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'CPF inválido' }
      }, { headers: corsHeaders });
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Extract first IP from comma-separated list for INET type compatibility
    const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const clientIP = forwardedFor.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(clientIP, cleanCPF);
    if (!rateLimitResult.allowed) {
      return Response.json({
        ok: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: rateLimitResult.message }
      }, { headers: corsHeaders });
    }

    // Find or create employee
    let { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('cpf', cleanCPF)
      .maybeSingle();

    if (employeeError) {
      console.error('Error finding employee:', employeeError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao buscar colaborador' }
      }, { headers: corsHeaders });
    }

    if (!employee) {
      // Employee not found, create new one
      // First find a default company (we'll use the first one)
      const { data: companies } = await supabase
        .from('empresas')
        .select('id')
        .limit(1);

      if (!companies || companies.length === 0) {
        return Response.json({
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Nenhuma empresa cadastrada no sistema' }
        }, { headers: corsHeaders });
      }

      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert({
          cpf: cleanCPF,
          full_name: fullName,
          phone: phone || null,
          company_id: companies[0].id,
          status: 'ativo'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating employee:', createError);
        return Response.json({
          ok: false,
          error: { code: 'DATABASE_ERROR', message: 'Erro ao criar colaborador' }
        }, { headers: corsHeaders });
      }

      employee = newEmployee;
    } else {
      // Update employee name/phone if provided
      const updateData: any = {};
      if (employee.full_name !== fullName) updateData.full_name = fullName;
      if (phone && employee.phone !== phone) updateData.phone = phone;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('employees')
          .update(updateData)
          .eq('id', employee.id);
      }
    }

    // Check for active request in last 24h to prevent duplicates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: activeRequests } = await supabase
      .from('requests')
      .select('id, status, protocol_code')
      .eq('employee_id', employee.id)
      .eq('draft', false)  // Only non-draft requests
      .in('status', ['recebido', 'em_validacao'])
      .gte('created_at', yesterday.toISOString())
      .limit(1);

    if (activeRequests && activeRequests.length > 0) {
      const activeRequest = activeRequests[0];
      return Response.json({
        ok: false,
        error: { 
          code: 'DUPLICATE_REQUEST', 
          message: `Já existe uma solicitação ativa (${activeRequest.protocol_code}) com status "${activeRequest.status}". Aguarde o processamento antes de criar uma nova solicitação.` 
        }
      }, { headers: corsHeaders });
    }

    // Get dependents
    const { data: dependents } = await supabase
      .from('dependents')
      .select('*')
      .eq('employee_id', employee.id);

    // Generate secure session token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_session_token', {
        p_employee_id: employee.id,
        p_ip_address: clientIP,
        p_user_agent: userAgent
      });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error('Error generating token:', tokenError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao criar sessão segura' }
      }, { headers: corsHeaders });
    }

    const { token, session_id, expires_at } = tokenData[0];

    // Create draft request  
    const protocolCode = `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        employee_id: employee.id,
        session_id: session_id,
        protocol_code: protocolCode,
        kind: 'inclusao', // Default, will be updated
        channel: 'form',
        draft: true,
        metadata: { sessionId: session_id, token: token }
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating request:', requestError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao criar solicitação' }
      }, { headers: corsHeaders });
    }

    return Response.json({
      ok: true,
      data: {
        sessionId: session_id,
        requestId: request.id,
        token: token,
        expiresAt: expires_at,
        employee: {
          id: employee.id,
          fullName: employee.full_name
        },
        dependents: dependents || []
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in public-start:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
    }, { headers: corsHeaders });
  }
});