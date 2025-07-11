
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Coverage {
  id?: string;
  descricao: string;
  lmi?: number;
}

export const useCoveragesData = (
  initialCoverages: Coverage[] | string[],
  policyId: string
) => {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 CoveragesCard montado - carregando dados do DB para policy:', policyId);
    loadCoveragesFromDB();
  }, [policyId]);

  const loadCoveragesFromDB = async () => {
    if (!policyId) {
      console.log('⚠️ PolicyId não fornecido, não é possível carregar coberturas');
      return;
    }

    try {
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
        const dbCoverages = data.map(item => ({
          id: item.id,
          descricao: item.descricao || '',
          lmi: item.lmi || undefined
        }));
        
        console.log('✅ Usando coberturas do banco de dados:', dbCoverages);
        setCoverages(dbCoverages);
      } else {
        console.log('📝 Nenhuma cobertura no DB, processando dados iniciais:', initialCoverages);
        
        if (initialCoverages && initialCoverages.length > 0) {
          const normalizedCoverages = normalizeInitialCoverages(initialCoverages);
          console.log('🔄 Salvando coberturas iniciais no banco:', normalizedCoverages);
          
          await saveInitialCoverages(normalizedCoverages);
          setCoverages(normalizedCoverages);
        }
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('❌ Erro ao carregar coberturas:', error);
      setIsLoaded(true);
    }
  };

  const normalizeInitialCoverages = (initialCoverages: Coverage[] | string[]): Coverage[] => {
    return initialCoverages.map((coverage, index) => {
      if (typeof coverage === 'string') {
        return { 
          id: `temp-${index}`, 
          descricao: coverage,
          lmi: undefined
        };
      }
      return {
        ...coverage,
        id: coverage.id || `temp-${index}`
      };
    });
  };

  const saveInitialCoverages = async (coverages: Coverage[]) => {
    try {
      const coberturasToInsert = coverages.map(coverage => ({
        policy_id: policyId,
        descricao: coverage.descricao,
        lmi: coverage.lmi || null
      }));

      const { data, error } = await supabase
        .from('coberturas')
        .insert(coberturasToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar coberturas iniciais:', error);
        return;
      }

      console.log('✅ Coberturas iniciais salvas no banco:', data);

      if (data) {
        const updatedCoverages = data.map(item => ({
          id: item.id,
          descricao: item.descricao || '',
          lmi: item.lmi || undefined
        }));

        setCoverages(updatedCoverages);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar coberturas iniciais:', error);
    }
  };

  const saveCoverage = async (coverage: Coverage) => {
    try {
      console.log('💾 Salvando cobertura:', coverage);
      
      if (coverage.id && !coverage.id.startsWith('temp-')) {
        const { error } = await supabase
          .from('coberturas')
          .update({
            descricao: coverage.descricao,
            lmi: coverage.lmi
          })
          .eq('id', coverage.id);

        if (error) throw error;
        console.log('✅ Cobertura atualizada com sucesso');
      } else {
        const { data, error } = await supabase
          .from('coberturas')
          .insert({
            policy_id: policyId,
            descricao: coverage.descricao,
            lmi: coverage.lmi
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Nova cobertura inserida:', data);
        
        setCoverages(prev => prev.map(c => 
          c.id === coverage.id ? { ...coverage, id: data.id } : c
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
      
      if (!coverageId.startsWith('temp-')) {
        const { error } = await supabase
          .from('coberturas')
          .delete()
          .eq('id', coverageId);

        if (error) throw error;
      }

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
