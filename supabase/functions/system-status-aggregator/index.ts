// Agrega status de Lovable, Supabase e do próprio backend RCorp.
// Faz scraping leve dos endpoints públicos `summary.json` das páginas Statuspage.io
// (padrão usado por status.lovable.dev e status.supabase.com).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const FETCH_TIMEOUT_MS = 8000;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://jhvbfvqhuemuvwgqpskz.supabase.co';

/** Status normalizado, hierarquia: operational < degraded < major < critical */
type NormalizedStatus = 'operational' | 'degraded' | 'major' | 'critical' | 'unknown';

interface ProviderComponent {
  name: string;
  status: NormalizedStatus;
  description?: string;
}

interface ProviderIncident {
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

interface ProviderResult {
  provider: 'lovable' | 'supabase' | 'rcorp';
  label: string;
  url: string;
  overall: NormalizedStatus;
  description: string;
  components: ProviderComponent[];
  incidents: ProviderIncident[];
  scheduled_maintenances: ProviderIncident[];
  fetched_at: string;
  error?: string;
}

/** Mapeia indicator do Statuspage para o nosso status normalizado */
function mapStatuspageIndicator(indicator?: string): NormalizedStatus {
  switch (indicator) {
    case 'none': return 'operational';
    case 'minor': return 'degraded';
    case 'major': return 'major';
    case 'critical': return 'critical';
    default: return 'unknown';
  }
}

/** Mapeia status de componente do Statuspage */
function mapComponentStatus(status?: string): NormalizedStatus {
  switch (status) {
    case 'operational': return 'operational';
    case 'degraded_performance': return 'degraded';
    case 'partial_outage': return 'major';
    case 'major_outage': return 'critical';
    case 'under_maintenance': return 'degraded';
    default: return 'unknown';
  }
}

async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'RCorp-Status-Aggregator/1.0' },
    });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Filtra incidents/maintenances mantendo apenas o que é relevante para um app
 * que consome Lovable Cloud + Supabase (auth, db, edge functions, storage, realtime, dashboard, deploy).
 */
const RELEVANT_KEYWORDS = [
  'auth', 'authentication', 'database', 'postgres', 'edge function', 'edge functions',
  'storage', 'realtime', 'api', 'dashboard', 'deploy', 'deployment', 'preview',
  'cdn', 'gateway', 'project', 'login', 'rest', 'pooler', 'connection',
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return RELEVANT_KEYWORDS.some((k) => lower.includes(k));
}

function filterIncidents(incidents: any[]): ProviderIncident[] {
  return incidents
    .map((inc): ProviderIncident => {
      const components: string[] = (inc.components ?? []).map((c: any) => c.name);
      const lastUpdate = inc.incident_updates?.[0]?.body ?? '';
      return {
        id: inc.id,
        name: inc.name,
        status: inc.status,
        impact: inc.impact,
        created_at: inc.created_at,
        updated_at: inc.updated_at,
        shortlink: inc.shortlink,
        body: lastUpdate,
        affected_components: components,
      };
    })
    .filter((inc) => {
      // Sempre inclui se tiver impacto crítico/maior
      if (inc.impact === 'critical' || inc.impact === 'major') return true;
      // Caso contrário, exige relevância textual
      const haystack = [inc.name, inc.body ?? '', ...(inc.affected_components ?? [])].join(' ');
      return isRelevant(haystack);
    });
}

