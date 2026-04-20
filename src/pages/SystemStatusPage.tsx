import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowLeft, RefreshCw, ExternalLink, Clock, Wrench, ChevronRight, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SupabaseStatusAgentCard } from '@/components/status/SupabaseStatusAgentCard';


type NormalizedStatus = 'operational' | 'degraded' | 'major' | 'critical' | 'unknown';

interface Component {
  name: string;
  status: NormalizedStatus;
  description?: string;
}
interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  created_at: string;
  updated_at: string;
  shortlink?: string;
  body?: string;
  affected_components?: string[];
}
interface Provider {
  provider: 'lovable' | 'supabase' | 'rcorp';
  label: string;
  url: string;
  overall: NormalizedStatus;
  description: string;
  components: Component[];
  incidents: Incident[];
  scheduled_maintenances: Incident[];
  fetched_at: string;
  error?: string;
}
interface AggregatedResponse {
  overall: NormalizedStatus;
  total_incidents: number;
  providers: { lovable: Provider; supabase: Provider; rcorp: Provider };
  generated_at: string;
}

// Endpoint público — sem JWT, evita preflight pesado de invoke()
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://jhvbfvqhuemuvwgqpskz.supabase.co';
const STATUS_ENDPOINT = `${SUPABASE_URL}/functions/v1/system-status-aggregator`;
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg';

const dotColor: Record<NormalizedStatus, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  major: 'bg-orange-500',
  critical: 'bg-red-500',
  unknown: 'bg-muted-foreground/40',
};

const statusLabel: Record<NormalizedStatus, string> = {
  operational: 'Operacional',
  degraded: 'Degradado',
  major: 'Interrupção parcial',
  critical: 'Indisponível',
  unknown: 'Desconhecido',
};

