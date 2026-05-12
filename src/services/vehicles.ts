// Services para busca de veículos

import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Policy } from '@/types/claims';
import { plateVariants } from '@/utils/plateSearch';

export class VehiclesService {
  static async searchVehicles(query: string, empresaId?: string): Promise<Vehicle[]> {
    if (!query || query.length < 2) return [];

    try {
      console.log('🔍 Buscando veículos:', { query, empresaId });

      let supabaseQuery = supabase
        .from('frota_veiculos')
        .select(`
          id,
          placa,
          chassi,
          renavam,
          marca,
          modelo,
          ano_modelo,
          categoria,
          combustivel,
          codigo_fipe,
          proprietario_nome,
          proprietario_doc,
          proprietario_tipo,
          status_seguro,
          status_veiculo,
          uf_emplacamento,
          localizacao,
          empresa_id
        `)
        .or(
          [
            ...plateVariants(query).map((v) => `placa.ilike.%${v}%`),
            `placa.ilike.%${query}%`,
            `marca.ilike.%${query}%`,
            `modelo.ilike.%${query}%`,
            `proprietario_nome.ilike.%${query}%`,
            `chassi.ilike.%${query}%`,
          ].join(',')
        );

      // Filtrar por empresa se fornecido
      if (empresaId) {
        supabaseQuery = supabaseQuery.eq('empresa_id', empresaId);
      }

      const { data, error } = await supabaseQuery.order('placa').limit(50);

      if (error) throw error;

      console.log('✅ Veículos encontrados:', data?.length || 0);

      return (data || []).map(v => ({
        id: v.id,
        placa: v.placa,
        chassi: v.chassi || undefined,
        renavam: v.renavam || undefined,
        marca: v.marca || undefined,
        modelo: v.modelo || undefined,
        ano_modelo: v.ano_modelo || undefined,
        categoria: v.categoria || undefined,
        combustivel: v.combustivel || undefined,
        codigo_fipe: v.codigo_fipe || undefined,
        proprietario_nome: v.proprietario_nome || undefined,
        proprietario_doc: v.proprietario_doc || undefined,
        proprietario_tipo: v.proprietario_tipo as 'pf' | 'pj' | undefined,
        status_seguro: v.status_seguro || undefined,
        status_veiculo: v.status_veiculo || undefined,
        uf_emplacamento: v.uf_emplacamento || undefined,
        localizacao: v.localizacao || undefined
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar veículos:', error);
      return [];
    }
  }

  static async getPolicyByVehicleId(vehicleId: string): Promise<Policy | null> {
    try {
      // Por enquanto, retornar null já que não temos campos de apólice na frota_veiculos
      // TODO: Implementar lógica quando houver relação com tabela de apólices
      return null;
    } catch (error) {
      console.error('Erro ao buscar apólice do veículo:', error);
      return null;
    }
  }

  static async markCRLVAsPaid(crlvId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('frota_pagamentos')
        .update({ status: 'pago' })
        .eq('id', crlvId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar CRLV como pago:', error);
      throw error;
    }
  }
}