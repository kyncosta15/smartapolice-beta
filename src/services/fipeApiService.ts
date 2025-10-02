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
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // Use Edge Function proxy to avoid CORS/mixed-content issues
        const SUPABASE_URL = "https://jhvbfvqhuemuvwgqpskz.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg";
        
        console.log(`[FIPE Client] Calling proxy for: ${path}`);
        
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fipe-proxy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ path, body }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`[FIPE Client] Proxy response status: ${res.status}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[FIPE Client] Error response:`, errorText);
          
          if (res.status === 429 || res.status === 403) {
            throw new Error('RATE_LIMIT');
          }
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.details || errorData.error || `FIPE ${path} ${res.status}`);
          } catch (e) {
            throw new Error(`Erro na comunicação com a API: ${res.status}`);
          }
        }
        
        const data = await res.json();
        console.log(`[FIPE Client] Success for ${path}`);
        return data;
      } catch (error: any) {
        console.error(`[FIPE Client] Attempt ${attempt + 1} failed:`, error.message);
        
        if (error.message === 'RATE_LIMIT') {
          throw new Error('Consulta temporariamente indisponível. Tente novamente mais tarde.');
        }
        
        if (error.name === 'AbortError') {
          console.error('[FIPE Client] Request timeout:', path);
        }
        
        if (attempt === retries) {
          throw new Error(`Erro ao consultar FIPE: ${error.message}`);
        }
        
        // Exponential backoff
        const delay = 500 * Math.pow(2, attempt);
        console.log(`[FIPE Client] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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

// Mapa de normalização de marcas
const BRAND_NORMALIZATIONS: Record<string, string> = {
  // Mercedes-Benz
  "m.benz": "Mercedes-Benz",
  "mbenz": "Mercedes-Benz",
  "mb": "Mercedes-Benz",
  "mercedes": "Mercedes-Benz",
  "mercedes benz": "Mercedes-Benz",
  
  // Volkswagen
  "vw": "Volkswagen",
  "volks": "Volkswagen",
  "volkswagem": "Volkswagen",
  
  // Chevrolet
  "gm": "Chevrolet",
  "chevy": "Chevrolet",
  
  // Outros
  "ford": "Ford",
  "fiat": "Fiat",
  "honda": "Honda",
  "toyota": "Toyota",
  "hyundai": "Hyundai",
  "nissan": "Nissan",
  "renault": "Renault",
  "peugeot": "Peugeot",
  "citroen": "Citroen",
  "jeep": "Jeep",
  "mitsubishi": "Mitsubishi",
  "bmw": "BMW",
  "audi": "Audi",
  "volvo": "Volvo",
  "iveco": "Iveco",
  "scania": "Scania",
};

function normalizeBrand(brand: string): string {
  const normalized = normalizeString(brand);
  return BRAND_NORMALIZATIONS[normalized] || brand;
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
  // 1) Normalizar e buscar marca
  const brandNormalized = normalizeBrand(brand);
  console.log(`[FIPE] Marca original: "${brand}" → normalizada: "${brandNormalized}"`);
  
  const marcas = await postFIPE<Marca[]>("ConsultarMarcas", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
  });
  
  const brandNorm = normalizeString(brandNormalized);
  let marca = marcas.find(m => normalizeString(m.Label) === brandNorm);
  
  // Se não encontrou com match exato, tenta match parcial
  if (!marca) {
    marca = marcas.find(m => {
      const labelNorm = normalizeString(m.Label);
      return labelNorm.includes(brandNorm) || brandNorm.includes(labelNorm);
    });
  }
  
  if (!marca) {
    // Sugerir marcas similares
    const similarBrands = marcas
      .filter(m => {
        const labelNorm = normalizeString(m.Label);
        return labelNorm.includes(brandNorm.substring(0, 3)) || 
               brandNorm.includes(labelNorm.substring(0, 3));
      })
      .slice(0, 3)
      .map(m => m.Label);
    
    const suggestion = similarBrands.length > 0 
      ? `\n\n💡 Sugestões: ${similarBrands.join(', ')}`
      : '\n\n💡 Verifique se a marca está correta (ex: "Mercedes-Benz", "Volkswagen", "Chevrolet")';
    
    throw new Error(`❌ Marca "${brand}" não foi encontrada na FIPE.${suggestion}`);
  }
  
  console.log(`[FIPE] ✅ Marca encontrada: ${marca.Label}`);

  // 2) Buscar modelo
  const modelosResp = await postFIPE<ModelosResponse>("ConsultarModelos", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
    codigoMarca: Number(marca.Value),
  });
  
  const modelNorm = normalizeString(model);
  let modelo = modelosResp.Modelos.find(x => normalizeString(x.Label) === modelNorm);
  
  // Se não encontrou match exato, busca parcial
  if (!modelo) {
    const candidatos = modelosResp.Modelos
      .filter(x => {
        const labelNorm = normalizeString(x.Label);
        return labelNorm.includes(modelNorm) || modelNorm.includes(labelNorm);
      })
      .sort((a, b) => {
        // Prioriza matches mais próximos
        const aSimilarity = normalizeString(a.Label).length - Math.abs(normalizeString(a.Label).length - modelNorm.length);
        const bSimilarity = normalizeString(b.Label).length - Math.abs(normalizeString(b.Label).length - modelNorm.length);
        return bSimilarity - aSimilarity;
      });
    
    modelo = candidatos[0];
    
    if (modelo) {
      console.log(`[FIPE] ⚠️ Modelo "${model}" não encontrado exatamente. Usando: "${modelo.Label}"`);
    }
  }
  
  if (!modelo) {
    // Sugerir modelos similares
    const similarModels = modelosResp.Modelos
      .filter(x => {
        const labelNorm = normalizeString(x.Label);
        const words = modelNorm.split(' ');
        return words.some(word => word.length > 3 && labelNorm.includes(word));
      })
      .slice(0, 5)
      .map(m => m.Label);
    
    const suggestion = similarModels.length > 0
      ? `\n\n💡 Modelos disponíveis:\n  • ${similarModels.join('\n  • ')}`
      : '';
    
    throw new Error(`❌ Modelo "${model}" não encontrado para ${marca.Label}.${suggestion}`);
  }
  
  console.log(`[FIPE] ✅ Modelo encontrado: ${modelo.Label}`);

  // 3) Buscar ano e combustível
  const anos = await postFIPE<AnoModelo[]>("ConsultarAnoModelo", {
    codigoTabelaReferencia: ref,
    codigoTipoVeiculo: tipoVeiculo,
    codigoMarca: Number(marca.Value),
    codigoModelo: Number(modelo.Value),
  });

  const fuelCandidates = fuelToCode(fuel);
  console.log(`[FIPE] Testando combustíveis: ${fuelCandidates.join(', ')}`);
  
  const errors: string[] = [];
  
  for (const fc of fuelCandidates) {
    const anoItem = anos.find(a => 
      a.Value.startsWith(`${ano}-`) && a.Value.endsWith(`-${fc}`)
    );
    
    if (!anoItem) {
      console.log(`[FIPE] Ano ${ano} não disponível para combustível ${fc}`);
      continue;
    }

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
      
      console.log(`[FIPE] ✅ Valor encontrado: ${valor.Valor} (combustível: ${valor.Combustivel})`);
      return { valor, fuelCode: fc, anoValue: anoItem.Value, marca, modelo, tabelaRef: ref };
    } catch (error: any) {
      const errorMsg = `Combustível ${fc}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`[FIPE] ${errorMsg}`);
      continue;
    }
  }
  
  // Se não encontrou nenhum, tentar anos próximos
  const anosDisponiveis = anos
    .map(a => parseInt(a.Value.split('-')[0]))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => Math.abs(a - ano) - Math.abs(b - ano))
    .slice(0, 3);
  
  const suggestion = anosDisponiveis.length > 0
    ? `\n\n💡 Anos disponíveis próximos: ${anosDisponiveis.join(', ')}`
    : '';
  
  throw new Error(`❌ Não encontramos esse veículo na FIPE.\n\n${marca.Label} ${modelo.Label} ${ano}\n${errors.join('\n')}${suggestion}`);
}

