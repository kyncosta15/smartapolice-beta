import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIPE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGZmNDQxMi0zNjEyLTQwMTUtOTdmMC04NGJmY2NjYjE1MTEiLCJlbWFpbCI6InRoaWFnb25jb3N0YTE1QGdtYWlsLmNvbSIsImlhdCI6MTc2MDQ0OTcyOX0.VFFyeQceP1H5bxgGYUKtUR5diRVMwZ-6Ate9TAiGDsQ";

type Item = {
  id: string;
  codigo_fipe: string;
  categoria?: string;
  ano_modelo?: number;
};

type BatchInputs = {
  mode?: "query" | "list";
  offset?: number;
  limit?: number;
  filter?: { onlyMissingPrice?: boolean };
  list?: Item[];
  reference?: number | null;
  concurrency?: number;
  pageSize?: number;
  maxRetries?: number;
  delayMs?: number;
  dryRun?: boolean;
  empresa_id?: string;
  vehicle_ids?: string[];
};

function mapCategoryToVehicleType(cat?: string): "cars" | "motorcycles" | "trucks" {
  if (!cat) return "cars";
  const c = cat.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  
  if (c.includes("caminh")) return "trucks";
  if (c.includes("moto")) return "motorcycles";
  if (c.includes("passeio") || c.includes("utilit")) return "cars";
  
  return "cars";
}

function toYearId(y?: string | number): string | null {
  if (!y && y !== 0) return null;
  const s = String(y).trim();
  if (/^\d{4}$/.test(s)) return `${s}-0`;
  if (/^\d{4}-\d$/.test(s)) return s;
  return null;
}

function brlToNumber(v?: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callFipe(
  { vehicleType, fipeCode, yearId, reference }:
  { vehicleType: string; fipeCode: string; yearId: string; reference?: number | null },
  attempt = 0,
  maxRetries = 2
) {
  const qs = typeof reference === "number" ? `?reference=${reference}` : "";
  const url = `https://fipe.parallelum.com.br/api/v2/${vehicleType}/${encodeURIComponent(fipeCode)}/years/${encodeURIComponent(yearId)}${qs}`;
  
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Subscription-Token": FIPE_TOKEN
    }
  });

  if (!res.ok) {
    if (res.status >= 500 && attempt < maxRetries) {
      await sleep(200 * Math.pow(3, attempt));
      return callFipe({ vehicleType, fipeCode, yearId, reference }, attempt + 1, maxRetries);
    }
    throw new Error(`FIPE ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputs: BatchInputs = await req.json();
    
    const {
      mode = "query",
      offset = 0,
      limit = 200,
      filter,
      list = [],
      reference = null,
      concurrency = 5,
      pageSize = 50,
      maxRetries = 2,
      delayMs = 200,
      dryRun = false,
      empresa_id,
      vehicle_ids
    } = inputs;

    console.log('Starting FIPE batch update', { mode, offset, limit, empresa_id, vehicle_ids });

    let items: Item[] = [];

    if (mode === "list") {
      items = list.filter(i => i?.codigo_fipe);
    } else {
      let query = supabase
        .from('frota_veiculos')
        .select('id, codigo_fipe, categoria, ano_modelo, preco_fipe')
        .not('codigo_fipe', 'is', null)
        .not('ano_modelo', 'is', null)
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

      if (empresa_id) {
        query = query.eq('empresa_id', empresa_id);
      }

      if (vehicle_ids && vehicle_ids.length > 0) {
        query = query.in('id', vehicle_ids);
      }

      if (filter?.onlyMissingPrice) {
        query = query.is('preco_fipe', null);
      }

      const { data, error } = await query;
      if (error) throw new Error(`DB query error: ${error.message}`);

      items = (data || []).map((r: any) => ({
        id: r.id,
        codigo_fipe: r.codigo_fipe,
        categoria: r.categoria,
        ano_modelo: r.ano_modelo
      }));
    }

    console.log(`Found ${items.length} vehicles to process`);

    const chunks: Item[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
      chunks.push(items.slice(i, i + pageSize));
    }

    let processed = 0, success = 0, fail = 0, skipped = 0;
    const errors: Array<{ id: any; reason: string }> = [];
    const updatedSample: any[] = [];

    for (const chunk of chunks) {
      let cursor = 0;

      const worker = async () => {
        while (cursor < chunk.length) {
          const item = chunk[cursor++];

          try {
            const vehicleType = mapCategoryToVehicleType(item.categoria);
            const yearId = toYearId(item.ano_modelo);
            
            if (!yearId) {
              skipped++;
              errors.push({ id: item.id, reason: "Ano ausente/inválido" });
              continue;
            }

            await sleep(delayMs);

            const body = await callFipe(
              { 
                vehicleType, 
                fipeCode: item.codigo_fipe, 
                yearId, 
                reference 
              }, 
              0, 
              maxRetries
            );

            const priceFormatted = body?.price ?? null;
            const priceNumber = brlToNumber(priceFormatted);
            
            const payload: any = {
              preco_fipe: priceFormatted,
              marca: body?.brand ?? null,
              modelo: body?.model ?? null,
              combustivel: body?.fuel ?? null,
              ano_modelo: body?.modelYear ?? item.ano_modelo,
              updated_at: new Date().toISOString()
            };

            if (!dryRun) {
              const { error: upErr } = await supabase
                .from('frota_veiculos')
                .update(payload)
                .eq('id', item.id);
              
              if (upErr) throw new Error(`DB update error: ${upErr.message}`);
            }

            if (updatedSample.length < 5) {
              updatedSample.push({ id: item.id, preco_fipe: priceFormatted, priceNumber });
            }
            
            success++;
            processed++;
            
          } catch (e: any) {
            fail++;
            processed++;
            errors.push({ id: item.id, reason: String(e?.message || e) });
            console.error(`Error processing vehicle ${item.id}:`, e);
          }
        }
      };

      const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
      await Promise.all(workers);
    }

    const result = {
      ok: true,
      input: { mode, offset, limit, reference, concurrency, pageSize, dryRun },
      stats: { total: items.length, processed, success, fail, skipped },
      updatedSample,
      errors: errors.slice(0, 10)
    };

    console.log('Batch update completed', result.stats);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in refresh-fipe-batch:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
