import { supabase } from '@/integrations/supabase/client';

export type Fuel = "Gasolina" | "Álcool" | "Etanol" | "Flex" | "Diesel" | string;

interface TabelaReferencia {
  Codigo: number;
  Mes: string;
}

interface Marca {
  Label: string;
  Value: string;
}

interface Modelo {
  Label: string;
  Value: number;
}

interface ModelosResponse {
  Modelos: Modelo[];
}

interface AnoModelo {
  Label: string;
  Value: string;
}

interface ValorFIPE {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

interface FIPEConsultaResult {
  valor: ValorFIPE;
  fuelCode: number;
  anoValue: string;
  marca: Marca;
  modelo: Modelo;
  tabelaRef: number;
}

// Rate limiting
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
let lastRequestTime = 0;
const MIN_DELAY_MS = 300;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - timeSinceLastRequest));
    }
    
    const request = requestQueue.shift();
    if (request) {
      try {
        lastRequestTime = Date.now();
        await request();
      } catch (error) {
        console.error('Erro processando requisição FIPE:', error);
      }
    }
  }
  
  isProcessing = false;
}

async function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

async function postFIPE<T>(path: string, body: any, retries = 2): Promise<T> {
  return queueRequest(async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(`http://veiculos.fipe.org.br/api/veiculos/${path}`, {
          method: "POST",
          headers: {
            "Host": "veiculos.fipe.org.br",
            "Referer": "http://veiculos.fipe.org.br",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          if (res.status === 429 || res.status === 403) {
            throw new Error('RATE_LIMIT');
          }
          throw new Error(`FIPE ${path} ${res.status}`);
        }
        
        return res.json();
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT') {
          throw new Error('Consulta temporariamente indisponível. Tente novamente mais tarde.');
        }
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt)));
      }
    }
    throw new Error('Falha após múltiplas tentativas');
  });
}

export function fuelToCode(fuel: Fuel): number[] {
  const f = fuel.toLowerCase();
  if (f.includes("gasol")) return [1];
  if (f.includes("álcool") || f.includes("alcool") || f.includes("etanol")) return [2];
  if (f.includes("diesel")) return [3, 4];
  if (f.includes("flex")) return [3, 1, 2];
  return [1, 2, 3, 4];
}

export async function getTabelaReferenciaCodigo(): Promise<number> {
  const list = await postFIPE<TabelaReferencia[]>("ConsultarTabelaDeReferencia", {});
  return list.sort((a, b) => b.Codigo - a.Codigo)[0].Codigo;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function consultarPorCodigoFIPE(
  ref: number,
  tipoVeiculo: number,
  anoModelo: number,
  fipeCode: string,
  fuelCode: number
): Promise<ValorFIPE> {
  return postFIPE("ConsultarValorComTodosParametros", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
    ano: `${anoModelo}-${fuelCode}`,
    codigoTipoCombustivel: fuelCode,
    anoModelo,
    codigoModelo: null,
    tipoConsulta: "codigo",
    modeloCodigoExterno: fipeCode,
  });
}

export async function consultarTradicional(
  ref: number,
  tipoVeiculo: number,
  brand: string,
  model: string,
  ano: number,
  fuel: Fuel
): Promise<FIPEConsultaResult> {
  // 1) Buscar marca
  const marcas = await postFIPE<Marca[]>("ConsultarMarcas", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
  });
  
  const brandNorm = normalizeString(brand);
  const marca = marcas.find(m => normalizeString(m.Label).includes(brandNorm));
  
  if (!marca) {
    throw new Error(`Marca "${brand}" não encontrada na FIPE`);
  }

  // 2) Buscar modelo
  const modelosResp = await postFIPE<ModelosResponse>("ConsultarModelos", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
    codigoMarca: Number(marca.Value),
  });
  
  const modelNorm = normalizeString(model);
  const modelo = modelosResp.Modelos
    .filter(x => normalizeString(x.Label).includes(modelNorm))
    .sort((a, b) => b.Label.length - a.Label.length)[0];
  
  if (!modelo) {
    throw new Error(`Modelo "${model}" não encontrado na FIPE`);
  }

  // 3) Buscar ano e combustível
  const anos = await postFIPE<AnoModelo[]>("ConsultarAnoModelo", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
    codigoMarca: Number(marca.Value),
    codigoModelo: Number(modelo.Value),
  });

  const fuelCandidates = fuelToCode(fuel);
  
  for (const fc of fuelCandidates) {
    const anoItem = anos.find(a => 
      a.Value.startsWith(`${ano}-`) && a.Value.endsWith(`-${fc}`)
    );
    
    if (!anoItem) continue;

    // 4) Consultar valor
    try {
      const valor = await postFIPE<ValorFIPE>("ConsultarValorComTodosParametros", {
        codigoTabelaReferencia: ref,
        codigoTipoVeiculo: tipoVeiculo,
        codigoMarca: Number(marca.Value),
        ano: anoItem.Value,
        codigoTipoCombustivel: fc,
        anoModelo: ano,
        codigoModelo: Number(modelo.Value),
        tipoConsulta: "tradicional",
      });
      
      return { valor, fuelCode: fc, anoValue: anoItem.Value, marca, modelo, tabelaRef: ref };
    } catch (error) {
      console.error(`Tentativa falhou para combustível ${fc}:`, error);
      continue;
    }
  }
  
  throw new Error(`Combinação ano/combustível não encontrada na FIPE para ${brand} ${model} ${ano}`);
}

