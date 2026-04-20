import { useEffect, useState, useCallback, useRef } from 'react';
import { Bot, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type Severidade = 'none' | 'minor' | 'major' | 'critical';
type Lang = 'pt' | 'en';

interface AffectedComponent {
  name: string;
}

interface IncidentUpdate {
  body: string;
  affected_components?: AffectedComponent[];
  created_at: string;
}

interface RawIncident {
  id: string;
  name: string;
  status: string;
  impact: Severidade;
  created_at: string;
  updated_at: string;
  started_at: string;
  shortlink?: string;
  incident_updates: IncidentUpdate[];
}

interface IncidenteInterpretado {
  id: string;
  titulo: string;
  status_label: string;
  impacto_label: string;
  severidade: Severidade;
  duracao_humana: string;
  componentes_afetados: string[];
  link: string;
  resumo: string;
  acao_recomendada: string;
  ultima_nota: string;
}

interface AgentResponse {
  fonte: string;
  verificado_em: string;
  latencia_ms?: number;
  total_incidentes: number;
  severidade_global: Severidade;
  diagnostico_geral: string;
  incidentes: IncidenteInterpretado[];
}

const ENDPOINT = 'https://status.supabase.com/api/v2/incidents/unresolved.json';

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

const SEVERITY_RANK: Record<Severidade, number> = {
  none: 0,
  minor: 1,
  major: 2,
  critical: 3,
};

// ---------------- i18n ----------------

const STATUS_MAP: Record<Lang, Record<string, string>> = {
  pt: {
    investigating: 'Investigando',
    identified: 'Causa identificada',
    monitoring: 'Monitorando correção',
    resolved: 'Resolvido',
    scheduled: 'Programado',
    in_progress: 'Em andamento',
    verifying: 'Verificando',
    completed: 'Concluído',
  },
  en: {
    investigating: 'Investigating',
    identified: 'Identified',
    monitoring: 'Monitoring',
    resolved: 'Resolved',
    scheduled: 'Scheduled',
    in_progress: 'In progress',
    verifying: 'Verifying',
    completed: 'Completed',
  },
};

const IMPACT_MAP: Record<Lang, Record<string, string>> = {
  pt: { none: 'Sem impacto', minor: 'Impacto baixo', major: 'Impacto alto', critical: 'Crítico' },
  en: { none: 'No impact', minor: 'Minor', major: 'Major', critical: 'Critical' },
};

const T = {
  pt: {
    title: 'Agente Supabase',
    refresh: 'Verificar',
    consulting: 'Consultando Supabase…',
    fetchError: 'Não foi possível consultar o agente:',
    verifiedNow: 'Verificado agora',
    source: 'fonte',
    none: 'Tudo ok',
    whatToDo: 'O que fazer:',
    officialDetails: 'Detalhes oficiais',
    ago: (d: string) => `há ${d}`,
    lastNote: 'Última nota',
    diag: {
      none: 'Nenhum incidente em aberto no Supabase no momento. Tudo certo do lado deles.',
      critical: (n: number) => `Há ${n} incidente(s) ativo(s) no Supabase, sendo pelo menos um crítico. Operação pode ser instável.`,
      major: (n: number) => `Há ${n} incidente(s) ativo(s) no Supabase com impacto alto. Espere lentidão ou falhas pontuais.`,
      minor: (n: number) => `Há ${n} incidente(s) ativo(s) no Supabase com impacto baixo.`,
    },
    summary: {
      identified: (c: string, d: string) => `A causa foi identificada e o time do Supabase está aplicando a correção. Impacto em ${c} há ${d}.`,
      investigating: (c: string, d: string) => `O Supabase ainda está investigando. Há ${d} de incidente afetando ${c}.`,
      monitoring: (c: string) => `O Supabase aplicou uma correção e está monitorando a recuperação dos serviços ${c}.`,
      generic: (s: string, i: string, c: string, d: string) => `Status ${s.toLowerCase()} no Supabase, com ${i.toLowerCase()} em ${c} há ${d}.`,
      diverseServices: 'serviços diversos',
    },
    actions: {
      majorOrCritical: 'Pode haver lentidão ou erros esporádicos no login, banco e funções. Tente novamente em alguns minutos se algo falhar.',
      minor: 'Impacto pequeno. Operação normal, mas vale observar eventuais instabilidades.',
      default: 'Acompanhar atualizações.',
    },
    duration: {
      lessThanMinute: 'menos de 1 min',
      min: (n: number) => `${n} min`,
      h: (h: number, m: number) => (m ? `${h}h ${m}min` : `${h}h`),
      d: (d: number, h: number) => (h ? `${d}d ${h}h` : `${d}d`),
    },
  },
  en: {
    title: 'Supabase Agent',
    refresh: 'Check',
    consulting: 'Querying Supabase…',
    fetchError: 'Could not query the agent:',
    verifiedNow: 'Just checked',
    source: 'source',
    none: 'All good',
    whatToDo: 'What to do:',
    officialDetails: 'Official details',
    ago: (d: string) => `${d} ago`,
    lastNote: 'Last note',
    diag: {
      none: 'No open incidents on Supabase right now. All clear on their side.',
      critical: (n: number) => `There are ${n} active incident(s) on Supabase, including at least one critical. Operations may be unstable.`,
      major: (n: number) => `There are ${n} active incident(s) on Supabase with major impact. Expect slowness or sporadic failures.`,
      minor: (n: number) => `There are ${n} active incident(s) on Supabase with minor impact.`,
    },
    summary: {
      identified: (c: string, d: string) => `The cause has been identified and Supabase's team is applying a fix. Impact on ${c} for ${d}.`,
      investigating: (c: string, d: string) => `Supabase is still investigating. Incident has been affecting ${c} for ${d}.`,
      monitoring: (c: string) => `Supabase applied a fix and is monitoring the recovery of ${c}.`,
      generic: (s: string, i: string, c: string, d: string) => `Status ${s.toLowerCase()} on Supabase, with ${i.toLowerCase()} on ${c} for ${d}.`,
      diverseServices: 'multiple services',
    },
    actions: {
      majorOrCritical: 'Sporadic errors or slowness may happen on login, database and functions. Retry in a few minutes if something fails.',
      minor: 'Minor impact. Operations should be normal, but watch for occasional instability.',
      default: 'Keep an eye on updates.',
    },
    duration: {
      lessThanMinute: 'less than 1 min',
      min: (n: number) => `${n} min`,
      h: (h: number, m: number) => (m ? `${h}h ${m}m` : `${h}h`),
      d: (d: number, h: number) => (h ? `${d}d ${h}h` : `${d}d`),
    },
  },
};

// ---------------- helpers ----------------

function fmtDuration(fromIso: string, lang: Lang): string {
  const t = T[lang].duration;
  const ms = Date.now() - new Date(fromIso).getTime();
  if (ms < 60_000) return t.lessThanMinute;
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return t.min(mins);
  const hrs = Math.floor(mins / 60);
  const restMin = mins % 60;
  if (hrs < 24) return t.h(hrs, restMin);
  const dias = Math.floor(hrs / 24);
  const restHrs = hrs % 24;
  return t.d(dias, restHrs);
}

function stripHtml(s: string): string {
  return (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function interpretarIncidente(inc: RawIncident, lang: Lang): IncidenteInterpretado {
  const ultima = inc.incident_updates?.[0];
  const componentes = Array.from(new Set((ultima?.affected_components ?? []).map((c) => c.name)));
  const status_label = STATUS_MAP[lang][inc.status] ?? inc.status;
  const impacto_label = IMPACT_MAP[lang][inc.impact] ?? inc.impact;
  const duracao = fmtDuration(inc.started_at ?? inc.created_at, lang);
  const ultimaMsg = stripHtml(ultima?.body ?? '');
  const tt = T[lang].summary;
  const componentesStr = componentes.join(', ') || tt.diverseServices;

  let resumo: string;
  if (inc.status === 'identified') resumo = tt.identified(componentesStr, duracao);
  else if (inc.status === 'investigating') resumo = tt.investigating(componentesStr, duracao);
  else if (inc.status === 'monitoring') resumo = tt.monitoring(componentesStr);
  else resumo = tt.generic(status_label, impacto_label, componentesStr, duracao);

  const trecho = ultimaMsg.length > 220 ? `${ultimaMsg.slice(0, 217)}…` : ultimaMsg;

  let acao = T[lang].actions.default;
  if (inc.impact === 'major' || inc.impact === 'critical') acao = T[lang].actions.majorOrCritical;
  else if (inc.impact === 'minor') acao = T[lang].actions.minor;

  return {
    id: inc.id,
    titulo: inc.name,
    status_label,
    impacto_label,
    severidade: inc.impact,
    duracao_humana: duracao,
    componentes_afetados: componentes,
    link: inc.shortlink ?? 'https://status.supabase.com',
    resumo,
    acao_recomendada: acao,
    ultima_nota: trecho,
  };
}

interface AgentEdgeIncident {
  id: string;
  titulo: string;
  status_original: string;
  status_pt: string;
  impacto_pt: string;
  severidade: Severidade;
  iniciado_em: string;
  atualizado_em: string;
  duracao_humana: string;
  ultima_atualizacao: string;
  componentes_afetados: string[];
  link: string;
  resumo_pt: string;
  acao_recomendada: string;
}

interface AgentEdgeResponse {
  fonte: string;
  verificado_em: string;
  latencia_ms?: number;
  total_incidentes: number;
  severidade_global: Severidade;
  diagnostico_geral: string;
  incidentes: AgentEdgeIncident[];
}

/** Quando lang=en, troca textos PT da edge function para EN usando os mesmos mapas locais. */
function localizeIncident(inc: AgentEdgeIncident, lang: Lang): IncidenteInterpretado {
  const status_label = lang === 'en'
    ? (STATUS_MAP.en[inc.status_original] ?? inc.status_pt)
    : inc.status_pt;
  const impacto_label = lang === 'en'
    ? (IMPACT_MAP.en[inc.severidade] ?? inc.impacto_pt)
    : inc.impacto_pt;

  // Recalcula duração no idioma certo
  const duracao = fmtDuration(inc.iniciado_em, lang);

  // Resumo: se EN, gera localmente; se PT, usa o que o agente trouxe
  let resumo = inc.resumo_pt;
  let ultima_nota = '';
  const noteMatch = inc.resumo_pt.match(/Última nota:\s*"([^"]+)"/);
  if (noteMatch) ultima_nota = noteMatch[1];

  if (lang === 'en') {
    const tt = T.en.summary;
    const componentesStr = inc.componentes_afetados.join(', ') || tt.diverseServices;
    if (inc.status_original === 'identified') resumo = tt.identified(componentesStr, duracao);
    else if (inc.status_original === 'investigating') resumo = tt.investigating(componentesStr, duracao);
    else if (inc.status_original === 'monitoring') resumo = tt.monitoring(componentesStr);
    else resumo = tt.generic(status_label, impacto_label, componentesStr, duracao);
  } else {
    // Em PT, remove o sufixo "Última nota: ..." pois exibimos separado no card
    resumo = resumo.replace(/\s*Última nota:\s*"[^"]+"\.?$/, '').trim();
  }

  // Ação recomendada: traduz quando EN
  let acao = inc.acao_recomendada;
  if (lang === 'en') {
    if (inc.severidade === 'major' || inc.severidade === 'critical') acao = T.en.actions.majorOrCritical;
    else if (inc.severidade === 'minor') acao = T.en.actions.minor;
    else acao = T.en.actions.default;
  }

  return {
    id: inc.id,
    titulo: inc.titulo,
    status_label,
    impacto_label,
    severidade: inc.severidade,
    duracao_humana: duracao,
    componentes_afetados: inc.componentes_afetados,
    link: inc.link,
    resumo,
    acao_recomendada: acao,
    ultima_nota,
  };
}

async function fetchAgent(signal: AbortSignal, lang: Lang): Promise<AgentResponse> {
  // Usa a Edge Function como proxy — evita CORS direto do status.supabase.com
  const started = performance.now();
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke<AgentEdgeResponse>(
    'supabase-status-agent',
    { body: {} },
  );

  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  if (edgeError) throw new Error(edgeError.message ?? 'Edge function error');
  if (!edgeData) throw new Error('Empty response');

  const incidentes = (edgeData.incidentes ?? []).map((inc) => localizeIncident(inc, lang));

  // Se idioma é PT, usa diagnóstico já pronto. Se EN, recalcula.
  let diagnostico_geral = edgeData.diagnostico_geral;
  if (lang === 'en') {
    const diag = T.en.diag;
    if (incidentes.length === 0) diagnostico_geral = diag.none;
    else if (edgeData.severidade_global === 'critical') diagnostico_geral = diag.critical(incidentes.length);
    else if (edgeData.severidade_global === 'major') diagnostico_geral = diag.major(incidentes.length);
    else if (edgeData.severidade_global === 'minor') diagnostico_geral = diag.minor(incidentes.length);
  }

  return {
    fonte: edgeData.fonte ?? ENDPOINT,
    verificado_em: edgeData.verificado_em ?? new Date().toISOString(),
    latencia_ms: edgeData.latencia_ms ?? Math.round(performance.now() - started),
    total_incidentes: incidentes.length,
    severidade_global: edgeData.severidade_global ?? 'none',
    diagnostico_geral,
    incidentes,
  };
}

// ---------------- component ----------------

const LANG_STORAGE_KEY = 'rcorp:status-agent:lang';

export function SupabaseStatusAgentCard() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'pt';
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'pt';
  });
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const t = T[lang];

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12_000);

    setLoading(true);
    setError(null);
    try {
      const json = await fetchAgent(controller.signal, lang);
      setData(json);
    } catch (e: any) {
      setError(e?.name === 'AbortError' ? 'Timeout (12s)' : (e?.message ?? 'Failed'));
      setData(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const changeLang = (next: Lang) => {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const sev = data?.total_incidentes === 0 ? 'none' : (data?.severidade_global ?? 'none');
  const semIncidentes = !loading && data && data.total_incidentes === 0;

  return (
    <section>
      <div className="flex items-end justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            {t.title}
            {data && data.total_incidentes > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                {data.total_incidentes}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Language switcher */}
          <div className="inline-flex items-center rounded-md border bg-card p-0.5">
            <button
              type="button"
              onClick={() => changeLang('pt')}
              className={cn(
                'px-2 py-1 rounded text-base leading-none transition-colors',
                lang === 'pt' ? 'bg-muted' : 'opacity-50 hover:opacity-100',
              )}
              aria-label="Português"
              aria-pressed={lang === 'pt'}
              title="Português"
            >
              🇧🇷
            </button>
            <button
              type="button"
              onClick={() => changeLang('en')}
              className={cn(
                'px-2 py-1 rounded text-base leading-none transition-colors',
                lang === 'en' ? 'bg-muted' : 'opacity-50 hover:opacity-100',
              )}
              aria-label="English"
              aria-pressed={lang === 'en'}
              title="English"
            >
              🇺🇸
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span className="ml-1.5 hidden sm:inline">{t.refresh}</span>
          </Button>
        </div>
      </div>

      <div className={cn('rounded-xl border bg-gradient-to-br p-5', sevBg[sev])}>
        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t.consulting}
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t.fetchError} {error}</span>
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
                  {data.total_incidentes === 0 ? t.none : data.diagnostico_geral}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {t.verifiedNow}
                  {typeof data.latencia_ms === 'number' && <> · {data.latencia_ms}ms</>}
                  {' · '}
                  <a href={ENDPOINT} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-0.5">
                    {t.source} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </div>
            </div>

            {semIncidentes && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.none}
              </div>
            )}

            {data.incidentes.length > 0 && (
              <div className="mt-5 space-y-3">
                {data.incidentes.map((inc) => (
                  <div key={inc.id} className="rounded-lg border bg-background/60 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', sevColor[inc.severidade])} />
                      <span className="text-sm font-medium">{inc.titulo}</span>
                      <Badge variant="secondary" className="text-[10px] font-normal">{inc.status_label}</Badge>
                      <Badge variant="outline" className="text-[10px] font-normal">{inc.impacto_label}</Badge>
                      <span className="text-[11px] text-muted-foreground">{t.ago(inc.duracao_humana)}</span>
                    </div>

                    {inc.componentes_afetados.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {inc.componentes_afetados.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-foreground/80 leading-relaxed">{inc.resumo}</p>

                    {inc.ultima_nota && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                        <span className="font-medium not-italic">{t.lastNote}:</span> "{inc.ultima_nota}"
                      </p>
                    )}

                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span><span className="font-medium text-foreground/70">{t.whatToDo}</span> {inc.acao_recomendada}</span>
                    </div>

                    <a href={inc.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-2">
                      {t.officialDetails} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
