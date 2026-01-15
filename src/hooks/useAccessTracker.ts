import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccessTrackerState {
  isNewAccess: boolean;
  ipAddress: string;
  userAgent: string;
  isLoading: boolean;
  markAsRegistered: () => void;
}

export function useAccessTracker(userId: string | undefined): AccessTrackerState {
  const [isNewAccess, setIsNewAccess] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Obter o IP do usuário via edge function
      const { data: ipData } = await supabase.functions.invoke('get-client-ip');
      const currentIp = ipData?.ip || 'unknown';
      const currentUserAgent = navigator.userAgent;

      setIpAddress(currentIp);
      setUserAgent(currentUserAgent);

      // Verificar se este IP já foi registrado para este usuário
      const { data: existingLogs, error } = await supabase
        .from('user_access_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('ip_address', currentIp)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar acesso:', error);
        setIsLoading(false);
        return;
      }

      // Se não existe registro para este IP, é um novo acesso
      if (!existingLogs || existingLogs.length === 0) {
        setIsNewAccess(true);
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const markAsRegistered = useCallback(() => {
    setIsNewAccess(false);
  }, []);

  return {
    isNewAccess,
    ipAddress,
    userAgent,
    isLoading,
    markAsRegistered,
  };
}
