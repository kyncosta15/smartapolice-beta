
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Coverage, CoverageHookReturn } from './types';
import { normalizeInitialCoverages } from './coverageNormalizer';
import { CoverageDatabase } from './coverageDatabase';
import { getItens, convertGarantiasToCoberuras } from '@/services/corpnuvem/itens';

export const useCoveragesData = (
  initialCoverages: Coverage[] | string[],
  policyId: string,
  nosnum?: number,
  codfil?: number
): CoverageHookReturn => {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 useCoveragesData: Iniciando carregamento para policy:', policyId);
    console.log('📋 Coberturas iniciais recebidas:', initialCoverages);
    loadCoveragesFromDB();
  }, [policyId]);

  const loadCoveragesFromDB = async () => {
    if (!policyId) {
      console.log('⚠️ PolicyId não fornecido, processando dados iniciais apenas');
      if (initialCoverages && initialCoverages.length > 0) {
        const normalizedCoverages = normalizeInitialCoverages(initialCoverages);
        console.log('📝 Usando coberturas iniciais normalizadas:', normalizedCoverages);
        setCoverages(normalizedCoverages);
      }
      setIsLoaded(true);
      return;
    }

    try {
      // PRIORIDADE 1: Tentar buscar da API CorpNuvem se tiver nosnum e codfil
      if (nosnum && codfil) {
        console.log('🌐 Tentando buscar coberturas da API CorpNuvem:', { nosnum, codfil });
        try {
          const response = await getItens({ nosnum, codfil });
          if (response.itens?.[0]?.garantias?.length > 0) {
            const apiCoverages = convertGarantiasToCoberuras(response.itens[0].garantias);
            console.log('✅ Coberturas obtidas da API CorpNuvem:', apiCoverages);
            
            // Salvar no banco de dados para cache
            const savedCoverages = await CoverageDatabase.saveCoverages(apiCoverages, policyId);
            setCoverages(savedCoverages || apiCoverages);
            setIsLoaded(true);
            return;
          } else {
            console.log('📭 API retornou sem coberturas');
          }
        } catch (apiError) {
          console.warn('⚠️ Erro ao buscar da API CorpNuvem, tentando outras fontes:', apiError);
        }
      }

      // PRIORIDADE 2: Buscar do banco de dados
      const dbCoverages = await CoverageDatabase.loadCoverages(policyId);

      if (dbCoverages.length > 0) {
        console.log('✅ Usando coberturas do banco de dados:', dbCoverages);
        setCoverages(dbCoverages);
      } else {
        console.log('📝 Nenhuma cobertura no DB, verificando dados iniciais:', initialCoverages);
        
        // PRIORIDADE 3: Usar coberturas iniciais (do N8N ou upload)
        if (initialCoverages && initialCoverages.length > 0) {
          const normalizedCoverages = normalizeInitialCoverages(initialCoverages);
          console.log('🔄 Salvando coberturas iniciais no banco:', normalizedCoverages);
          
          const savedCoverages = await CoverageDatabase.saveCoverages(normalizedCoverages, policyId);
          setCoverages(savedCoverages || normalizedCoverages);
        } else {
          console.log('📭 Nenhuma cobertura inicial disponível');
          setCoverages([]);
        }
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('❌ Erro ao carregar coberturas:', error);
      
      if (initialCoverages && initialCoverages.length > 0) {
        const normalizedCoverages = normalizeInitialCoverages(initialCoverages);
        console.log('🔄 Usando coberturas iniciais por fallback:', normalizedCoverages);
        setCoverages(normalizedCoverages);
      } else {
        setCoverages([]);
      }
      setIsLoaded(true);
    }
  };

  const saveCoverage = async (coverage: Coverage) => {
    if (!policyId) {
      console.log('⚠️ Não é possível salvar cobertura sem policyId');
      toast({
        title: "❌ Erro",
        description: "ID da apólice não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('💾 Salvando cobertura:', coverage);
      
      if (coverage.id && !coverage.id.startsWith('temp-')) {
        await CoverageDatabase.updateCoverage(coverage);
      } else {
        const newCoverage = await CoverageDatabase.insertCoverage(coverage, policyId);
        
        setCoverages(prev => prev.map(c => 
          c.id === coverage.id ? newCoverage : c
        ));
      }

      toast({
        title: "✅ Cobertura Salva",
        description: "As informações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao salvar cobertura:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: "Não foi possível salvar a cobertura",
        variant: "destructive",
      });
    }
  };

  const deleteCoverage = async (coverageId: string) => {
    try {
      console.log('🗑️ Deletando cobertura:', coverageId);
      
      await CoverageDatabase.deleteCoverage(coverageId);
      setCoverages(prev => prev.filter(c => c.id !== coverageId));
      
      toast({
        title: "✅ Cobertura Removida",
        description: "A cobertura foi removida com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao deletar cobertura:', error);
      toast({
        title: "❌ Erro ao Remover",
        description: "Não foi possível remover a cobertura",
        variant: "destructive",
      });
    }
  };

  return {
    coverages,
    setCoverages,
    isLoaded,
    loadCoveragesFromDB,
    saveCoverage,
    deleteCoverage
  };
};
