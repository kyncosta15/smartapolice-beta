import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIPE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGZmNDQxMi0zNjEyLTQwMTUtOTdmMC04NGJmY2NjYjE1MTEiLCJlbWFpbCI6InRoaWFnb25jb3N0YTE1QGdtYWlsLmNvbSIsImlhdCI6MTc2MDQ0OTcyOX0.VFFyeQceP1H5bxgGYUKtUR5diRVMwZ-6Ate9TAiGDsQ";

interface FipeRequest {
  vehicleType?: "cars" | "motorcycles" | "trucks";
  fipeCode: string;
  year?: string | number;
  plate?: string;
  reference?: number;
  category?: string;
}

// Helper: mapeia categoria para vehicleType (usando as 3 categorias padronizadas)
function resolveVehicleType(vehicleType?: string, category?: string): "cars" | "motorcycles" | "trucks" {
  if (vehicleType === "cars" || vehicleType === "motorcycles" || vehicleType === "trucks") {
    return vehicleType;
  }
  
  // Mapeamento direto das 3 categorias padronizadas
  if (category === "Carros") {
    console.log(`[Get FIPE] Direct mapping: "${category}" -> cars`);
    return "cars";
  }
  if (category === "Caminhão") {
    console.log(`[Get FIPE] Direct mapping: "${category}" -> trucks`);
    return "trucks";
  }
  if (category === "Moto") {
    console.log(`[Get FIPE] Direct mapping: "${category}" -> motorcycles`);
    return "motorcycles";
  }
  
  // Fallback: normalizar e remover acentos para compatibilidade retroativa
  const c = (category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  console.log(`[Get FIPE] Legacy category mapping: "${category}" -> normalized: "${c}"`);
  
  if (c.includes("caminh") || c.includes("truck")) {
    console.log(`[Get FIPE] -> mapped to: trucks`);
    return "trucks";
  }
  
  if (c.includes("moto")) {
    console.log(`[Get FIPE] -> mapped to: motorcycles`);
    return "motorcycles";
  }
  
  // Default para cars (inclui passeio, utilitário, etc)
  console.log(`[Get FIPE] -> default to: cars`);
  return "cars";
}

// Helper: transforma "2013" -> "2013-0" (ou aceita "2013-1")
function toYearId(year?: string | number): string {
  const s = String(year || "").trim();
  if (/^\d{4}$/.test(s)) return `${s}-0`;
  if (/^\d{4}-\d$/.test(s)) return s;
  throw new Error("Ano inválido. Use YYYY ou YYYY-d.");
}

// Normalização: adiciona priceNumber e renomeia historico
function normalize(body: any, request: any) {
  const toNumber = (brl: string | null): number | null => {
    if (typeof brl !== "string") return null;
    const cleaned = brl.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  };

  const priceHistory = Array.isArray(body?.priceHistory)
    ? body.priceHistory.map((h: any) => ({
        month: h?.month ?? null,
        priceFormatted: h?.price ?? null,
        priceNumber: toNumber(h?.price),
        reference: h?.reference ?? null
      }))
    : [];

  return {
    ok: true,
    request: {
      vehicleType: request.vehicleType,
      fipeCode: request.fipeCode,
      yearId: request.yearId,
      reference: request.reference
    },
    data: {
      brand: body?.brand ?? null,
      codeFipe: body?.codeFipe ?? null,
      model: body?.model ?? null,
      modelYear: body?.modelYear ?? null,
      fuel: body?.fuel ?? null,
      fuelAcronym: body?.fuelAcronym ?? null,
      priceFormatted: body?.price ?? null,
      priceNumber: toNumber(body?.price),
      referenceMonth: body?.referenceMonth ?? null,
      vehicleType: body?.vehicleType ?? null,
      priceHistory
    }
  };
}

serve(async (req) => {
  console.log(`[Get FIPE by Code and Year] Request received: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: FipeRequest = await req.json();
    console.log(`[Get FIPE] Request body:`, JSON.stringify(requestBody));
    
    const { fipeCode, year, plate, reference, category } = requestBody;

    if (!fipeCode) {
      throw new Error("fipeCode é obrigatório");
    }

    // Resolver vehicleType
    const vehicleType = resolveVehicleType(requestBody.vehicleType, category);
    console.log(`[Get FIPE] Vehicle type resolved: ${vehicleType}`);

    // Resolver year
    let finalYear = year;
    if (!finalYear) {
      console.log(`[Get FIPE] Year não informado, tentando resolver...`);
      // TODO: aqui poderia chamar resolveYearByPlate(plate) se implementado
      if (!finalYear) {
        throw new Error("Ano (year) é obrigatório. Informe o ano do modelo.");
      }
    }

    // Converter para yearId
    const yearId = toYearId(finalYear);
    console.log(`[Get FIPE] YearId: ${yearId}`);

    // Montar URL
    let url = `https://fipe.parallelum.com.br/api/v2/${vehicleType}/${encodeURIComponent(fipeCode)}/years/${encodeURIComponent(yearId)}`;
    
    if (reference) {
      url += `?reference=${reference}`;
    }

    console.log(`[Get FIPE] Calling: ${url}`);

    // Fazer requisição à API FIPE
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "X-Subscription-Token": FIPE_TOKEN
      }
    });

    console.log(`[Get FIPE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Get FIPE] Error ${response.status}: ${errorText}`);
      
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            status: response.status,
            message: response.status === 404 
              ? "Código FIPE ou ano não encontrado na tabela FIPE"
              : `Erro ao consultar FIPE: ${response.status}`,
            details: errorText
          }
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();
    console.log(`[Get FIPE] Success:`, JSON.stringify(data).substring(0, 200));

    const normalized = normalize(data, {
      vehicleType,
      fipeCode,
      yearId,
      reference
    });

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Get FIPE] Error:", error.message);
    console.error("[Get FIPE] Stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          status: 422,
          message: error.message || "Erro ao processar requisição",
          details: error.stack
        }
      }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
