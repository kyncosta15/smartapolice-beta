import { useState, useEffect } from 'react';
import { getDocumentos } from '@/services/corpnuvem/documentos';
import type { PoliciesPeriod } from './useCorpNuvemPolicies';

export interface CorpNuvemMetrics {
  apolices_por_seguradora: Array<{ seguradora: string; total: number }>;
  total_documentos: number;
  loading: boolean;
  error: Error | null;
}

export function useCorpNuvemMetrics(periodo: PoliciesPeriod = 'datinc', ano?: number) {
  const [metrics, setMetrics] = useState<CorpNuvemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        // Buscar todos os documentos para processar
        // Vamos buscar múltiplas páginas para ter uma amostra representativa
        const paginasParaBuscar = 5; // Buscar 5 páginas (100 documentos)
        const documentosPorPagina = 20;
        
        const promises = Array.from({ length: paginasParaBuscar }, (_, i) => 
          getDocumentos({
            qtd_pag: documentosPorPagina,
            pag: i + 1,
            periodo,
            codfil: 1,
            ano
          })
        );

        const results = await Promise.all(promises);
        
        // Consolidar todos os documentos
        const todosDocumentos = results.flatMap(r => r?.documentos || []);
        const totalDocumentos = results[0]?.header?.count || 0;
        
        // Processar apólices por seguradora
        const seguradoras = new Map<string, number>();
        
        todosDocumentos.forEach((doc: any) => {
          const seguradora = doc.seguradora || 'Sem Seguradora';
          seguradoras.set(seguradora, (seguradoras.get(seguradora) || 0) + 1);
        });
        
        // Converter para array e ordenar
        const apolicesPorSeguradora = Array.from(seguradoras.entries())
          .map(([seguradora, total]) => ({ seguradora, total }))
          .sort((a, b) => b.total - a.total);

        setMetrics({
          apolices_por_seguradora: apolicesPorSeguradora,
          total_documentos: totalDocumentos,
          loading: false,
          error: null
        });
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar métricas da CorpNuvem:', err);
        setError(err as Error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [periodo, ano]);

  return { metrics, loading, error };
}
