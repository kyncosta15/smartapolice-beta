import { useState, useEffect } from 'react';
import { getDocumentos } from '@/services/corpnuvem/documentos';

export type PoliciesPeriod = 'datinc' | 'inivig' | 'fimvig';

export function useCorpNuvemPolicies(periodo: PoliciesPeriod = 'datinc', ano?: number) {
  const [totalPolicies, setTotalPolicies] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const data = await getDocumentos({
          qtd_pag: 20,
          pag: 1,
          periodo,
          codfil: 1,
          ano
        });
        
        setTotalPolicies(data?.header?.count || 0);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar apólices da CorpNuvem:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, [periodo, ano]);

  return { totalPolicies, loading, error };
}
