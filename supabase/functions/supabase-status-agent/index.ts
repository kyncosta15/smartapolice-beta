// Agente que consulta status.supabase.com/api/v2/incidents/unresolved.json
// e devolve uma interpretação em português, pronta pra UI consumir.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const ENDPOINT = 'https://status.supabase.com/api/v2/incidents/unresolved.json';
const FETCH_TIMEOUT_MS = 8000;

type Severity = 'none' | 'minor' | 'major' | 'critical';

interface AffectedComponent {
  code: string;
  name: string;
  old_status: string;
  new_status: string;
}

interface IncidentUpdate {
  id: string;
  status: string;
  body: string;
  created_at: string;
  affected_components?: AffectedComponent[];
}

interface RawIncident {
  id: string;
  name: string;
  status: string;
  impact: 'none' | 'minor' | 'major' | 'critical';
  created_at: string;
  updated_at: string;
  started_at: string;
  shortlink?: string;
  incident_updates: IncidentUpdate[];
}

interface InterpretedIncident {
  id: string;
  titulo: string;
  status_original: string;
  status_pt: string;
  impacto_pt: string;
  severidade: Severity;
  iniciado_em: string;
  atualizado_em: string;
  duracao_humana: string;
  ultima_atualizacao: string;
  componentes_afetados: string[];
  link: string;
  // Análise em linguagem natural feita pelo agente:
  resumo_pt: string;
  acao_recomendada: string;
}

const STATUS_PT: Record<string, string> = {
  investigating: 'Investigando',
  identified: 'Causa identificada',
  monitoring: 'Monitorando correção',
  resolved: 'Resolvido',
  scheduled: 'Programado',
  in_progress: 'Em andamento',
  verifying: 'Verificando',
  completed: 'Concluído',
};

const IMPACT_PT: Record<string, string> = {
  none: 'Sem impacto',
  minor: 'Impacto baixo',
  major: 'Impacto alto',
  critical: 'Crítico',
};

const SEVERITY_RANK: Record<Severity, number> = {
  none: 0,
  minor: 1,
  major: 2,
  critical: 3,
};

function fmtDuration(fromIso: string): string {
  const ms = Date.now() - new Date(fromIso).getTime();
  if (ms < 60_000) return 'menos de 1 min';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const restMin = mins % 60;
  if (hrs < 24) return restMin ? `${hrs}h ${restMin}min` : `${hrs}h`;
  const dias = Math.floor(hrs / 24);
  const restHrs = hrs % 24;
  return restHrs ? `${dias}d ${restHrs}h` : `${dias}d`;
}

