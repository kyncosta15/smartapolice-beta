import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw,
  ArrowLeft, ExternalLink, Clock, ShieldAlert, Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

const statusMeta: Record<NormalizedStatus, { label: string; icon: typeof CheckCircle2; tone: string; ring: string; chip: string }> = {
  operational: {
    label: 'Operacional',
    icon: CheckCircle2,
    tone: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-500/30 bg-emerald-500/5',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  degraded: {
    label: 'Degradado',
    icon: AlertTriangle,
    tone: 'text-amber-600 dark:text-amber-400',
    ring: 'border-amber-500/30 bg-amber-500/5',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  major: {
    label: 'Interrupção parcial',
    icon: AlertTriangle,
    tone: 'text-orange-600 dark:text-orange-400',
    ring: 'border-orange-500/30 bg-orange-500/5',
    chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  critical: {
    label: 'Indisponível',
    icon: XCircle,
    tone: 'text-destructive',
    ring: 'border-destructive/30 bg-destructive/5',
    chip: 'bg-destructive/15 text-destructive',
  },
  unknown: {
    label: 'Desconhecido',
    icon: HelpCircle,
    tone: 'text-muted-foreground',
    ring: 'border-border bg-muted/30',
    chip: 'bg-muted text-muted-foreground',
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

export default function SystemStatusPage() {
  const [data, setData] = useState<AggregatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke('system-status-aggregator', {
        body: {},
      });
      if (err) throw err;
      setData(res as AggregatedResponse);
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao carregar status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const overall = data?.overall ?? 'unknown';
  const overallMeta = statusMeta[overall];
  const OverallIcon = overallMeta.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para RCorp
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Status do Sistema</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero — status geral */}
        <section
          className={cn(
            'rounded-2xl border p-6 sm:p-8 transition-colors',
            overallMeta.ring,
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn('rounded-full p-3 bg-background shadow-sm', overallMeta.tone)}>
              <OverallIcon className={cn('h-7 w-7', overall === 'unknown' && 'animate-pulse')} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {loading && !data ? 'Verificando…' : (
                  overall === 'operational'
                    ? 'Todos os sistemas operacionais'
                    : overall === 'degraded'
                    ? 'Sistema parcialmente degradado'
                    : overall === 'major' || overall === 'critical'
                    ? 'Há serviços indisponíveis'
                    : 'Status indeterminado'
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento em tempo real de Lovable, Supabase e backend RCorp.
                {data && (
                  <> Atualizado <span className="font-medium">{timeAgo(data.generated_at)}</span>.</>
                )}
              </p>
              {data && data.total_incidents > 0 && (
                <Badge variant="outline" className="mt-3">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {data.total_incidents} incidente(s) relevante(s) ativo(s)
                </Badge>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Cards por provedor */}
        <section className="grid gap-4 md:grid-cols-3">
          {loading && !data
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            : data && (['rcorp', 'lovable', 'supabase'] as const).map((key) => (
                <ProviderCard key={key} provider={data.providers[key]} />
              ))}
        </section>

        {/* Incidentes ativos */}
        {data && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Incidentes ativos relacionados
            </h2>
            <IncidentsList providers={data.providers} />
          </section>
        )}

        {/* Manutenções programadas */}
        {data && <ScheduledList providers={data.providers} />}

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Os dados são agregados em tempo real a partir de{' '}
          <a href="https://status.lovable.dev" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            status.lovable.dev
          </a>{' '}
          e{' '}
          <a href="https://status.supabase.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            status.supabase.com
          </a>
          , com filtro inteligente focado em serviços que impactam o RCorp.
        </footer>
      </main>
    </div>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const meta = statusMeta[provider.overall];
  const Icon = meta.icon;
  return (
    <Card className={cn('border-2 transition-colors', meta.ring)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className={cn('h-4 w-4', meta.tone)} />
              {provider.label}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{provider.description}</CardDescription>
          </div>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide', meta.chip)}>
            {meta.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1.5">
        {provider.components.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sem componentes detalhados</p>
        ) : (
          provider.components.slice(0, 6).map((c) => {
            const cm = statusMeta[c.status];
            const CIcon = cm.icon;
            return (
              <div key={c.name} className="flex items-center justify-between text-xs gap-2">
                <span className="truncate">{c.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.description && <span className="text-muted-foreground tabular-nums">{c.description}</span>}
                  <CIcon className={cn('h-3.5 w-3.5', cm.tone)} />
                </div>
              </div>
            );
          })
        )}
        {provider.components.length > 6 && (
          <p className="text-[11px] text-muted-foreground pt-1">
            +{provider.components.length - 6} outros componentes
          </p>
        )}
        {provider.provider !== 'rcorp' && (
          <a
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground pt-2"
          >
            Página oficial <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {provider.error && (
          <p className="text-[11px] text-destructive pt-1">⚠ {provider.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentsList({ providers }: { providers: AggregatedResponse['providers'] }) {
  const all = [
    ...providers.lovable.incidents.map((i) => ({ ...i, source: providers.lovable.label })),
    ...providers.supabase.incidents.map((i) => ({ ...i, source: providers.supabase.label })),
    ...providers.rcorp.incidents.map((i) => ({ ...i, source: providers.rcorp.label })),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  if (all.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
          Nenhum incidente relevante no momento.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {all.map((inc) => (
        <Card key={inc.id}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{inc.source}</Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] capitalize',
                      inc.impact === 'critical' && 'border-destructive text-destructive',
                      inc.impact === 'major' && 'border-orange-500 text-orange-600',
                      inc.impact === 'minor' && 'border-amber-500 text-amber-600',
                    )}
                  >
                    {inc.impact}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{inc.status.replace(/_/g, ' ')}</span>
                </div>
                <h3 className="font-medium text-sm mt-1.5">{inc.name}</h3>
                {inc.body && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{inc.body.replace(/<[^>]+>/g, '')}</p>
                )}
                {inc.affected_components && inc.affected_components.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    <span className="font-medium">Afetados:</span> {inc.affected_components.join(', ')}
                  </p>
                )}
              </div>
              {inc.shortlink && (
                <a
                  href={inc.shortlink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Abrir incidente"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Atualizado {timeAgo(inc.updated_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScheduledList({ providers }: { providers: AggregatedResponse['providers'] }) {
  const all = [
    ...providers.lovable.scheduled_maintenances.map((i) => ({ ...i, source: providers.lovable.label })),
    ...providers.supabase.scheduled_maintenances.map((i) => ({ ...i, source: providers.supabase.label })),
  ];
  if (all.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-blue-500" />
        Manutenções programadas
      </h2>
      <div className="space-y-2">
        {all.map((m) => (
          <Card key={m.id}>
            <CardContent className="py-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">{m.source}</Badge>
                <span className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
              </div>
              <p className="text-sm font-medium">{m.name}</p>
              {m.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.body.replace(/<[^>]+>/g, '')}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
