import { useEffect, useState, useCallback, useRef } from 'react';
import { Bot, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Severidade = 'none' | 'minor' | 'major' | 'critical';

interface IncidenteInterpretado {
  id: string;
  titulo: string;
  status_pt: string;
  impacto_pt: string;
  severidade: Severidade;
  duracao_humana: string;
  componentes_afetados: string[];
  link: string;
  resumo_pt: string;
  acao_recomendada: string;
}

interface AgentResponse {
  fonte: string;
  verificado_em: string;
  latencia_ms?: number;
  total_incidentes: number;
  severidade_global: Severidade;
  diagnostico_geral: string;
  incidentes: IncidenteInterpretado[];
  erro?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://jhvbfvqhuemuvwgqpskz.supabase.co';
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg';
const ENDPOINT = `${SUPABASE_URL}/functions/v1/supabase-status-agent`;

const sevColor: Record<Severidade, string> = {
  none: 'bg-emerald-500',
  minor: 'bg-amber-500',
  major: 'bg-orange-500',
  critical: 'bg-red-500',
};

const sevBg: Record<Severidade, string> = {
  none: 'from-emerald-500/10 to-transparent border-emerald-500/20',
  minor: 'from-amber-500/10 to-transparent border-amber-500/20',
  major: 'from-orange-500/10 to-transparent border-orange-500/20',
  critical: 'from-red-500/10 to-transparent border-red-500/20',
};

export function SupabaseStatusAgentCard() {
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12_000);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: '{}',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AgentResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.name === 'AbortError' ? 'Tempo esgotado (12s)' : (e?.message ?? 'Falha'));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const sev = data?.severidade_global ?? 'none';
  const semIncidentes = !loading && data && data.total_incidentes === 0 && !data.erro;

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Agente Supabase
            {data && data.total_incidentes > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                {data.total_incidentes}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lê <code className="text-[10px]">incidents/unresolved.json</code> e interpreta em português
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          <span className="ml-1.5 hidden sm:inline">Verificar</span>
        </Button>
      </div>

      <div
        className={cn(
          'rounded-xl border bg-gradient-to-br p-5',
          sevBg[sev],
        )}
      >
        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Consultando Supabase…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Não foi possível consultar o agente: {error}</span>
          </div>
        ) : data ? (
          <>
            <div className="flex items-start gap-3">
              <span className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
                {sev !== 'none' && (
                  <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', sevColor[sev])} />
                )}
                <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', sevColor[sev])} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">
                  {data.diagnostico_geral}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Verificado agora
                  {typeof data.latencia_ms === 'number' && <> · {data.latencia_ms}ms</>}
                  {' · '}
                  <a
                    href="https://status.supabase.com/api/v2/incidents/unresolved.json"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground inline-flex items-center gap-0.5"
                  >
                    fonte <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </div>
            </div>

            {semIncidentes && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sem incidentes em aberto
              </div>
            )}

            {data.incidentes.length > 0 && (
              <div className="mt-5 space-y-3">
                {data.incidentes.map((inc) => (
                  <div
                    key={inc.id}
                    className="rounded-lg border bg-background/60 backdrop-blur-sm p-4"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', sevColor[inc.severidade])} />
                      <span className="text-sm font-medium">{inc.titulo}</span>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {inc.status_pt}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {inc.impacto_pt}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">há {inc.duracao_humana}</span>
                    </div>

                    {inc.componentes_afetados.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {inc.componentes_afetados.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-foreground/80 leading-relaxed">{inc.resumo_pt}</p>

                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span><span className="font-medium text-foreground/70">O que fazer:</span> {inc.acao_recomendada}</span>
                    </div>

                    {inc.link && (
                      <a
                        href={inc.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-2"
                      >
                        Detalhes oficiais <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {data.erro && (
              <p className="text-[11px] text-destructive mt-3">⚠ {data.erro}</p>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
