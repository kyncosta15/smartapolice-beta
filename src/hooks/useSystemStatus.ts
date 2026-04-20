import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ServiceStatus = 'operational' | 'degraded' | 'offline' | 'checking';

interface ServiceCheck {
  status: ServiceStatus;
  latencyMs: number | null;
  message: string;
}

export interface SystemStatusState {
  /** Status agregado (pior dos três) */
  status: ServiceStatus;
  /** Status individual de cada serviço */
  auth: ServiceCheck;
  database: ServiceCheck;
  edgeFunctions: ServiceCheck;
  lastCheck: Date | null;
  latencyMs: number | null; // mantido para compat — reflete o auth
  isOnline: boolean;
  message: string; // mensagem agregada
}

const SUPABASE_URL = 'https://jhvbfvqhuemuvwgqpskz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg';
const SUPABASE_HEALTH_URL = `${SUPABASE_URL}/auth/v1/health`;
const CHECK_INTERVAL_MS = 60_000; // 60s — background, não bloqueia
const SLOW_THRESHOLD_MS = 2500;
const TIMEOUT_MS = 6000;
const EDGE_TIMEOUT_MS = 4000;

const initialCheck = (): ServiceCheck => ({
  status: 'checking',
  latencyMs: null,
  message: 'Verificando...',
});

/**
 * Agrega o status pior entre os três serviços.
 * offline > degraded > operational > checking
 */
function aggregate(a: ServiceStatus, d: ServiceStatus, e: ServiceStatus): ServiceStatus {
  const list = [a, d, e];
  if (list.includes('offline')) return 'offline';
  if (list.includes('degraded')) return 'degraded';
  if (list.every((s) => s === 'operational')) return 'operational';
  return 'checking';
}

function buildAggregatedMessage(state: Pick<SystemStatusState, 'auth' | 'database' | 'edgeFunctions'>): string {
  const broken: string[] = [];
  if (state.auth.status === 'offline') broken.push('Autenticação');
  if (state.database.status === 'offline') broken.push('Banco de dados');
  if (state.edgeFunctions.status === 'offline') broken.push('Funções do servidor');

  if (broken.length > 0) {
    return `${broken.join(', ')} indisponível${broken.length > 1 ? 'is' : ''}`;
  }

  const slow: string[] = [];
  if (state.auth.status === 'degraded') slow.push('Autenticação');
  if (state.database.status === 'degraded') slow.push('Banco de dados');
  if (state.edgeFunctions.status === 'degraded') slow.push('Funções do servidor');

  if (slow.length > 0) {
    return `${slow.join(', ')} respondendo com lentidão`;
  }

  return 'Todos os sistemas operacionais';
}

/**
 * Hook que monitora a saúde do Supabase em background.
 * Verifica 3 serviços separadamente: Auth, Database, Edge Functions.
 *
 * - operational: tudo ok
 * - degraded: algum serviço lento (>2.5s) ou edge com timeout
 * - offline: algum serviço inacessível
 *
 * IMPORTANTE: roda em background, NÃO bloqueia operações críticas (login).
 */