export async function consultarFIPEComCache(
  vehicleId: string,
  brand: string,
  model: string,
  year: number,
  fuel: Fuel,
  tipoVeiculo: number,
  fipeCode?: string
): Promise<{
  cached: boolean;
  data: {
    price_value: number;
    price_label: string;
    fipe_code?: string;
    mes_referencia: string;
    data_consulta: string;
    dias_desde_consulta: number;
  };
}> {
  // Verificar cache
  const tabelaRef = await getTabelaReferenciaCodigo();
  
  const { data: cached, error: cacheError } = await supabase
    .from('fipe_cache')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('tabela_ref', tabelaRef)
    .order('data_consulta', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached && !cacheError) {
    const diasDesdeConsulta = Math.floor(
      (Date.now() - new Date(cached.data_consulta!).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diasDesdeConsulta <= 30) {
      const rawResponse = cached.raw_response as any;
      return {
        cached: true,
        data: {
          price_value: parseFloat(cached.price_value?.toString() || '0'),
          price_label: cached.price_label || '',
          fipe_code: cached.fipe_code || undefined,
          mes_referencia: rawResponse?.MesReferencia || '',
          data_consulta: cached.data_consulta || new Date().toISOString(),
          dias_desde_consulta: diasDesdeConsulta,
        },
      };
    }
  }

  // Consultar FIPE
  let result: FIPEConsultaResult;
  
  if (fipeCode) {
    const fuelCodes = fuelToCode(fuel);
    let lastError;
    
    for (const fc of fuelCodes) {
      try {
        const valor = await consultarPorCodigoFIPE(tabelaRef, tipoVeiculo, year, fipeCode, fc);
        result = {
          valor,
          fuelCode: fc,
          anoValue: `${year}-${fc}`,
          marca: { Label: brand, Value: '' },
          modelo: { Label: model, Value: 0 },
          tabelaRef,
        };
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (!result!) {
      throw lastError || new Error('Falha ao consultar por código FIPE');
    }
  } else {
    result = await consultarTradicional(tabelaRef, tipoVeiculo, brand, model, year, fuel);
  }

  // Converter valor para número
  const priceValue = parseFloat(result.valor.Valor.replace(/[^0-9,]/g, '').replace(',', '.'));

  // Salvar no cache via INSERT direto (RLS preenche tenant_id)
  const { error: insertError } = await supabase.from('fipe_cache').insert({
    vehicle_id: vehicleId,
    tabela_ref: tabelaRef,
    price_value: priceValue,
    price_label: result.valor.Valor,
    brand: result.valor.Marca,
    model: result.valor.Modelo,
    year_model: year,
    fuel: result.valor.Combustivel,
    fuel_code: result.fuelCode,
    fipe_code: result.valor.CodigoFipe,
    raw_response: result.valor as any,
  });
  
  if (insertError) {
    console.log('Cache FIPE:', insertError.message);
  }

  return {
    cached: false,
    data: {
      price_value: priceValue,
      price_label: result.valor.Valor,
      fipe_code: result.valor.CodigoFipe,
      mes_referencia: result.valor.MesReferencia,
      data_consulta: new Date().toISOString(),
      dias_desde_consulta: 0,
    },
  };
}
