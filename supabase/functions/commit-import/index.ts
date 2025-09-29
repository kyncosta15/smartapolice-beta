import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento N8N → frota_veiculos
const FIELD_MAPPING = {
  "codigo": "codigo_interno",
  "placa": "placa", 
  "modelo": "modelo",
  "chassi": "chassi",
  "renavam": "renavam",
  "marca": "marca",
  "ano": "ano_modelo",
  "proprietario": "proprietario_nome",
  "localizacao": "localizacao",
  "familia": "familia",
  "status": "status_veiculo",
  "origem_planilha": "origem_planilha"
}

interface CompanySettings {
  auto_fill_enabled: boolean
  update_policy: 'empty_only' | 'whitelist' | 'block_conflicts'
  allowed_fields: string[]
  category_mapping: Record<string, string>
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION: Commit Import ===')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const jobId = url.pathname.split('/').pop()
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { empresaId, payload } = await req.json()
    
    if (!empresaId || !payload) {
      return new Response(
        JSON.stringify({ error: 'empresaId e payload são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processando job ${jobId} para empresa ${empresaId}`)

    // 1. Salvar job de importação
    const { error: jobError } = await supabase
      .from('import_jobs')
      .upsert({
        job_id: jobId,
        empresa_id: empresaId,
        payload,
        status: 'processing'
      })

    if (jobError) {
      console.error('Erro ao salvar job:', jobError)
      throw jobError
    }

    // 2. Carregar configurações da empresa
    const { data: settings, error: settingsError } = await supabase
      .from('company_import_settings')
      .select('*')
      .eq('empresa_id', empresaId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Erro ao carregar configurações:', settingsError)
      throw settingsError
    }

    // Configurações padrão se não existirem
    const config: CompanySettings = settings || {
      auto_fill_enabled: true,
      update_policy: 'empty_only',
      allowed_fields: [],
      category_mapping: {}
    }

    if (!config.auto_fill_enabled) {
      console.log('Preenchimento automático desabilitado para esta empresa')
      
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          summary: { skipped: true, reason: 'auto_fill_disabled' },
          processed_at: new Date().toISOString()
        })
        .eq('job_id', jobId)

      return new Response(
        JSON.stringify({ skipped: true, reason: 'auto_fill_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Processar dados
    const result = await processVehicleData(supabase, empresaId, jobId, payload, config)

    // 4. Atualizar status do job
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        summary: result,
        processed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)

    console.log('Processamento concluído:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no processamento:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processVehicleData(
  supabase: any,
  empresaId: string,
  jobId: string,
  payload: any,
  config: CompanySettings
) {
  const stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    noMatch: 0
  }

  const veiculos = payload.veiculos || []

  for (const vehicleData of veiculos) {
    stats.processed++

    try {
      // Encontrar veículo pela chave (placa, renavam, chassi)
      const veiculo = await findVehicle(supabase, empresaId, vehicleData)
      
      if (!veiculo) {
        stats.noMatch++
        console.log(`Veículo não encontrado: ${vehicleData.placa || vehicleData.renavam || vehicleData.chassi}`)
        continue
      }

      // Processar cada campo
      let vehicleUpdated = false
      
      for (const [srcField, dstField] of Object.entries(FIELD_MAPPING)) {
        if (!vehicleData[srcField]) continue

        const newValue = normalizeValue(dstField, vehicleData[srcField])
        const currentValue = veiculo[dstField]

        // Verificar se deve aplicar baseado na política
        if (!shouldApplyField(config, dstField, currentValue, newValue)) {
          continue
        }

        // Validar valor
        if (!validateValue(dstField, newValue)) {
          console.warn(`Valor inválido para ${dstField}: ${newValue}`)
          continue
        }

        // Verificar se realmente mudou
        if (String(currentValue || '') === String(newValue)) {
          continue
        }

        // Aplicar categoria mapping se necessário
        let finalValue = newValue
        if (dstField === 'categoria' && config.category_mapping[newValue]) {
          finalValue = config.category_mapping[newValue]
        }

        // Atualizar campo no veículo
        const { error: updateError } = await supabase
          .from('frota_veiculos')
          .update({ [dstField]: finalValue })
          .eq('id', veiculo.id)

        if (updateError) {
          console.error(`Erro ao atualizar ${dstField}:`, updateError)
          stats.errors++
          continue
        }

        // Criar auditoria
        await supabase
          .from('veiculo_field_sources')
          .insert({
            veiculo_id: veiculo.id,
            field_name: dstField,
            previous_value: String(currentValue || ''),
            new_value: String(finalValue),
            source: 'n8n_xlsx',
            import_job_id: jobId
          })

        vehicleUpdated = true
      }

      if (vehicleUpdated) {
        stats.updated++
      } else {
        stats.skipped++
      }

    } catch (error) {
      console.error('Erro ao processar veículo:', error)
      stats.errors++
    }
  }

  return stats
}

async function findVehicle(supabase: any, empresaId: string, vehicleData: any) {
  const { placa, renavam, chassi } = vehicleData

  // Buscar por placa primeiro
  if (placa) {
    const { data } = await supabase
      .from('frota_veiculos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('placa', placa.toUpperCase())
      .single()
    
    if (data) return data
  }

  // Buscar por renavam
  if (renavam) {
    const { data } = await supabase
      .from('frota_veiculos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('renavam', renavam)
      .single()
    
    if (data) return data
  }

  // Buscar por chassi
  if (chassi) {
    const { data } = await supabase
      .from('frota_veiculos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('chassi', chassi.toUpperCase())
      .single()
    
    if (data) return data
  }

  return null
}

function shouldApplyField(
  config: CompanySettings,
  fieldName: string,
  currentValue: any,
  newValue: any
): boolean {
  switch (config.update_policy) {
    case 'empty_only':
      return !currentValue || String(currentValue).trim() === ''

    case 'whitelist':
      return config.allowed_fields.includes(fieldName)

    case 'block_conflicts':
      return !currentValue || String(currentValue).trim() === '' || String(currentValue) === String(newValue)

    default:
      return false
  }
}

function normalizeValue(fieldName: string, value: any): any {
  if (!value) return null

  switch (fieldName) {
    case 'placa':
      return String(value).toUpperCase().trim()
    
    case 'chassi':
      return String(value).toUpperCase().trim()
    
    case 'renavam':
      return String(value).replace(/\D/g, '')
    
    case 'ano_modelo':
      return parseInt(String(value))
    
    default:
      return String(value).trim()
  }
}

function validateValue(fieldName: string, value: any): boolean {
  if (!value) return true

  switch (fieldName) {
    case 'placa':
      return /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(String(value))
    
    case 'renavam':
      const renavam = String(value).replace(/\D/g, '')
      return renavam.length >= 9 && renavam.length <= 11
    
    case 'chassi':
      return String(value).length === 17
    
    case 'ano_modelo':
      const year = parseInt(String(value))
      const currentYear = new Date().getFullYear()
      return year >= 1950 && year <= (currentYear + 1)
    
    default:
      const str = String(value)
      return str.length >= 1 && str.length <= 120
  }
}