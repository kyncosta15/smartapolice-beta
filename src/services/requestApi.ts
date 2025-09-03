// Serviços API para o sistema de solicitações

import { supabase } from '@/integrations/supabase/client';
import { generateJWT, validateJWT } from '@/lib/jwt';
import { generateProtocolCode } from '@/utils/protocolGenerator';
import type {
  ApiResponse,
  GenerateLinkRequest,
  ValidateTokenRequest,
  SaveDraftRequest,
  SubmitRequestRequest,
  GeneratedLink,
  TokenValidationData,
  Employee,
  Dependent,
  Request
} from '@/types/request';

const API_BASE_URL = window.location.origin;

// Gera link público para colaborador
export async function generateLink(data: GenerateLinkRequest): Promise<ApiResponse<GeneratedLink>> {
  try {
    // Busca colaborador pelo CPF
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('cpf', data.employeeCpf)
      .single();

    if (employeeError || !employee) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Colaborador não encontrado com este CPF'
        }
      };
    }

    // Gera JWT
    const token = await generateJWT(employee.id, data.validityDays || 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.validityDays || 7));

    // Salva token no banco
    const { error: tokenError } = await supabase
      .from('public_request_tokens')
      .insert({
        employee_id: employee.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erro ao salvar token'
        }
      };
    }

    const link = `${API_BASE_URL}/solicitacao?token=${token}`;
    const whatsappMessage = `Olá, ${employee.full_name}! Para incluir/excluir beneficiários do seu plano, acesse este link seguro: ${link}. O formulário é simples e você pode retomar de onde parou. Ao final, você receberá seu protocolo.`;

    return {
      ok: true,
      data: {
        link,
        whatsappMessage,
        expiresAt: expiresAt.toISOString()
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Erro interno do servidor'
      }
    };
  }
}

// Valida token e retorna dados do colaborador
export async function validateToken(data: ValidateTokenRequest): Promise<ApiResponse<TokenValidationData>> {
  try {
    // Valida JWT
    const payload = await validateJWT(data.token);
    if (!payload) {
      return {
        ok: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token inválido ou expirado'
        }
      };
    }

    // Verifica se token existe no banco e não foi usado
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('public_request_tokens')
      .select('*')
      .eq('token', data.token)
      .eq('employee_id', payload.employeeId)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenRecord) {
      return {
        ok: false,
        error: {
          code: 'TOKEN_USED',
          message: 'Token já foi utilizado ou não encontrado'
        }
      };
    }

    // Busca dados do colaborador
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', payload.employeeId)
      .single();

    if (employeeError || !employee) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Colaborador não encontrado'
        }
      };
    }

    // Busca dependentes
    const { data: dependents, error: dependentsError } = await supabase
      .from('dependents')
      .select('*')
      .eq('employee_id', payload.employeeId);

    if (dependentsError) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erro ao carregar dependentes'
        }
      };
    }

    // Verifica se há solicitação em rascunho
    const { data: activeRequest } = await supabase
      .from('requests')
      .select('*')
      .eq('employee_id', payload.employeeId)
      .eq('draft', true)
      .single();

    return {
      ok: true,
      data: {
        employee: {
          id: employee.id,
          companyId: employee.company_id,
          cpf: employee.cpf,
          fullName: employee.full_name,
          email: employee.email,
          phone: employee.phone,
          status: employee.status as 'ativo' | 'inativo' | 'pendente',
          createdAt: employee.created_at
        },
        dependents: dependents.map(d => ({
          id: d.id,
          employeeId: d.employee_id,
          fullName: d.full_name,
          cpf: d.cpf,
          birthDate: d.birth_date,
          relationship: (d.relationship as 'conjuge' | 'filho' | 'outro') || 'outro',
          createdAt: d.created_at
        })),
        hasActiveRequest: !!activeRequest,
        activeRequest: activeRequest ? {
          id: activeRequest.id,
          protocolCode: activeRequest.protocol_code || '',
          employeeId: activeRequest.employee_id,
          kind: activeRequest.kind as 'inclusao' | 'exclusao',
          status: activeRequest.status as 'recebido' | 'em_validacao' | 'concluido' | 'recusado',
          submittedAt: activeRequest.submitted_at,
          draft: activeRequest.draft,
          channel: activeRequest.channel as 'whatsapp' | 'form',
          metadata: activeRequest.metadata as Record<string, any>,
          createdAt: activeRequest.created_at,
          updatedAt: activeRequest.updated_at
        } : undefined
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Erro interno do servidor'
      }
    };
  }
}

// Salva rascunho da solicitação
export async function saveDraft(data: SaveDraftRequest): Promise<ApiResponse<{ requestId: string }>> {
  try {
    // Valida token
    const payload = await validateJWT(data.token);
    if (!payload) {
      return {
        ok: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token inválido'
        }
      };
    }

    // Busca ou cria request
    let { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('employee_id', payload.employeeId)
      .eq('draft', true)
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erro ao buscar solicitação'
        }
      };
    }

    if (!request) {
      // Cria nova request
      const { data: newRequest, error: createError } = await supabase
        .from('requests')
        .insert({
          employee_id: payload.employeeId,
          kind: data.request.kind,
          status: 'recebido',
          draft: true,
          channel: 'form',
          metadata: { notes: data.request.notes },
          protocol_code: '' // Será preenchido no submit
        })
        .select()
        .single();

      if (createError || !newRequest) {
        return {
          ok: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erro ao criar solicitação'
          }
        };
      }
      request = newRequest;
    } else {
      // Atualiza request existente
      const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update({
          kind: data.request.kind,
          metadata: { notes: data.request.notes },
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)
        .select()
        .single();

      if (updateError || !updatedRequest) {
        return {
          ok: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erro ao atualizar solicitação'
          }
        };
      }
      request = updatedRequest;
    }

    // Remove itens antigos
    await supabase
      .from('request_items')
      .delete()
      .eq('request_id', request.id);

    // Adiciona novos itens
    if (data.request.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(
          data.request.items.map(item => ({
            request_id: request.id,
            target: item.target,
            dependent_id: item.dependentId,
            action: item.action,
            notes: item.notes
          }))
        );

      if (itemsError) {
        return {
          ok: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erro ao salvar itens da solicitação'
          }
        };
      }
    }

    return {
      ok: true,
      data: {
        requestId: request.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Erro interno do servidor'
      }
    };
  }
}

// Submete solicitação final
export async function submitRequest(data: SubmitRequestRequest): Promise<ApiResponse<{ protocolCode: string }>> {
  try {
    // Valida token
    const payload = await validateJWT(data.token);
    if (!payload) {
      return {
        ok: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token inválido'
        }
      };
    }

    // Gera protocol code
    const protocolCode = generateProtocolCode();

    // Atualiza request
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        protocol_code: protocolCode,
        draft: false,
        submitted_at: new Date().toISOString(),
        status: 'recebido'
      })
      .eq('id', data.requestId)
      .eq('employee_id', payload.employeeId);

    if (updateError) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erro ao finalizar solicitação'
        }
      };
    }

    // Marca token como usado
    await supabase
      .from('public_request_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', data.token);

    return {
      ok: true,
      data: {
        protocolCode
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Erro interno do servidor'
      }
    };
  }
}