import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SystemStatus = 'operational' | 'degraded' | 'offline' | 'checking';

interface SystemStatusState {
  status: SystemStatus;
  lastCheck: Date | null;
  latencyMs: number | null;
  isOnline: boolean; // navegador online
  message: string;
}

const SUPABASE_HEALTH_URL = 'https://jhvbfvqhuemuvwgqpskz.supabase.co/auth/v1/health';
const CHECK_INTERVAL_MS = 30_000; // 30s
const SLOW_THRESHOLD_MS = 2500;
const TIMEOUT_MS = 6000;

/**
 * Hook que monitora a saúde do Supabase em tempo real.
 * - operational: tudo ok
 * - degraded: respondendo lento (>2.5s)
 * - offline: sem rede ou Supabase indisponível
 */
export function useSystemStatus(intervalMs: number = CHECK_INTERVAL_MS) {
  const [state, setState] = useState<SystemStatusState>({
    status: 'checking',
    lastCheck: null,
    latencyMs: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    message: 'Verificando conexão...',
  });

  const inFlightRef = useRef(false);

  const checkStatus = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Sem internet do navegador
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState({
        status: 'offline',
        lastCheck: new Date(),
        latencyMs: null,
        isOnline: false,
        message: 'Sem conexão com a internet',
      });
      inFlightRef.current = false;
      return;
    }

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(SUPABASE_HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      if (!res.ok) {
        setState({
          status: 'degraded',
          lastCheck: new Date(),
          latencyMs: latency,
          isOnline: true,
          message: `Servidor respondeu com erro (${res.status})`,
        });
      } else if (latency > SLOW_THRESHOLD_MS) {
        setState({
          status: 'degraded',
          lastCheck: new Date(),
          latencyMs: latency,
          isOnline: true,
          message: `Servidor lento (${latency}ms) — operações podem demorar`,
        });
      } else {
        setState({
          status: 'operational',
          lastCheck: new Date(),
          latencyMs: latency,
          isOnline: true,
          message: 'Todos os sistemas operacionais',
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      setState({
        status: 'offline',
        lastCheck: new Date(),
        latencyMs: null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        message: isAbort
          ? 'Servidor não respondeu a tempo (timeout)'
          : 'Não foi possível alcançar o servidor',
      });
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    // check inicial
    checkStatus();

    const interval = setInterval(checkStatus, intervalMs);

    const handleOnline = () => {
      setState((s) => ({ ...s, isOnline: true }));
      checkStatus();
    };
    const handleOffline = () => {
      setState((s) => ({
        ...s,
        isOnline: false,
        status: 'offline',
        message: 'Sem conexão com a internet',
        lastCheck: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkStatus, intervalMs]);

  return { ...state, recheck: checkStatus };
}