async function fetchStatuspage(
  provider: 'lovable' | 'supabase',
  label: string,
  baseUrl: string,
): Promise<ProviderResult> {
  const fetched_at = new Date().toISOString();
  try {
    const res = await fetchWithTimeout(`${baseUrl}/api/v2/summary.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const overall = mapStatuspageIndicator(data?.status?.indicator);
    const description: string = data?.status?.description ?? 'Sem informação';

    const components: ProviderComponent[] = (data?.components ?? [])
      .filter((c: any) => !c.group && c.showcase !== false)
      .map((c: any) => ({
        name: c.name,
        status: mapComponentStatus(c.status),
        description: c.description ?? undefined,
      }));

    const incidents = filterIncidents(data?.incidents ?? []);
    const scheduled_maintenances = filterIncidents(data?.scheduled_maintenances ?? []);

    return {
      provider,
      label,
      url: baseUrl,
      overall,
      description,
      components,
      incidents,
      scheduled_maintenances,
      fetched_at,
    };
  } catch (err: any) {
    return {
      provider,
      label,
      url: baseUrl,
      overall: 'unknown',
      description: 'Não foi possível consultar o status',
      components: [],
      incidents: [],
      scheduled_maintenances: [],
      fetched_at,
      error: err?.message ?? 'erro desconhecido',
    };
  }
}

/** Ping interno: auth health + edge function leve */
async function pingRcorp(): Promise<ProviderResult> {
  const fetched_at = new Date().toISOString();
  const components: ProviderComponent[] = [];
  const incidents: ProviderIncident[] = [];

  // 1) Auth health
  const authStart = performance.now();
  try {
    const r = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/health`, 5000);
    const ms = Math.round(performance.now() - authStart);
    components.push({
      name: 'Autenticação',
      status: r.ok ? (ms > 2500 ? 'degraded' : 'operational') : 'major',
      description: r.ok ? `${ms}ms` : `HTTP ${r.status}`,
    });
  } catch (err: any) {
    components.push({
      name: 'Autenticação',
      status: 'critical',
      description: err?.name === 'AbortError' ? 'Timeout' : 'Inacessível',
    });
  }

  // 2) Edge runtime via health-ping
  const edgeStart = performance.now();
  try {
    const r = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/health-ping`, 5000);
    const ms = Math.round(performance.now() - edgeStart);
    components.push({
      name: 'Funções do Servidor',
      status: r.ok ? (ms > 2500 ? 'degraded' : 'operational') : 'major',
      description: r.ok ? `${ms}ms` : `HTTP ${r.status}`,
    });
  } catch (err: any) {
    components.push({
      name: 'Funções do Servidor',
      status: 'critical',
      description: err?.name === 'AbortError' ? 'Timeout' : 'Inacessível',
    });
  }

  // 3) REST/PostgREST
  const restStart = performance.now();
  try {
    const r = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/`, 5000);
    const ms = Math.round(performance.now() - restStart);
    components.push({
      name: 'API / Banco de Dados',
      status: r.ok || r.status === 401 ? (ms > 2500 ? 'degraded' : 'operational') : 'major',
      description: `${ms}ms`,
    });
  } catch (err: any) {
    components.push({
      name: 'API / Banco de Dados',
      status: 'critical',
      description: err?.name === 'AbortError' ? 'Timeout' : 'Inacessível',
    });
  }

  // overall = pior dos componentes
  const order: NormalizedStatus[] = ['critical', 'major', 'degraded', 'operational', 'unknown'];
  const overall = order.find((s) => components.some((c) => c.status === s)) ?? 'unknown';
  const description = overall === 'operational'
    ? 'Todos os sistemas RCorp operacionais'
    : overall === 'degraded'
    ? 'Operação parcialmente degradada'
    : overall === 'major' || overall === 'critical'
    ? 'Há serviços indisponíveis'
    : 'Status desconhecido';

  return {
    provider: 'rcorp',
    label: 'RCorp (esta aplicação)',
    url: SUPABASE_URL,
    overall,
    description,
    components,
    incidents,
    scheduled_maintenances: [],
    fetched_at,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const [lovable, supabaseStatus, rcorp] = await Promise.all([
      fetchStatuspage('lovable', 'Lovable', 'https://status.lovable.dev'),
      fetchStatuspage('supabase', 'Supabase', 'https://status.supabase.com'),
      pingRcorp(),
    ]);

    // Agregado global
    const order: NormalizedStatus[] = ['critical', 'major', 'degraded', 'operational', 'unknown'];
    const overall = order.find((s) =>
      [lovable.overall, supabaseStatus.overall, rcorp.overall].includes(s),
    ) ?? 'unknown';

    const totalIncidents =
      lovable.incidents.length + supabaseStatus.incidents.length + rcorp.incidents.length;

    return new Response(
      JSON.stringify({
        overall,
        total_incidents: totalIncidents,
        providers: { lovable, supabase: supabaseStatus, rcorp },
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? 'erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
