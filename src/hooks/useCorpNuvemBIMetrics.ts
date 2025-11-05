import { useState, useEffect } from 'react';
import { getDocumentosBI, type TipoData, type DocumentoBI } from '@/services/corpnuvem/documentosBI';

export interface BIMetrics {
  producao_total: number;
  novos: number;
  renovacoes: number;
  faturas: number;
  endossos: number;
  seguradoras: Array<{ name: string; value: number; percentage: number }>;
  ramos: Array<{ name: string; value: number; percentage: number }>;
  produtores: Array<{ name: string; novos: number; renovacoes: number; faturas: number; endossos: number }>;
}

interface UseCorpNuvemBIMetricsParams {
  dt_ini: string; // DD/MM/YYYY
  dt_fim: string; // DD/MM/YYYY
  tipoData: TipoData;
}

export function useCorpNuvemBIMetrics({ dt_ini, dt_fim, tipoData }: UseCorpNuvemBIMetricsParams) {
  const [metrics, setMetrics] = useState<BIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        console.log('🔍 [BI Hook] Buscando métricas com parâmetros:', { dt_ini, dt_fim, tipoData });
        
        // Buscar todos os tipos de documentos com tratamento individual de erro
        const fetchWithFallback = async (tipo: string) => {
          try {
            return await getDocumentosBI({ dt_ini, dt_fim, data: tipoData, tipo_doc: tipo as any, qtd_pag: 20, pag: 1 });
          } catch (error) {
            console.error(`❌ [BI Hook] Erro ao buscar tipo ${tipo}:`, error);
            return { header: { count: 0 }, documentos: [] };
          }
        };

        const [todos, novos, renovacoes, faturas, endossos] = await Promise.all([
          fetchWithFallback('a'),
          fetchWithFallback('n'),
          fetchWithFallback('r'),
          fetchWithFallback('f'),
          fetchWithFallback('e'),
        ]);

        console.log('✅ [BI Hook] Dados recebidos:', {
          todos: todos.header.count,
          novos: novos.header.count,
          renovacoes: renovacoes.header.count,
          faturas: faturas.header.count,
          endossos: endossos.header.count
        });

        const todosDocumentos = todos.documentos;

        // Processar seguradoras
        const seguradoras = new Map<string, number>();
        todosDocumentos.forEach((doc: DocumentoBI) => {
          const seguradora = doc.seguradora || 'OUTRAS';
          seguradoras.set(seguradora, (seguradoras.get(seguradora) || 0) + 1);
        });
        
        const totalDocs = todosDocumentos.length;
        const seguradoresArray = Array.from(seguradoras.entries())
          .map(([name, value]) => ({ 
            name, 
            value,
            percentage: totalDocs > 0 ? (value / totalDocs) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value);

        // Processar ramos
        const ramos = new Map<string, number>();
        todosDocumentos.forEach((doc: DocumentoBI) => {
          const ramo = doc.ramo || 'OUTROS';
          ramos.set(ramo, (ramos.get(ramo) || 0) + 1);
        });
        
        const ramosArray = Array.from(ramos.entries())
          .map(([name, value]) => ({ 
            name, 
            value,
            percentage: totalDocs > 0 ? (value / totalDocs) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value);

        // Processar produtores (por cliente)
        const produtores = new Map<string, { novos: number; renovacoes: number; faturas: number; endossos: number }>();
        
        novos.documentos.forEach((doc: DocumentoBI) => {
          const cliente = doc.cliente || 'Sem Cliente';
          const current = produtores.get(cliente) || { novos: 0, renovacoes: 0, faturas: 0, endossos: 0 };
          produtores.set(cliente, { ...current, novos: current.novos + 1 });
        });

        renovacoes.documentos.forEach((doc: DocumentoBI) => {
          const cliente = doc.cliente || 'Sem Cliente';
          const current = produtores.get(cliente) || { novos: 0, renovacoes: 0, faturas: 0, endossos: 0 };
          produtores.set(cliente, { ...current, renovacoes: current.renovacoes + 1 });
        });

        faturas.documentos.forEach((doc: DocumentoBI) => {
          const cliente = doc.cliente || 'Sem Cliente';
          const current = produtores.get(cliente) || { novos: 0, renovacoes: 0, faturas: 0, endossos: 0 };
          produtores.set(cliente, { ...current, faturas: current.faturas + 1 });
        });

        endossos.documentos.forEach((doc: DocumentoBI) => {
          const cliente = doc.cliente || 'Sem Cliente';
          const current = produtores.get(cliente) || { novos: 0, renovacoes: 0, faturas: 0, endossos: 0 };
          produtores.set(cliente, { ...current, endossos: current.endossos + 1 });
        });

        const produtoresArray = Array.from(produtores.entries())
          .map(([name, counts]) => ({ name, ...counts }))
          .sort((a, b) => {
            const totalA = a.novos + a.renovacoes + a.faturas + a.endossos;
            const totalB = b.novos + b.renovacoes + b.faturas + b.endossos;
            return totalB - totalA;
          })
          .slice(0, 15); // Top 15 produtores

        setMetrics({
          producao_total: todos.header.count,
          novos: novos.header.count,
          renovacoes: renovacoes.header.count,
          faturas: faturas.header.count,
          endossos: endossos.header.count,
          seguradoras: seguradoresArray,
          ramos: ramosArray,
          produtores: produtoresArray
        });
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar métricas BI da CorpNuvem:', err);
        setError(err as Error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [dt_ini, dt_fim, tipoData]);

  return { metrics, loading, error };
}
