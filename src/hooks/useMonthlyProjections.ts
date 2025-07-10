
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonthlyProjection {
  id: string;
  month: number;
  year: number;
  projected_cost: number;
  actual_cost: number;
}

export function useMonthlyProjections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjections = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('monthly_projections')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .order('month');

      if (error) throw error;
      
      setProjections(data || []);
    } catch (error) {
      console.error('Erro ao carregar projeções:', error);
      toast({
        title: "Erro ao carregar projeções",
        description: "Não foi possível carregar as projeções mensais",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateProjections = async (totalMonthlyCost: number) => {
    if (!user?.id) return;
    
    try {
      const currentYear = new Date().getFullYear();
      
      // Gerar projeções para os 12 meses
      const projectionsData = Array.from({ length: 12 }, (_, index) => ({
        user_id: user.id,
        year: currentYear,
        month: index + 1,
        projected_cost: totalMonthlyCost,
        actual_cost: 0
      }));

      const { error } = await supabase
        .from('monthly_projections')
        .upsert(projectionsData, { 
          onConflict: 'user_id,year,month',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      
      await loadProjections();
      
      toast({
        title: "Projeções atualizadas",
        description: "As projeções mensais foram calculadas com base nas suas apólices",
      });
    } catch (error) {
      console.error('Erro ao gerar projeções:', error);
      toast({
        title: "Erro ao gerar projeções",
        description: "Não foi possível calcular as projeções mensais",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProjections();
    }
  }, [user?.id]);

  return {
    projections,
    isLoading,
    generateProjections,
    refreshProjections: loadProjections
  };
}