const heroCopy: Record<NormalizedStatus, { title: string; gradient: string }> = {
  operational: {
    title: 'Todos os sistemas operacionais',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  degraded: {
    title: 'Sistema com degradação parcial',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
  major: {
    title: 'Interrupção parcial em andamento',
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
  },
  critical: {
    title: 'Há serviços indisponíveis',
    gradient: 'from-red-500/20 via-red-500/5 to-transparent',
  },
  unknown: {
    title: 'Verificando status…',
    gradient: 'from-muted via-muted/30 to-transparent',
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

export default function SystemStatusPage() {
  const [data, setData] = useState<AggregatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    // Cancela request anterior se houver
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout de 8s — evita travar "Verificando..." pra sempre
    const timeout = setTimeout(() => controller.abort(), 8_000);

    setLoading(true);
    setError(null);
    const t0 = performance.now();
    try {
      console.log('[status] fetching…', STATUS_ENDPOINT);
      const res = await fetch(STATUS_ENDPOINT, {
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
      console.log('[status] http', res.status, `${Math.round(performance.now() - t0)}ms`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AggregatedResponse;
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setData(json);
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      const msg =
        e?.message ?? 'Falha ao carregar status';
      console.warn('[status] erro:', msg);
      setError(msg);
    } finally {
      clearTimeout(timeout);
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => {
      clearInterval(i);
      abortRef.current?.abort();
    };
  }, [load]);

  // Enquanto carrega a primeira vez sem dados, mostra "operational" otimista
  // pra evitar flash de "Interrupção parcial" quando o aggregator está demorando.
  const overall: NormalizedStatus = data?.overall ?? (loading ? 'unknown' : 'unknown');
  const hero = heroCopy[overall];

  const allIncidents = useMemo(() => {
    if (!data) return [] as (Incident & { source: string; sourceProvider: string })[];
    const p = data.providers;
    return [
      ...p.rcorp.incidents.map((i) => ({ ...i, source: p.rcorp.label, sourceProvider: 'rcorp' })),
      ...p.lovable.incidents.map((i) => ({ ...i, source: p.lovable.label, sourceProvider: 'lovable' })),
      ...p.supabase.incidents.map((i) => ({ ...i, source: p.supabase.label, sourceProvider: 'supabase' })),
    ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [data]);

  const allMaintenances = useMemo(() => {
    if (!data) return [] as (Incident & { source: string })[];
    const p = data.providers;
    return [
      ...p.lovable.scheduled_maintenances.map((i) => ({ ...i, source: p.lovable.label })),
      ...p.supabase.scheduled_maintenances.map((i) => ({ ...i, source: p.supabase.label })),
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — minimal */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RCorp</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-medium">Status</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground -mr-2"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span className="ml-1.5 hidden sm:inline">{loading ? 'Atualizando' : 'Atualizar'}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Hero — gradient sutil + status pill */}
        <section className="relative">
          <div
            className={cn(
              'absolute inset-x-0 -top-12 h-64 bg-gradient-to-b blur-3xl -z-10 opacity-60',
              hero.gradient,
            )}
          />
          <div className="flex items-center gap-2 mb-4">
            <span className={cn('relative flex h-2.5 w-2.5')}>
              {overall !== 'unknown' && overall !== 'operational' && (
                <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', dotColor[overall])} />
              )}
              <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', dotColor[overall])} />
            </span>
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              {statusLabel[overall]}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {hero.title}
          </h1>

          <p className="text-sm text-muted-foreground mt-3 max-w-xl">
            Monitoramento em tempo real do RCorp e das plataformas que o sustentam.
            {data && <> Última verificação <span className="text-foreground font-medium">{timeAgo(data.generated_at)}</span>.</>}
          </p>

          {error && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}
        </section>

        {/* Providers — lista limpa, sem cards pesados */}
        <section className="space-y-px rounded-xl border overflow-hidden bg-card">
          {(['rcorp', 'lovable', 'supabase'] as const).map((key) => (
            <ProviderRow
              key={key}
              provider={data?.providers[key]}
              loading={loading}
              placeholderLabel={defaultLabel(key)}
              extraContent={key === 'supabase' ? <SupabaseStatusAgentCard /> : undefined}
            />
          ))}
        </section>

        {/* Incidents — timeline minimalista */}
        <section>
          <SectionHeader
            title="Incidentes ativos"
            subtitle="Filtrados pelos serviços que impactam o RCorp"
            count={allIncidents.length}
          />
          {allIncidents.length === 0 && !loading ? (
            <EmptyState
              icon={<Sparkles className="h-4 w-4" />}
              title="Nada para reportar"
              description="Nenhum incidente relevante nas últimas 24h."
            />
          ) : (
            <div className="space-y-3">
              {allIncidents.map((inc) => (
                <IncidentRow key={inc.id} inc={inc} />
              ))}
            </div>
          )}
        </section>

        {/* Maintenance */}
        {allMaintenances.length > 0 && (
          <section>
            <SectionHeader
              title="Manutenções programadas"
              subtitle="Janelas anunciadas pelos provedores"
              icon={<Wrench className="h-3.5 w-3.5" />}
            />
            <div className="space-y-2">
              {allMaintenances.map((m) => (
                <div key={m.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-[10px] font-normal">{m.source}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.body && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {m.body.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-8 border-t text-center text-xs text-muted-foreground">
          Dados agregados de{' '}
          <a href="https://status.lovable.dev" target="_blank" rel="noreferrer" className="text-foreground hover:underline">
            Lovable
          </a>
          {' · '}
          <a href="https://status.supabase.com" target="_blank" rel="noreferrer" className="text-foreground hover:underline">
            Supabase
          </a>
          {' · ping direto no backend RCorp'}
        </footer>
      </main>
    </div>
  );
}

function defaultLabel(key: 'rcorp' | 'lovable' | 'supabase') {
  return key === 'rcorp' ? 'RCorp' : key === 'lovable' ? 'Lovable' : 'Supabase';
}

function ProviderRow({
  provider,
  loading,
  placeholderLabel,
  extraContent,
}: {
  provider?: Provider;
  loading: boolean;
  placeholderLabel: string;
  extraContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="px-5 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
          <span className="text-sm font-medium">{placeholderLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground">Verificando…</span>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="px-5 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
          <span className="text-sm font-medium">{placeholderLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground">Indisponível</span>
      </div>
    );
  }

  const status = provider.overall;
  const allOk = status === 'operational';

  return (
    <div className="bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {!allOk && status !== 'unknown' && (
              <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', dotColor[status])} />
            )}
            <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', dotColor[status])} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{provider.label}</div>
            <div className="text-xs text-muted-foreground truncate">{provider.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{statusLabel[status]}</span>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 -mt-1 space-y-1 border-t border-border/40 pt-3">
          {provider.components.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sem componentes detalhados.</p>
          ) : (
            provider.components.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor[c.status])} />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {c.description ?? statusLabel[c.status]}
                </span>
              </div>
            ))
          )}
          {provider.provider !== 'rcorp' && (
            <a
              href={provider.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground pt-2"
            >
              Ver página oficial <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {provider.error && (
            <p className="text-[11px] text-destructive pt-2">⚠ {provider.error}</p>
          )}
          {extraContent && <div className="pt-4">{extraContent}</div>}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
  icon,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
              {count}
            </span>
          )}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-card px-6 py-10 text-center">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function IncidentRow({ inc }: { inc: Incident & { source: string } }) {
  const impactColor =
    inc.impact === 'critical' ? 'bg-red-500'
    : inc.impact === 'major' ? 'bg-orange-500'
    : inc.impact === 'minor' ? 'bg-amber-500'
    : 'bg-muted-foreground/40';

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', impactColor)} />
            <Badge variant="secondary" className="text-[10px] font-normal">{inc.source}</Badge>
            <span className="text-[11px] text-muted-foreground capitalize">
              {inc.status.replace(/_/g, ' ')} · {inc.impact}
            </span>
          </div>
          <h3 className="text-sm font-medium leading-snug">{inc.name}</h3>
          {inc.body && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
              {inc.body.replace(/<[^>]+>/g, '')}
            </p>
          )}
          {inc.affected_components && inc.affected_components.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Afetados: <span className="text-foreground/80">{inc.affected_components.join(', ')}</span>
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Atualizado {timeAgo(inc.updated_at)}
          </p>
        </div>
        {inc.shortlink && (
          <a
            href={inc.shortlink}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0 p-1"
            aria-label="Abrir incidente"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
