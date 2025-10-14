import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vehicle {
  id: string;
  placa: string;
  codigo_fipe?: string;
  ano_modelo?: number;
  marca?: string;
  modelo?: string;
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

    // Buscar veículos
    let query = supabase
      .from('frota_veiculos')
      .select('id, placa, codigo_fipe, ano_modelo, marca, modelo')
      .eq('empresa_id', empresa_id)
      .not('placa', 'is', null);

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
        console.log(`[Batch FIPE] Consultando placa: ${vehicle.placa}`);

        // Consultar API PlacaFipe
        const placaClean = vehicle.placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const response = await fetch(`https://wdapi2.com.br/consulta/${placaClean}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            result.skipped++;
            result.errors.push({
              placa: vehicle.placa,
              error: 'Placa não encontrada na API'
            });
            continue;
          }
          throw new Error(`API retornou status ${response.status}`);
        }

        const data = await response.json();
        
        // Extrair valor FIPE
        const valorFipeStr = data.fipe || data.FIPE;
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

        if (data.codigoFipe || data.codigo_fipe) {
          updateData.codigo_fipe = data.codigoFipe || data.codigo_fipe;
        }

        if (data.marca || data.MARCA) {
          updateData.marca = data.marca || data.MARCA;
        }

        if (data.modelo || data.MODELO) {
          updateData.modelo = data.modelo || data.MODELO;
        }

        if (data.anoModelo || data.ano_modelo || data.ANO_MODELO) {
          const ano = parseInt(data.anoModelo || data.ano_modelo || data.ANO_MODELO);
          if (!isNaN(ano)) {
            updateData.ano_modelo = ano;
          }
        }

        if (data.combustivel || data.COMBUSTIVEL) {
          updateData.combustivel = data.combustivel || data.COMBUSTIVEL;
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
