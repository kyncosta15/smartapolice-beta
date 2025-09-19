import { useState, useEffect, useCallback } from 'react';
import { FrotaStatusService, FrotaStatusFixResult } from '@/services/frotaStatusService';

export function useFrotaStatusFix() {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [hasOutros, setHasOutros] = useState(false);
  const [outrosCount, setOutrosCount] = useState(0);
  const [outrosPlacas, setOutrosPlacas] = useState<string[]>([]);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await FrotaStatusService.checkForStatusOutros();
      setHasOutros(result.hasOutros);
      setOutrosCount(result.count);
      setOutrosPlacas(result.placas);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const executeAutoFix = useCallback(async (): Promise<FrotaStatusFixResult> => {
    setIsFixing(true);
    try {
      const result = await FrotaStatusService.executeAutoFixWithToast();
      // Atualizar estado após correção
      await checkStatus();
      return result;
    } catch (error) {
      console.error('Erro ao executar correção:', error);
      return {
        success: false,
        veiculos_atualizados: 0,
        placas_alteradas: [],
        message: 'Erro ao executar correção',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsFixing(false);
    }
  }, [checkStatus]);

  // Verificação inicial
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    const channel = FrotaStatusService.subscribeToFrotaChanges(() => {
      // Aguardar um pouco para que a mudança seja processada
      setTimeout(checkStatus, 1000);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [checkStatus]);

  return {
    // Estados
    isChecking,
    isFixing,
    hasOutros,
    outrosCount,
    outrosPlacas,
    
    // Ações
    checkStatus,
    executeAutoFix
  };
}