function stripHtml(s: string): string {
  return (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Heurística: descobre o que de fato impacta um app que usa Auth/DB/Edge/Storage/Realtime/API. */
const RELEVANT_COMPONENTS = [
  'auth', 'database', 'edge function', 'storage', 'realtime', 'api gateway', 'rest', 'dashboard',
];

function isRelevantForApp(componentes: string[]): boolean {
  if (componentes.length === 0) return false;
  const joined = componentes.join(' ').toLowerCase();
  return RELEVANT_COMPONENTS.some((k) => joined.includes(k));
}

/** Gera resumo em PT-BR e ação recomendada com base no incidente. */
function interpretarIncidente(inc: RawIncident): InterpretedIncident {
  const ultima = inc.incident_updates?.[0];
  const componentes = Array.from(
    new Set((ultima?.affected_components ?? []).map((c) => c.name)),
  );

  const status_pt = STATUS_PT[inc.status] ?? inc.status;
  const impacto_pt = IMPACT_PT[inc.impact] ?? inc.impact;
  const duracao = fmtDuration(inc.started_at ?? inc.created_at);
  const ultimaMsg = stripHtml(ultima?.body ?? '');

  // ---------- Resumo ----------
  let resumo: string;
  if (inc.status === 'monitoring') {
    resumo = `O Supabase aplicou uma correção e está monitorando. Os serviços afetados (${componentes.join(', ') || 'n/d'}) já devem estar voltando ao normal.`;
  } else if (inc.status === 'identified') {
    resumo = `A causa foi identificada e o time do Supabase está aplicando a correção. Impacto em ${componentes.join(', ') || 'serviços diversos'} há ${duracao}.`;
  } else if (inc.status === 'investigating') {
    resumo = `O Supabase ainda está investigando. Há ${duracao} de incidente afetando ${componentes.join(', ') || 'serviços diversos'}.`;
  } else if (inc.status === 'resolved') {
    resumo = `Incidente já marcado como resolvido pelo Supabase.`;
  } else {
    resumo = `Status: ${status_pt}. Componentes envolvidos: ${componentes.join(', ') || 'n/d'}.`;
  }

  // anexa um trecho da última nota (até 220 chars) p/ contexto
  if (ultimaMsg) {
    const trecho = ultimaMsg.length > 220 ? ultimaMsg.slice(0, 217) + '…' : ultimaMsg;
    resumo += ` Última nota: "${trecho}"`;
  }

  // ---------- Ação recomendada ----------
  let acao: string;
  const relevante = isRelevantForApp(componentes);

  if (!relevante && inc.impact !== 'critical') {
    acao = 'Nenhuma ação necessária — esse incidente não afeta diretamente o RCorp.';
  } else if (inc.impact === 'critical') {
    acao = 'Falhas intermitentes esperadas. Evite operações em massa (uploads, sincronizações) até o status virar "Monitorando" ou "Resolvido".';
  } else if (inc.impact === 'major') {
    acao = 'Pode haver lentidão ou erros esporádicos no login, banco e funções. Tente novamente em alguns minutos se algo falhar.';
  } else if (inc.impact === 'minor') {
    acao = 'Impacto pequeno. Operação normal, mas registre qualquer comportamento estranho.';
  } else {
    acao = 'Acompanhar atualizações.';
  }

  return {
    id: inc.id,
    titulo: inc.name,
    status_original: inc.status,
    status_pt,
    impacto_pt,
    severidade: inc.impact,
    iniciado_em: inc.started_at ?? inc.created_at,
    atualizado_em: inc.updated_at,
    duracao_humana: duracao,
    ultima_atualizacao: ultima?.created_at ?? inc.updated_at,
    componentes_afetados: componentes,
    link: inc.shortlink ?? 'https://status.supabase.com',
    resumo_pt: resumo,
    acao_recomendada: acao,
  };
}

async function fetchUnresolved(): Promise<RawIncident[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'RCorp-Supabase-Status-Agent/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.incidents ?? []) as RawIncident[];
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const inicio = Date.now();
  try {
    const incidents = await fetchUnresolved();
    const interpretados = incidents.map(interpretarIncidente);

    // Severidade global = pior severidade encontrada
    const piorSeveridade: Severity = interpretados.reduce<Severity>((acc, inc) => {
      return SEVERITY_RANK[inc.severidade] > SEVERITY_RANK[acc] ? inc.severidade : acc;
    }, 'none');

    // Diagnóstico geral em PT-BR
    let diagnostico_geral: string;
    if (interpretados.length === 0) {
      diagnostico_geral = 'Nenhum incidente em aberto no Supabase no momento. Tudo certo do lado deles.';
    } else if (piorSeveridade === 'critical') {
      diagnostico_geral = `Há ${interpretados.length} incidente(s) ativo(s) no Supabase, sendo pelo menos um crítico. Operação pode ser instável.`;
    } else if (piorSeveridade === 'major') {
      diagnostico_geral = `Há ${interpretados.length} incidente(s) ativo(s) no Supabase com impacto alto. Espere lentidão ou falhas pontuais.`;
    } else if (piorSeveridade === 'minor') {
      diagnostico_geral = `Há ${interpretados.length} incidente(s) ativo(s) no Supabase com impacto baixo. Operação majoritariamente normal.`;
    } else {
      diagnostico_geral = `${interpretados.length} incidente(s) em aberto, mas sem impacto reportado.`;
    }

    return new Response(
      JSON.stringify({
        fonte: ENDPOINT,
        verificado_em: new Date().toISOString(),
        latencia_ms: Date.now() - inicio,
        total_incidentes: interpretados.length,
        severidade_global: piorSeveridade,
        diagnostico_geral,
        incidentes: interpretados,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        fonte: ENDPOINT,
        verificado_em: new Date().toISOString(),
        erro: err?.name === 'AbortError' ? 'Timeout ao consultar Supabase' : (err?.message ?? 'Erro desconhecido'),
        diagnostico_geral: 'Não foi possível consultar o status do Supabase agora.',
        total_incidentes: 0,
        severidade_global: 'none' as Severity,
        incidentes: [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
