import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// CPF validation function
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleanCPF.substring(10, 11));
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
    const clientIP = forwardedFor.split(',')[0].trim() || null;
    const userAgent = req.headers.get('user-agent') || '';

    // Note: We'll check for duplicates after finding/creating the employee

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
    // Only consider 'recebido' and 'em_validacao' as active statuses
    // 'concluido' and 'recusado' should allow new requests
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

    // Create session
    const sessionData: any = {
      employee_id: employee.id,
      user_agent: userAgent
    };
    
    // Only add IP if it's valid
    if (clientIP) {
      sessionData.ip = clientIP;
    }

    const { data: session, error: sessionError } = await supabase
      .from('public_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao criar sessão' }
      }, { headers: corsHeaders });
    }

    // Create draft request  
    const protocolCode = `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        employee_id: employee.id,
        session_id: session.id,
        protocol_code: protocolCode,
        kind: 'inclusao', // Default, will be updated
        channel: 'form',
        draft: true,
        metadata: { sessionId: session.id }
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
        sessionId: session.id,
        requestId: request.id,
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