import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIPE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGZmNDQxMi0zNjEyLTQwMTUtOTdmMC04NGJmY2NjYjE1MTEiLCJlbWFpbCI6InRoaWFnb25jb3N0YTE1QGdtYWlsLmNvbSIsImlhdCI6MTc2MDQ0OTcyOX0.VFFyeQceP1H5bxgGYUKtUR5diRVMwZ-6Ate9TAiGDsQ";

// Helper: mapeia categoria para vehicleType
function resolveVehicleType(category?: string): "cars" | "motorcycles" | "trucks" {
  const c = (category || "").toLowerCase();
  if (c.includes("caminh")) return "trucks";
  if (c.includes("moto")) return "motorcycles";
  return "cars";
}

// Helper: transforma "2013" -> "2013-0" (ou aceita "2013-1")
function toYearId(year?: number): string {
  if (!year) throw new Error("Ano inválido");
  const s = String(year).trim();
  if (/^\d{4}$/.test(s)) return `${s}-0`;
  if (/^\d{4}-\d$/.test(s)) return s;
  throw new Error("Ano inválido. Use YYYY ou YYYY-d.");
}

interface Vehicle {
  id: string;
  placa: string;
  codigo_fipe?: string;
  ano_modelo?: number;
  marca?: string;
  modelo?: string;
  categoria?: string;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ placa: string; error: string }>;
}

serve(async (req) => {
  console.log(`[Batch FIPE] Request received: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    console.log(`[Batch FIPE] User: ${user.id}`);

    const { empresa_id, vehicle_ids } = await req.json();

    if (!empresa_id) {
      throw new Error("empresa_id é obrigatório");
    }

    console.log(`[Batch FIPE] Empresa: ${empresa_id}, Veículos específicos: ${vehicle_ids?.length || 'todos'}`);

    // Buscar veículos com código FIPE e ano preenchidos
    let query = supabase
      .from('frota_veiculos')
      .select('id, placa, codigo_fipe, ano_modelo, marca, modelo, categoria')
      .eq('empresa_id', empresa_id)
      .not('codigo_fipe', 'is', null)
      .not('ano_modelo', 'is', null);

    // Se enviou IDs específicos, filtrar por eles
    if (vehicle_ids && Array.isArray(vehicle_ids) && vehicle_ids.length > 0) {
      query = query.in('id', vehicle_ids);
    }

    const { data: vehicles, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar veículos: ${fetchError.message}`);
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum veículo encontrado para processar',
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0,
          errors: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Batch FIPE] Processando ${vehicles.length} veículos`);

    const result: BatchResult = {
      total: vehicles.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Processar cada veículo
    for (const vehicle of vehicles) {
      try {
        // Validar se tem código FIPE e ano
        if (!vehicle.codigo_fipe) {
          result.skipped++;
          result.errors.push({
            placa: vehicle.placa,
            error: 'Código FIPE não preenchido'
          });
          continue;
        }

        if (!vehicle.ano_modelo) {
          result.skipped++;
          result.errors.push({
            placa: vehicle.placa,
            error: 'Ano do modelo não preenchido'
          });
          continue;
        }

        console.log(`[Batch FIPE] Consultando ${vehicle.placa} - Código: ${vehicle.codigo_fipe}, Ano: ${vehicle.ano_modelo}`);

        // Resolver tipo de veículo baseado na categoria
        const vehicleType = resolveVehicleType(vehicle.categoria);
        
        // Formatar ano para o padrão YYYY-0
        const yearId = toYearId(vehicle.ano_modelo);

        // Consultar API FIPE
        const url = `https://fipe.parallelum.com.br/api/v2/${vehicleType}/${encodeURIComponent(vehicle.codigo_fipe)}/years/${encodeURIComponent(yearId)}`;
        
        console.log(`[Batch FIPE] URL: ${url}`);
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "X-Subscription-Token": FIPE_TOKEN
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            result.skipped++;
            result.errors.push({
              placa: vehicle.placa,
              error: 'Código FIPE ou ano não encontrado na tabela FIPE'
            });
            continue;
          }
          throw new Error(`API FIPE retornou status ${response.status}`);
        }

        const data = await response.json();
        
        // Extrair valor FIPE
        const valorFipeStr = data.price;
        let precoFipe: number | null = null;

        if (valorFipeStr) {
          // Converter string "R$ 50.000,00" para número
          const valorLimpo = valorFipeStr
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
          precoFipe = parseFloat(valorLimpo);
        }

        // Preparar dados para atualização
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (precoFipe && !isNaN(precoFipe)) {
          updateData.preco_fipe = precoFipe;
        }

        if (data.brand) {
          updateData.marca = data.brand;
        }

        if (data.model) {
          updateData.modelo = data.model;
        }

        if (data.modelYear) {
          const ano = parseInt(data.modelYear);
          if (!isNaN(ano)) {
            updateData.ano_modelo = ano;
          }
        }

        if (data.fuel) {
          updateData.combustivel = data.fuel;
        }

        // Atualizar veículo no banco
        const { error: updateError } = await supabase
          .from('frota_veiculos')
          .update(updateData)
          .eq('id', vehicle.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }

        result.success++;
        console.log(`[Batch FIPE] ✓ ${vehicle.placa} atualizado - Preço: R$ ${precoFipe?.toFixed(2) || 'N/A'}`);

        // Delay entre requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        result.failed++;
        result.errors.push({
          placa: vehicle.placa,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        console.error(`[Batch FIPE] ✗ Erro ao processar ${vehicle.placa}:`, error);
      }
    }

    console.log(`[Batch FIPE] Processamento concluído - Sucesso: ${result.success}, Falhas: ${result.failed}, Ignorados: ${result.skipped}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Batch FIPE] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: "Erro ao processar consultas FIPE em lote"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
