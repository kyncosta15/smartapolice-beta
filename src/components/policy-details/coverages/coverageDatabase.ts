
import { supabase } from '@/integrations/supabase/client';
import { Coverage } from './types';

export class CoverageDatabase {
  static async loadCoverages(policyId: string): Promise<Coverage[]> {
    if (!policyId) {
      console.log('⚠️ PolicyId não fornecido para carregamento');
      return [];
    }

    console.log('🔍 Buscando coberturas no DB para policy:', policyId);
    
    const { data, error } = await supabase
      .from('coberturas')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao carregar coberturas:', error);
      throw error;
    }

    console.log('📚 Coberturas encontradas no DB:', data);

    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        descricao: item.descricao || '',
        lmi: item.lmi || undefined
      }));
    }

    return [];
  }

  static async saveCoverages(coverages: Coverage[], policyId: string): Promise<Coverage[] | null> {
    if (!policyId) {
      console.log('⚠️ Não é possível salvar coberturas sem policyId');
      return null;
    }

    try {
      const coberturasToInsert = coverages.map(coverage => ({
        policy_id: policyId,
        descricao: coverage.descricao,
        lmi: coverage.lmi || null
      }));

      console.log('💾 Inserindo coberturas iniciais no banco:', coberturasToInsert);

      const { data, error } = await supabase
        .from('coberturas')
        .insert(coberturasToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar coberturas iniciais:', error);
        return null;
      }

      console.log('✅ Coberturas iniciais salvas no banco:', data);

      if (data) {
        return data.map(item => ({
          id: item.id,
          descricao: item.descricao || '',
          lmi: item.lmi || undefined
        }));
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao salvar coberturas iniciais:', error);
      return null;
    }
  }

  static async updateCoverage(coverage: Coverage): Promise<void> {
    if (!coverage.id || coverage.id.startsWith('temp-')) {
      throw new Error('Cannot update coverage without valid ID');
    }

    const { error } = await supabase
      .from('coberturas')
      .update({
        descricao: coverage.descricao,
        lmi: coverage.lmi || null
      })
      .eq('id', coverage.id);

    if (error) throw error;
    console.log('✅ Cobertura atualizada com sucesso');
  }

  static async insertCoverage(coverage: Coverage, policyId: string): Promise<Coverage> {
    const { data, error } = await supabase
      .from('coberturas')
      .insert({
        policy_id: policyId,
        descricao: coverage.descricao,
        lmi: coverage.lmi || null
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Nova cobertura inserida:', data);
    
    return {
      id: data.id,
      descricao: data.descricao || '',
      lmi: data.lmi || undefined
    };
  }

  static async deleteCoverage(coverageId: string): Promise<void> {
    if (!coverageId.startsWith('temp-')) {
      const { error } = await supabase
        .from('coberturas')
        .delete()
        .eq('id', coverageId);

      if (error) throw error;
    }
  }
}
