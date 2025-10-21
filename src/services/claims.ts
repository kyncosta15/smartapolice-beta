// Services para gerenciamento de sinistros

import { supabase } from '@/integrations/supabase/client';
import { Claim, ClaimEvent, Vehicle, Policy, Assistance, ClaimEventType, AssistanceType } from '@/types/claims';

export class ClaimsService {
  static async getClaims(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 50 } = params;
    
    try {
      // Get empresa_id from user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_empresa_id')
        .eq('id', user.id)
        .single();
      
      const empresaId = profile?.default_empresa_id;
      if (!empresaId) throw new Error('Empresa não encontrada');
      
      let query = supabase
        .from('tickets')
        .select(`
          id,
          protocol_code,
          tipo,
          subtipo,
          status,
          data_evento,
          valor_estimado,
          localizacao,
          created_at,
          updated_at,
          vehicle:frota_veiculos!tickets_vehicle_id_fkey (
            id,
            placa,
            marca,
            modelo,
            proprietario_nome
          )
        `)
        .eq('tipo', 'sinistro')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Aplicar filtros
      if (search) {
        query = query.or(
          `protocol_code.ilike.%${search}%,vehicle.placa.ilike.%${search}%,vehicle.proprietario_nome.ilike.%${search}%`
        );
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const claims: Claim[] = (data || []).map(ticket => {
        // Map database status to ClaimStatus type
        const mappedStatus = ticket.status === 'em_analise' ? 'em_regulacao' : ticket.status;
        
        return {
          id: ticket.id,
          ticket: ticket.protocol_code || `SIN-${ticket.id.slice(0, 8)}`,
          veiculo: ticket.vehicle ? {
            id: ticket.vehicle.id,
            placa: ticket.vehicle.placa,
            marca: ticket.vehicle.marca || undefined,
            modelo: ticket.vehicle.modelo || undefined,
            proprietario_nome: ticket.vehicle.proprietario_nome || undefined
          } : {
            id: '',
            placa: 'N/A'
          },
          status: mappedStatus as 'aberto' | 'em_regulacao' | 'finalizado',
          valor_estimado: ticket.valor_estimado ? Number(ticket.valor_estimado) : undefined,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at
        };
      });

      return {
        data: claims,
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar sinistros:', error);
      return { data: [], total: 0 };
    }
  }

  static async createClaim(claimData: Partial<Claim> & { empresa_id?: string }) {
    try {
      // Obter empresa_id se não fornecido
      let empresaId = claimData.empresa_id;
      if (!empresaId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('default_empresa_id')
          .eq('id', user.id)
          .single();
        
        const { data: membership } = await supabase
          .from('user_memberships')
          .select('empresa_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        empresaId = profile?.default_empresa_id || membership?.empresa_id;
        
        if (!empresaId) {
          throw new Error('Empresa não encontrada para o usuário');
        }
      }
      
      // Preparar payload do ticket
      const ticketPayload = {
        tipo: 'sinistro' as 'sinistro' | 'assistencia',
        vehicle_id: claimData.veiculo?.id,
        status: 'aberto',
        valor_estimado: claimData.valor_estimado,
        origem: 'portal' as 'portal' | 'importacao' | 'api',
        empresa_id: empresaId,
        payload: {}
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketPayload])
        .select(`
          id,
          protocol_code,
          tipo,
          subtipo,
          status,
          data_evento,
          valor_estimado,
          localizacao,
          created_at,
          updated_at,
          vehicle:frota_veiculos!tickets_vehicle_id_fkey (
            id,
            placa,
            marca,
            modelo,
            proprietario_nome
          )
        `)
        .single();

      if (error) throw error;

      // Criar movimento inicial
      await this.addClaimEvent({
        claim_id: ticket.id,
        tipo: 'abertura',
        descricao: 'Sinistro aberto',
        responsavel: 'Sistema'
      });

      const mappedStatus = ticket.status === 'em_analise' ? 'em_regulacao' : ticket.status;
      
      return {
        id: ticket.id,
        ticket: ticket.protocol_code || `SIN-${ticket.id.slice(0, 8)}`,
        veiculo: ticket.vehicle ? {
          id: ticket.vehicle.id,
          placa: ticket.vehicle.placa,
          marca: ticket.vehicle.marca || undefined,
          modelo: ticket.vehicle.modelo || undefined,
          proprietario_nome: ticket.vehicle.proprietario_nome || undefined
        } : claimData.veiculo!,
        status: mappedStatus as 'aberto' | 'em_regulacao' | 'finalizado',
        valor_estimado: ticket.valor_estimado ? Number(ticket.valor_estimado) : undefined,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      } as Claim;
    } catch (error) {
      console.error('Erro ao criar sinistro:', error);
      throw error;
    }
  }

  static async getClaimById(id: string) {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          id,
          protocol_code,
          tipo,
          subtipo,
          status,
          data_evento,
          valor_estimado,
          localizacao,
          created_at,
          updated_at,
          vehicle:frota_veiculos!tickets_vehicle_id_fkey (
            id,
            placa,
            marca,
            modelo,
            proprietario_nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!ticket) throw new Error('Sinistro não encontrado');

      const mappedStatus = ticket.status === 'em_analise' ? 'em_regulacao' : ticket.status;
      
      return {
        id: ticket.id,
        ticket: ticket.protocol_code || `SIN-${ticket.id.slice(0, 8)}`,
        veiculo: ticket.vehicle ? {
          id: ticket.vehicle.id,
          placa: ticket.vehicle.placa,
          marca: ticket.vehicle.marca || undefined,
          modelo: ticket.vehicle.modelo || undefined,
          proprietario_nome: ticket.vehicle.proprietario_nome || undefined
        } : {
          id: '',
          placa: 'N/A'
        },
        status: mappedStatus as 'aberto' | 'em_regulacao' | 'finalizado',
        valor_estimado: ticket.valor_estimado ? Number(ticket.valor_estimado) : undefined,
        data_evento: ticket.data_evento,
        localizacao: ticket.localizacao,
        subtipo: ticket.subtipo,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      } as Claim;
    } catch (error) {
      console.error('Erro ao buscar sinistro:', error);
      throw error;
    }
  }

