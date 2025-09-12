import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { requestId, note } = body;

    console.log('📥 Processing admin approval for request:', requestId);
    console.log('📄 Request body:', JSON.stringify(body, null, 2));

    if (!requestId) {
      console.error('Missing requestId in request body');
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'MISSING_REQUEST_ID', message: 'Request ID é obrigatório' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching request details for:', requestId);

    // Buscar request completo
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        id,
        protocol_code,
        kind,
        status,
        submitted_at,
        channel,
        metadata,
        updated_at
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('Request not found:', requestError?.message || 'No request data');
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Solicitação não encontrada' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Request found:', request.protocol_code, 'Status:', request.status);
    console.log('Request metadata:', JSON.stringify(request.metadata, null, 2));

    console.log('🔄 Validando status da solicitação:', request.status);
    console.log('✅ Status válidos aceitos: aguardando_aprovacao, aprovado_rh');
    
    if (!['aguardando_aprovacao', 'aprovado_rh'].includes(request.status)) {
      console.error('❌ Invalid status for admin approval. Expected: aguardando_aprovacao or aprovado_rh, Got:', request.status);
      console.error('📊 Full request data:', JSON.stringify(request, null, 2));
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { 
            code: 'INVALID_STATUS', 
            message: `Solicitação deve estar aguardando aprovação ou aprovada pelo RH. Status atual: ${request.status}` 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('✅ Status válido para aprovação admin:', request.status);

    console.log('✅ Status válido para aprovação admin:', request.status);
    console.log('🏭 Processando aprovação admin e criando colaborador/atualizando status');

    // Processar a solicitação baseada no tipo
    if (request.kind === 'inclusao') {
      console.log('📝 Processando inclusão de colaborador...');
      
      // Tentar obter dados do colaborador de várias fontes
      let employeeData = request.metadata?.employee_data;
      
      console.log('🔍 Verificando employee_data no metadata...');
      console.log('📊 Metadata completo:', JSON.stringify(request.metadata, null, 2));
      
      // Se não encontrou no metadata, tentar buscar via rh-requests-detail
      if (!employeeData) {
        console.log('⚠️ Employee data não encontrado no metadata, buscando via rh-requests-detail...');
        
        const { data: requestDetail, error: detailError } = await supabase.functions.invoke('rh-requests-detail', {
          body: { requestId: requestId }
        });
        
        if (!detailError && requestDetail?.ok && requestDetail?.data?.employee) {
          console.log('📋 Dados do colaborador obtidos via rh-requests-detail:', JSON.stringify(requestDetail.data.employee, null, 2));
          
          // Mapear os dados para o formato esperado
          const employee = requestDetail.data.employee;
          employeeData = {
            nome: employee.full_name || 'Nome não informado',
            cpf: employee.cpf || '',
            email: employee.email || '',
            telefone: employee.phone || '',
            data_nascimento: null, // Não disponível neste formato
            cargo: null, // Não disponível neste formato
            centro_custo: null, // Não disponível neste formato
            data_admissao: null // Não disponível neste formato
          };
        }
      }
      
      // Se ainda não temos dados mínimos, criar com dados padrão
      if (!employeeData || (!employeeData.nome || employeeData.nome === 'Nome não informado')) {
        console.log('⚠️ Dados do colaborador incompletos, criando com dados padrão...');
        employeeData = {
          nome: `Colaborador ${request.protocol_code}`,
          cpf: '',
          email: '',
          telefone: '',
          data_nascimento: null,
          cargo: 'A definir',
          centro_custo: 'A definir',
          data_admissao: new Date().toISOString().split('T')[0] // Data atual como admissão
        };
      }
      
      console.log('✅ Employee data final para criação:', JSON.stringify(employeeData, null, 2));

      // Buscar empresa - usar empresa padrão se não encontrar
      let companyId = request.metadata?.company_id;
      console.log('🏢 Procurando empresa com ID:', companyId);
      
      let empresa;
      let empresaError;
      
      if (companyId) {
        const result = await supabase
          .from('empresas')
          .select('id, nome')
          .eq('id', companyId)
          .single();
        
        empresa = result.data;
        empresaError = result.error;
      }

      // Se não encontrou empresa específica, usar primeira empresa disponível
      if (empresaError || !empresa) {
        console.log('⚠️ Empresa específica não encontrada, buscando primeira empresa disponível...');
        
        const { data: defaultEmpresa, error: defaultError } = await supabase
          .from('empresas')
          .select('id, nome')
          .limit(1)
          .single();
          
        if (defaultError || !defaultEmpresa) {
          console.error('❌ Nenhuma empresa encontrada no sistema:', defaultError);
          return new Response(
            JSON.stringify({ 
              ok: false, 
              error: { 
                code: 'NO_COMPANY_FOUND', 
                message: 'Nenhuma empresa encontrada no sistema. Configure empresas antes de aprovar solicitações.' 
              } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        empresa = defaultEmpresa;
        console.log('✅ Usando empresa padrão:', empresa.nome);
      }
      
      console.log('✅ Empresa encontrada:', empresa.nome);

      // Criar colaborador
      console.log('👤 Criando colaborador...');
      console.log('📋 Dados para inserção:', {
        nome: employeeData.nome,
        cpf: employeeData.cpf?.replace(/\D/g, ''),
        email: employeeData.email,
        telefone: employeeData.telefone,
        data_nascimento: employeeData.data_nascimento,
        cargo: employeeData.cargo,
        centro_custo: employeeData.centro_custo,
        data_admissao: employeeData.data_admissao,
        empresa_id: empresa.id,
        status: 'ativo'
      });
      
      const { data: colaborador, error: colaboradorError } = await supabase
        .from('colaboradores')
        .insert({
          nome: employeeData.nome,
          cpf: employeeData.cpf?.replace(/\D/g, ''),
          email: employeeData.email,
          telefone: employeeData.telefone,
          data_nascimento: employeeData.data_nascimento,
          cargo: employeeData.cargo,
          centro_custo: employeeData.centro_custo,
          data_admissao: employeeData.data_admissao,
          empresa_id: empresa.id,
          status: 'ativo'
        })
        .select()
        .single();

      if (colaboradorError) {
        console.error('❌ Erro ao criar colaborador:', colaboradorError);
        console.error('📊 Detalhes do erro:', JSON.stringify(colaboradorError, null, 2));
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao criar colaborador: ' + colaboradorError.message } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('✅ Colaborador criado com sucesso! ID:', colaborador.id);
      console.log('📊 Dados do colaborador criado:', JSON.stringify(colaborador, null, 2));

    } else if (request.kind === 'exclusao') {
      // Processar exclusão de colaborador
      const employeeId = request.metadata?.employee_data?.employee_id;
      
      if (!employeeId) {
        console.error('Employee ID not found for exclusion request');
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'INVALID_DATA', message: 'ID do colaborador não encontrado' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Atualizar status do colaborador
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({
          status: 'inativo',
          data_demissao: request.metadata?.employee_data?.data_desligamento
        })
        .eq('id', employeeId);

      if (updateError) {
        console.error('❌ Erro ao inativar colaborador:', updateError);
        return new Response(
          JSON.stringify({ ok: false, error: { code: 'DATABASE_ERROR', message: 'Erro ao inativar colaborador' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('✅ Colaborador inativado:', employeeId);
    }

    console.log('🔄 Atualizando status da solicitação para aprovado_adm...');

    // Atualizar status para aprovado_adm
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'aprovado_adm',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Erro ao atualizar status da request:', updateError);
      console.error('📊 Detalhes do erro:', JSON.stringify(updateError, null, 2));
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'UPDATE_ERROR', message: 'Erro ao aprovar solicitação' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Status da solicitação atualizado com sucesso!');
    console.log('🎫 Preparando criação de ticket...');

    // Criar snapshot simplificado do request para o ticket
    const employeeData = request.metadata?.employee_data;
    const snapshot = {
      request_id: request.id,
      protocol_code: request.protocol_code,
      employee_data: employeeData,
      kind: request.kind,
      channel: request.channel,
      submitted_at: request.submitted_at,
      approved_at: new Date().toISOString(),
      metadata: request.metadata
    };

    console.log('Checking if ticket already exists for request:', requestId);
    
    // Check if ticket already exists for this request
    const { data: existingTicket, error: checkError } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('request_id', requestId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing ticket:', checkError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { code: 'TICKET_CHECK_FAILED', message: 'Falha ao verificar tickets existentes' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingTicket) {
      console.log('Ticket already exists:', existingTicket.id, 'Status:', existingTicket.status);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Ticket já existe para esta solicitação',
          data: { 
            ticketId: existingTicket.id,
            protocolCode: request.protocol_code,
            externalRef: null,
            existed: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎫 Criando ticket para protocolo:', request.protocol_code);

    // Criar ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([{
        request_id: requestId,
        protocol_code: request.protocol_code,
        status: 'aberto',
        payload: snapshot
      }])
      .select()
      .single();

    if (ticketError) {
      console.error('❌ Erro ao criar ticket:', ticketError);
      console.error('📊 Detalhes do erro:', JSON.stringify(ticketError, null, 2));
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'TICKET_ERROR', message: 'Erro ao criar ticket' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Ticket criado com sucesso! ID:', ticket.id);
    console.log('📋 Criando trilha de aprovação...');

    // Criar trilha de aprovação
    const { error: approvalError } = await supabase
      .from('request_approvals')
      .insert([{
        request_id: requestId,
        role: 'adm',
        decision: 'aprovado',
        note: note || null,
        decided_at: new Date().toISOString()
      }]);

    if (approvalError) {
      console.error('Erro ao criar aprovação:', approvalError);
    }

    // Tentar disparar webhook se configurado
    const webhookUrl = Deno.env.get('TICKETS_WEBHOOK_URL');
    if (webhookUrl) {
      try {
        const webhookPayload = {
          event: 'request.approved_by_admin',
          protocol_code: request.protocol_code,
          request_id: requestId,
          ticket_id: ticket.id,
          snapshot
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('BACKEND_WRITE_TOKEN') || ''}`
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json();
          
          // Se webhook retornou referência externa, atualizar ticket
          if (webhookResult.external_ref) {
            await supabase
              .from('tickets')
              .update({ external_ref: webhookResult.external_ref })
              .eq('id', ticket.id);
          }
        } else {
          console.warn('Webhook falhou:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Erro no webhook:', webhookError);
      }
    }

    console.log('🎉 Processo de aprovação completado com sucesso!');
    console.log('📊 Retornando resposta final...');
    
    return new Response(
      JSON.stringify({ 
        ok: true,
        message: 'Solicitação aprovada e ticket criado com sucesso!',
        data: {
          ticketId: ticket.id,
          protocolCode: request.protocol_code,
          externalRef: ticket.external_ref || null,
          requestStatus: 'aprovado_adm'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro crítico na função:', error);
    console.error('📊 Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Erro interno do servidor' 
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});