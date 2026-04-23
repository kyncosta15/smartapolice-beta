import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PolicyLite {
  id: string;
  numero_apolice: string | null;
  segurado_nome: string | null;
  seguradora: string | null;
  tipo: string | null;
}

/**
 * Lista enxuta de apólices do usuário logado para uso em seletores
 * (ex: vinculação de documentos no upload).
 */
export function useUserPoliciesLite() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setPolicies([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('policies')
          .select('id, numero_apolice, segurado_nome, seguradora, tipo')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!cancelled) {
          setPolicies((data || []) as PolicyLite[]);
        }
      } catch (err) {
        console.error('[useUserPoliciesLite] erro:', err);
        if (!cancelled) setPolicies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { policies, loading };
}