  static async addClaimEvent(event: Omit<ClaimEvent, 'id' | 'data'>) {
    try {
      const { data: movement, error } = await supabase
        .from('ticket_movements')
        .insert({
          ticket_id: event.claim_id,
          tipo: 'comentario', // Map all claim events to comentario type
          payload: { 
            responsavel: event.responsavel,
            descricao: event.descricao,
            tipo_evento: event.tipo
          }
        })
        .select()
        .single();

      if (error) throw error;

      const payload = movement.payload as any;
      
      return {
        id: movement.id,
        claim_id: movement.ticket_id,
        tipo: (payload?.tipo_evento || 'outro') as ClaimEventType,
        descricao: payload?.descricao || undefined,
        responsavel: payload?.responsavel || 'Sistema',
        data: movement.created_at
      } as ClaimEvent;
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      throw error;
    }
  }

  static async getClaimEvents(claimId: string) {
    try {
      const { data: movements, error } = await supabase
        .from('ticket_movements')
        .select('*')
        .eq('ticket_id', claimId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (movements || []).map(m => {
        const payload = m.payload as any;
        return {
          id: m.id,
          claim_id: m.ticket_id,
          tipo: (payload?.tipo_evento || 'outro') as ClaimEventType,
          descricao: payload?.descricao || undefined,
          responsavel: payload?.responsavel || 'Sistema',
          data: m.created_at
        };
      }) as ClaimEvent[];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  }

  static async getAssistances(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 50 } = params;
    
    try {
      // Get empresa_id from user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_empresa_id')
        .eq('id', user.id)
        .single();
      
      const empresaId = profile?.default_empresa_id;
      if (!empresaId) throw new Error('Empresa não encontrada');
      
      let query = supabase
        .from('tickets')
        .select(`
          id,
          protocol_code,
          tipo,
          subtipo,
          status,
          data_evento,
          created_at,
          vehicle:frota_veiculos!tickets_vehicle_id_fkey (
            id,
            placa,
            marca,
            modelo
          )
        `)
        .eq('tipo', 'assistencia')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(
          `protocol_code.ilike.%${search}%,vehicle.placa.ilike.%${search}%`
        );
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const assistances: Assistance[] = (data || []).map(ticket => {
        // Map subtipo to AssistanceType
        let tipo: AssistanceType = 'outro';
        if (ticket.subtipo === 'guincho' || ticket.subtipo === 'vidro' || ticket.subtipo === 'residencia') {
          tipo = ticket.subtipo;
        }
        
        return {
          id: ticket.id,
          tipo,
          veiculo: ticket.vehicle ? {
            id: ticket.vehicle.id,
            placa: ticket.vehicle.placa,
            marca: ticket.vehicle.marca || undefined,
            modelo: ticket.vehicle.modelo || undefined
          } : {
            id: '',
            placa: 'N/A'
          },
          status: ticket.status === 'aberto' || ticket.status === 'finalizado' ? ticket.status : 'aberto',
          created_at: ticket.created_at
        };
      });

      return {
        data: assistances,
        total: count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar assistências:', error);
      return { data: [], total: 0 };
    }
  }

  static async deleteClaim(id: string) {
    console.log('🗑️ ClaimsService.deleteClaim iniciando:', id);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .eq('tipo', 'sinistro');

      if (error) {
        console.error('❌ Erro ao deletar sinistro:', error);
        throw error;
      }

      console.log('✅ Sinistro deletado com sucesso:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar sinistro:', error);
      throw error;
    }
  }

  static async deleteAssistance(id: string) {
    console.log('🗑️ ClaimsService.deleteAssistance iniciando:', id);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .eq('tipo', 'assistencia');

      if (error) {
        console.error('❌ Erro ao deletar assistência:', error);
        throw error;
      }

      console.log('✅ Assistência deletada com sucesso:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar assistência:', error);
      throw error;
    }
  }
}