// Services para busca de veículos

import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Policy } from '@/types/claims';

export class VehiclesService {
  static async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('frota_veiculos')
        .select(`
          id,
          placa,
          chassi,
          marca,
          modelo,
          proprietario_nome,
          proprietario_tipo
        `)
        .or(`placa.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%,proprietario_nome.ilike.%${query}%,chassi.ilike.%${query}%`)
        .order('placa');

      if (error) throw error;

      return (data || []).map(v => ({
        id: v.id,
        placa: v.placa,
        chassi: v.chassi || undefined,
        marca: v.marca || undefined,
        modelo: v.modelo || undefined,
        proprietario_nome: v.proprietario_nome || undefined,
        proprietario_tipo: v.proprietario_tipo as 'pf' | 'pj' | undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
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