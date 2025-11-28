import { supabase } from '@/integrations/supabase/client';

export interface Segurado {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  centro_custo?: string;
  status?: string;
  empresa_id?: string;
}

export class SeguradosService {
  /**
   * Busca segurados/colaboradores por nome, CPF ou cargo
   */
  static async searchSegurados(
    searchQuery: string,
    empresaId?: string
  ): Promise<Segurado[]> {
    try {
      let query = supabase
        .from('colaboradores')
        .select('id, nome, cpf, email, telefone, cargo, centro_custo, status, empresa_id')
        .eq('status', 'ativo');

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      // Buscar por nome, CPF ou cargo
      query = query.or(
        `nome.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%,cargo.ilike.%${searchQuery}%`
      );

      const { data, error } = await query.limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar segurados:', error);
      throw error;
    }
  }

  /**
   * Busca segurado por ID
   */
  static async getSeguradoById(id: string): Promise<Segurado | null> {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome, cpf, email, telefone, cargo, centro_custo, status, empresa_id')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao buscar segurado:', error);
      return null;
    }
  }
}
