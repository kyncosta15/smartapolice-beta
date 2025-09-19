import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FrotaStatusFixResult {
  success: boolean;
  veiculos_atualizados: number;
  placas_alteradas: string[];
  message: string;
  error?: string;
}

export class FrotaStatusService {
  /**
   * Detecta e corrige veículos com categoria "outros" alterando seu status_seguro para "sem_seguro"
   */
  static async autoFixStatusOutros(): Promise<FrotaStatusFixResult> {
    try {
      const { data, error } = await supabase.rpc('fix_categoria_outros_to_sem_seguro');
      
      if (error) {
        console.error('Erro ao executar correção de status:', error);
        return {
          success: false,
          veiculos_atualizados: 0,
          placas_alteradas: [],
          message: 'Erro ao executar correção',
          error: error.message
        };
      }
      
      const result = data[0] as any;
      return {
        success: result?.success ?? false,
        veiculos_atualizados: result?.veiculos_atualizados ?? 0,
        placas_alteradas: result?.placas_alteradas ?? [],
        message: result?.message ?? 'Resultado inesperado',
        error: result?.error
      };
    } catch (error) {
      console.error('Erro na correção automática:', error);
      return {
        success: false,
        veiculos_atualizados: 0,
        placas_alteradas: [],
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica se existem veículos com categoria "outros" que precisam ser corrigidos
   */
  static async checkForStatusOutros(): Promise<{ hasOutros: boolean; count: number; placas: string[] }> {
    try {
      const { data, error } = await supabase
        .from('frota_veiculos')
        .select('placa, categoria')
        .eq('categoria', 'outros');
      
      if (error) {
        console.error('Erro ao verificar categoria outros:', error);
        return { hasOutros: false, count: 0, placas: [] };
      }
      
      const placas = data?.map(v => v.placa) || [];
      
      return {
        hasOutros: data ? data.length > 0 : false,
        count: data?.length || 0,
        placas
      };
    } catch (error) {
      console.error('Erro na verificação:', error);
      return { hasOutros: false, count: 0, placas: [] };
    }
  }

  /**
   * Executa correção com feedback visual
   */
  static async executeAutoFixWithToast(): Promise<FrotaStatusFixResult> {
    // Primeiro verificar se há algo para corrigir
    const check = await this.checkForStatusOutros();
    
    if (!check.hasOutros) {
      toast({
        title: "✅ Status verificado",
        description: "Nenhum veículo com categoria 'Outros' encontrado",
        variant: "default"
      });
      
      return {
        success: true,
        veiculos_atualizados: 0,
        placas_alteradas: [],
        message: 'Nenhum veículo com categoria "Outros" encontrado'
      };
    }

    // Executar correção
    const result = await this.autoFixStatusOutros();
    
    if (result.success) {
      toast({
        title: "🔧 Status corrigido automaticamente",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "❌ Erro na correção",
        description: result.error || result.message,
        variant: "destructive"
      });
    }
    
    return result;
  }

  /**
   * Monitora mudanças em tempo real na tabela frota_veiculos
   */
  static subscribeToFrotaChanges(callback: () => void) {
    return supabase
      .channel('frota-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'frota_veiculos'
        },
        (payload) => {
          console.log('Mudança detectada na frota:', payload);
          callback();
        }
      )
      .subscribe();
  }
}