export async function consultarFIPEComCache(
  vehicleId: string,
  brand: string,
  model: string,
  year: number,
  fuel: Fuel,
  tipoVeiculo: number,
  fipeCode?: string,
  placa?: string
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

  // Se tem placa, tentar consulta pela placa primeiro
  if (placa) {
    try {
      console.log(`[FIPE] Tentando consulta por placa: ${placa}`);
      const placaResult = await consultarPorPlaca(placa);
      
      if (placaResult && placaResult.valorFipe) {
        const priceValue = parseFloat(
          placaResult.valorFipe.replace(/[^0-9,]/g, '').replace(',', '.')
        );
        
        // Salvar no cache
        const { error: insertError } = await supabase
          .from('fipe_cache')
          .insert([{
            vehicle_id: vehicleId,
            tabela_ref: tabelaRef,
            price_value: priceValue,
            price_label: placaResult.valorFipe,
            brand: placaResult.marca || brand,
            model: placaResult.modelo || model,
            year_model: placaResult.anoModelo || year,
            fuel: placaResult.combustivel || fuel,
            fuel_code: fuelToCode(placaResult.combustivel || fuel)[0],
            fipe_code: placaResult.codigoFipe || fipeCode,
            raw_response: placaResult.rawData as any,
            tenant_id: '00000000-0000-0000-0000-000000000000',
          } as any]);
        
        if (insertError) {
          console.log('Cache FIPE (placa):', insertError.message);
        }
        
        return {
          cached: false,
          data: {
            price_value: priceValue,
            price_label: placaResult.valorFipe,
            fipe_code: placaResult.codigoFipe,
            mes_referencia: placaResult.mesReferencia || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            data_consulta: new Date().toISOString(),
            dias_desde_consulta: 0,
          },
        };
      }
    } catch (error) {
      console.log('[FIPE] Consulta por placa falhou, tentando método tradicional:', error);
    }
  }

  // Consultar FIPE pelo método tradicional (fallback)
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

  // Salvar no cache - tenant_id será preenchido automaticamente pela policy RLS
  const { error: insertError } = await supabase
    .from('fipe_cache')
    .insert([{
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
      tenant_id: '00000000-0000-0000-0000-000000000000', // Placeholder - será substituído por RLS
    } as any]);
  
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

async function consultarPorPlaca(placa: string): Promise<any> {
  const SUPABASE_URL = "https://jhvbfvqhuemuvwgqpskz.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg";
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1/placa-fipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ placa }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro ao consultar placa');
  }
  
  return res.json();
}
