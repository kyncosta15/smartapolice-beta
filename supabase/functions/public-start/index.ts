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
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Check for active request in last 24h to prevent duplicates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: activeRequests } = await supabase
      .from('requests')
      .select('id, kind')
      .eq('employee_id', 'employees.id')
      .eq('status', 'recebido')
      .gte('created_at', yesterday.toISOString())
      .limit(1);

    // Find or create employee
    let { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('cpf', cleanCPF)
      .single();

    if (employeeError && employeeError.code === 'PGRST116') {
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
          phone: phone,
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
    } else if (employeeError) {
      console.error('Error finding employee:', employeeError);
      return Response.json({
        ok: false,
        error: { code: 'DATABASE_ERROR', message: 'Erro ao buscar colaborador' }
      }, { headers: corsHeaders });
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

    // Get dependents
    const { data: dependents } = await supabase
      .from('dependents')
      .select('*')
      .eq('employee_id', employee.id);

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('public_sessions')
      .insert({
        employee_id: employee.id,
        ip: clientIP,
        user_agent: userAgent
      })
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
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        employee_id: employee.id,
        session_id: session.id,
        protocol_code: `DRAFT-${Date.now()}`, // Temporary code
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