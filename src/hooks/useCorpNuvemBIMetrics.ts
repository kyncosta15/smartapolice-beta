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
  datini: string; // DD/MM/YYYY
  datfim: string; // DD/MM/YYYY
  tipoData: TipoData;
}

export function useCorpNuvemBIMetrics({ datini, datfim, tipoData }: UseCorpNuvemBIMetricsParams) {
  const [metrics, setMetrics] = useState<BIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        console.log('🔍 [BI Hook] Buscando métricas com parâmetros:', { datini, datfim, tipoData });
        
        // Buscar apenas todos os documentos (tipo 'a')
        const fetchWithFallback = async (tipo: string) => {
          try {
            return await getDocumentosBI({ datini, datfim, data: tipoData, tipo_doc: tipo as any });
          } catch (error) {
            console.error(`❌ [BI Hook] Erro ao buscar tipo ${tipo}:`, error);
            return { header: { count: 0 }, documentos: [] };
          }
        };

        // Buscar todos os documentos
        const todos = await fetchWithFallback('a');

        console.log('✅ [BI Hook] Produção total recebida:', {
          total: todos.header.count,
          documentos: todos.documentos.length
        });

        const todosDocumentos = todos.documentos;

        // Calcular novos, renovações, faturas e endossos a partir dos documentos
        const novosCount = todosDocumentos.filter(doc => doc.nosnum_ren === null || doc.nosnum_ren === 0).length;
        const renovacoesCount = todosDocumentos.filter(doc => doc.nosnum_ren !== null && doc.nosnum_ren > 0).length;
        const faturasCount = todosDocumentos.filter(doc => parseInt(doc.numpar?.toString() || '0') > 1).length;
        const endossosCount = todosDocumentos.filter(doc => doc.numend && doc.numend !== '0').length;

        console.log('✅ [BI Hook] Métricas calculadas:', {
          producao_total: todos.header.count,
          novos: novosCount,
          renovacoes: renovacoesCount,
          faturas: faturasCount,
          endossos: endossosCount
        });

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

        // Processar produtores (por cliente) - usar apenas documentos que são novos ou renovações
        const produtores = new Map<string, { novos: number; renovacoes: number; faturas: number; endossos: number }>();
        
        todosDocumentos.forEach((doc: DocumentoBI) => {
          const cliente = doc.cliente || 'Sem Cliente';
          const current = produtores.get(cliente) || { novos: 0, renovacoes: 0, faturas: 0, endossos: 0 };
          
          // Classificar o documento
          const isNovo = doc.nosnum_ren === null || doc.nosnum_ren === 0;
          const isRenovacao = doc.nosnum_ren !== null && doc.nosnum_ren > 0;
          const isFatura = parseInt(doc.numpar?.toString() || '0') > 1;
          const isEndosso = doc.numend && doc.numend !== '0';
          
          if (isNovo) current.novos++;
          if (isRenovacao) current.renovacoes++;
          if (isFatura) current.faturas++;
          if (isEndosso) current.endossos++;
          
          produtores.set(cliente, current);
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
          novos: novosCount,
          renovacoes: renovacoesCount,
          faturas: faturasCount,
          endossos: endossosCount,
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
  }, [datini, datfim, tipoData]);

  return { metrics, loading, error };
}