export function useSystemStatus(intervalMs: number = CHECK_INTERVAL_MS) {
  const [state, setState] = useState<SystemStatusState>({
    status: 'checking',
    auth: initialCheck(),
    database: initialCheck(),
    edgeFunctions: initialCheck(),
    lastCheck: null,
    latencyMs: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    message: 'Verificando conexão...',
  });

  const inFlightRef = useRef(false);

  const checkAuth = useCallback(async (): Promise<ServiceCheck> => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(SUPABASE_HEALTH_URL, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      if (!res.ok) {
        return { status: 'degraded', latencyMs: latency, message: `HTTP ${res.status}` };
      }
      if (latency > SLOW_THRESHOLD_MS) {
        return { status: 'degraded', latencyMs: latency, message: `Lento (${latency}ms)` };
      }
      return { status: 'operational', latencyMs: latency, message: `OK (${latency}ms)` };
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        status: 'offline',
        latencyMs: null,
        message: err?.name === 'AbortError' ? 'Timeout' : 'Inacessível',
      };
    }
  }, []);

  const checkDatabase = useCallback(async (): Promise<ServiceCheck> => {
    const start = performance.now();
    try {
      const { error } = await supabase
        .from('health_check')
        .select('id')
        .limit(1)
        .maybeSingle();
      const latency = Math.round(performance.now() - start);

      // PGRST116 = sem linhas (banco respondeu, mas vazio) — ainda saudável
      if (error && error.code !== 'PGRST116') {
        return { status: 'offline', latencyMs: latency, message: error.message };
      }
      if (latency > SLOW_THRESHOLD_MS) {
        return { status: 'degraded', latencyMs: latency, message: `Lento (${latency}ms)` };
      }
      return { status: 'operational', latencyMs: latency, message: `OK (${latency}ms)` };
    } catch (err: any) {
      return { status: 'offline', latencyMs: null, message: err?.message || 'Inacessível' };
    }
  }, []);

  const checkEdgeFunctions = useCallback(async (): Promise<ServiceCheck> => {
    const start = performance.now();
    try {
      const result = await Promise.race<{ data: any; error: any } | { __timeout: true }>([
        supabase.functions.invoke('health-ping', { body: {} }) as any,
        new Promise((resolve) =>
          setTimeout(() => resolve({ __timeout: true } as any), EDGE_TIMEOUT_MS),
        ),
      ]);
      const latency = Math.round(performance.now() - start);

      if ('__timeout' in result) {
        return { status: 'degraded', latencyMs: latency, message: `Timeout (${EDGE_TIMEOUT_MS}ms)` };
      }
      if (result.error) {
        return { status: 'offline', latencyMs: latency, message: result.error.message || 'Erro' };
      }
      if (latency > SLOW_THRESHOLD_MS) {
        return { status: 'degraded', latencyMs: latency, message: `Lento (${latency}ms)` };
      }
      return { status: 'operational', latencyMs: latency, message: `OK (${latency}ms)` };
    } catch (err: any) {
      return { status: 'offline', latencyMs: null, message: err?.message || 'Inacessível' };
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (inFlightRef.current) {
      console.log('[useSystemStatus] check já em andamento — ignorando');
      return;
    }
    inFlightRef.current = true;

    // Marca todos como "checking" para feedback visual imediato
    setState((s) => ({
      ...s,
      auth: { ...s.auth, status: 'checking', message: 'Verificando...' },
      database: { ...s.database, status: 'checking', message: 'Verificando...' },
      edgeFunctions: { ...s.edgeFunctions, status: 'checking', message: 'Verificando...' },
    }));

    try {
      // Sem internet do navegador
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineCheck: ServiceCheck = { status: 'offline', latencyMs: null, message: 'Sem internet' };
        setState({
          status: 'offline',
          auth: offlineCheck,
          database: offlineCheck,
          edgeFunctions: offlineCheck,
          lastCheck: new Date(),
          latencyMs: null,
          isOnline: false,
          message: 'Sem conexão com a internet',
        });
        return;
      }

      // Roda os 3 checks em paralelo
      const [auth, database, edgeFunctions] = await Promise.all([
        checkAuth(),
        checkDatabase(),
        checkEdgeFunctions(),
      ]);

      const aggregated = aggregate(auth.status, database.status, edgeFunctions.status);
      const message = buildAggregatedMessage({ auth, database, edgeFunctions });

      setState({
        status: aggregated,
        auth,
        database,
        edgeFunctions,
        lastCheck: new Date(),
        latencyMs: auth.latencyMs,
        isOnline: true,
        message,
      });
    } catch (err) {
      console.error('[useSystemStatus] erro inesperado em checkStatus:', err);
    } finally {
      inFlightRef.current = false;
    }
  }, [checkAuth, checkDatabase, checkEdgeFunctions]);

  useEffect(() => {
    // check inicial
    checkStatus();

    const interval = setInterval(checkStatus, intervalMs);

    const handleOnline = () => {
      setState((s) => ({ ...s, isOnline: true }));
      checkStatus();
    };
    const handleOffline = () => {
      const offlineCheck: ServiceCheck = { status: 'offline', latencyMs: null, message: 'Sem internet' };
      setState((s) => ({
        ...s,
        isOnline: false,
        status: 'offline',
        auth: offlineCheck,
        database: offlineCheck,
        edgeFunctions: offlineCheck,
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
