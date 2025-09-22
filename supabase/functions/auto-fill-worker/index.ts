import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION: Auto Fill Worker ===')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Buscando jobs pendentes...')

    // Buscar jobs com status 'completed' que ainda não foram processados
    const { data: pendingJobs, error: jobsError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('status', 'pending')
      .is('processed_at', null)
      .order('created_at', { ascending: true })
      .limit(10)

    if (jobsError) {
      console.error('Erro ao buscar jobs:', jobsError)
      throw jobsError
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('Nenhum job pendente encontrado')
      return new Response(
        JSON.stringify({ processed: 0, message: 'Nenhum job pendente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const job of pendingJobs) {
      console.log(`Processando job ${job.job_id}`)

      try {
        // Chamar a função de commit para processar o job
        const commitResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/commit-import/${job.job_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            empresaId: job.empresa_id,
            payload: job.payload
          })
        })

        const result = await commitResponse.json()
        
        results.push({
          job_id: job.job_id,
          success: commitResponse.ok,
          result
        })

      } catch (error) {
        console.error(`Erro ao processar job ${job.job_id}:`, error)
        
        // Marcar job como falhou
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            summary: { error: error.message },
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        results.push({
          job_id: job.job_id,
          success: false,
          error: error.message
        })
      }
    }

    const summary = {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }

    console.log('Worker concluído:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no worker:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})