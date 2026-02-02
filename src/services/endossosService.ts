import { supabase } from '@/integrations/supabase/client';

/**
 * Busca o total de valores de endossos para uma lista de apólices
 */
export async function fetchEndossosTotal(policyIds: string[]): Promise<number> {
  if (!policyIds.length) return 0;
  
  try {
    const { data, error } = await (supabase as any)
      .from('policy_documents')
      .select('valor')
      .in('policy_id', policyIds)
      .eq('tipo', 'endosso');

    if (error) throw error;

    const total = (data || []).reduce((sum: number, doc: { valor: number | null }) => {
      return sum + (doc.valor || 0);
    }, 0);

    console.log('📊 [EndossosService] Total de endossos calculado:', total, 'de', data?.length, 'documentos');
    
    return total;
  } catch (error) {
    console.error('❌ [EndossosService] Erro ao buscar endossos:', error);
    return 0;
  }
}

/**
 * Busca totais de endossos agrupados por apólice
 */
export async function fetchEndossosByPolicy(policyIds: string[]): Promise<Record<string, number>> {
  if (!policyIds.length) return {};
  
  try {
    const { data, error } = await (supabase as any)
      .from('policy_documents')
      .select('policy_id, valor')
      .in('policy_id', policyIds)
      .eq('tipo', 'endosso');

    if (error) throw error;

    const grouped = (data || []).reduce((acc: Record<string, number>, doc: { policy_id: string; valor: number | null }) => {
      if (!acc[doc.policy_id]) acc[doc.policy_id] = 0;
      acc[doc.policy_id] += doc.valor || 0;
      return acc;
    }, {});

    console.log('📊 [EndossosService] Endossos por apólice:', grouped);
    
    return grouped;
  } catch (error) {
    console.error('❌ [EndossosService] Erro ao buscar endossos por apólice:', error);
    return {};
  }
}
