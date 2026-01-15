import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_INTERVAL_MS = 25 * 1000; // 25 segundos
const DEVICE_ID_KEY = 'presence_device_id';

interface PresenceState {
  sessionId: string | null;
  needsName: boolean;
  currentName: string | null;
  isLoading: boolean;
  error: string | null;
  setDisplayName: (name: string) => Promise<boolean>;
  restartSession: () => Promise<void>;
}

// Gerar ou obter device_id do localStorage
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function usePresence(userId: string | undefined): PresenceState {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Iniciar sessão de presença
  const startSession = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const deviceId = getOrCreateDeviceId();
      const userAgent = navigator.userAgent;
      const currentPath = window.location.pathname;

      const { data, error: startError } = await supabase.functions.invoke('presence-start', {
        body: {
          user_id: userId,
          device_id: deviceId,
          user_agent: userAgent,
          current_path: currentPath
        }
      });

      if (startError) {
        console.error('Presence start error:', startError);
        setError(startError.message);
        return;
      }

      console.log('Presence session started:', data);
      
      setSessionId(data.session_id);
      sessionIdRef.current = data.session_id;
      setNeedsName(data.needs_name);
      setCurrentName(data.current_name);
      
    } catch (err: any) {
      console.error('Presence start failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Enviar heartbeat
  const sendHeartbeat = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    try {
      const currentPath = window.location.pathname;
      
      const { data, error: heartbeatError } = await supabase.functions.invoke('presence-heartbeat', {
        body: {
          session_id: currentSessionId,
          current_path: currentPath
        }
      });

      if (heartbeatError) {
        console.error('Heartbeat error:', heartbeatError);
        
        // Se a sessão expirou, reiniciar
        if (data?.should_restart) {
          console.log('Session expired, restarting...');
          await startSession();
        }
      }
    } catch (err) {
      console.error('Heartbeat failed:', err);
    }
  }, [startSession]);

  // Encerrar sessão
  const endSession = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    try {
      await supabase.functions.invoke('presence-end', {
        body: { session_id: currentSessionId }
      });
      console.log('Session ended');
    } catch (err) {
      console.error('End session failed:', err);
    }
  }, []);

  // Definir nome de exibição
  const setDisplayName = useCallback(async (name: string): Promise<boolean> => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return false;

    try {
      const { error: setNameError } = await supabase.functions.invoke('presence-set-name', {
        body: {
          session_id: currentSessionId,
          display_name: name
        }
      });

      if (setNameError) {
        console.error('Set name error:', setNameError);
        return false;
      }

      setNeedsName(false);
      setCurrentName(name);
      return true;
    } catch (err) {
      console.error('Set name failed:', err);
      return false;
    }
  }, []);

  // Reiniciar sessão manualmente
  const restartSession = useCallback(async () => {
    await endSession();
    await startSession();
  }, [endSession, startSession]);

  // Iniciar sessão quando userId estiver disponível
  useEffect(() => {
    if (userId) {
      startSession();
    }
  }, [userId, startSession]);

  // Configurar heartbeat interval
  useEffect(() => {
    if (sessionId) {
      // Limpar interval anterior se existir
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Iniciar novo interval
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
      
      console.log('Heartbeat interval started');
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [sessionId, sendHeartbeat]);

  // Cleanup ao desmontar ou fechar aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Tentar enviar beacon para encerrar sessão
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) {
        navigator.sendBeacon(
          `https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/presence-end`,
          JSON.stringify({ session_id: currentSessionId })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Quando a aba fica oculta, enviar heartbeat final
        sendHeartbeat();
      } else if (document.visibilityState === 'visible') {
        // Quando volta a ficar visível, enviar heartbeat
        sendHeartbeat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Tentar encerrar sessão ao desmontar
      endSession();
    };
  }, [endSession, sendHeartbeat]);

  return {
    sessionId,
    needsName,
    currentName,
    isLoading,
    error,
    setDisplayName,
    restartSession
  };
}
