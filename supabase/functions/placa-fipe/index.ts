import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[Placa FIPE] Request received: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placa } = await req.json();
    
    if (!placa) {
      throw new Error("Placa é obrigatória");
    }

    const placaClean = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    console.log(`[Placa FIPE] Consultando placa: ${placaClean}`);

    // Consultar API PlacaFipe
    const response = await fetch(`https://wdapi2.com.br/consulta/${placaClean}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    console.log(`[Placa FIPE] Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Placa não encontrada");
      }
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Placa FIPE] Dados recebidos:`, JSON.stringify(data).substring(0, 200));

    // Extrair dados relevantes
    const result = {
      placa: data.placa || placaClean,
      marca: data.marca || data.MARCA,
      modelo: data.modelo || data.MODELO,
      anoModelo: data.anoModelo || data.ano_modelo || data.ANO_MODELO,
      anoFabricacao: data.anoFabricacao || data.ano_fabricacao,
      cor: data.cor,
      combustivel: data.combustivel || data.COMBUSTIVEL,
      municipio: data.municipio,
      uf: data.uf,
      chassi: data.chassi,
      valorFipe: data.fipe || data.FIPE,
      codigoFipe: data.codigoFipe || data.codigo_fipe,
      mesReferencia: data.mesReferencia || data.mes_referencia,
      rawData: data,
    };

    console.log(`[Placa FIPE] Dados processados:`, JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Placa FIPE] Error:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erro ao consultar dados da placa"
      }),
      {
        status: error.message === "Placa não encontrada" ? 404 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
