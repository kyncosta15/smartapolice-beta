import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pdfPath } = await req.json()
    
    console.log('📥 Requisição de download recebida para:', pdfPath)
    
    if (!pdfPath) {
      console.error('❌ pdfPath não fornecido')
      return new Response(
        JSON.stringify({ error: 'pdfPath é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service key para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Baixando arquivo do bucket pdfs:', pdfPath)

    // Baixar arquivo do storage
    const { data: fileData, error } = await supabaseAdmin.storage
      .from('pdfs')
      .download(pdfPath)

    if (error) {
      console.error('❌ Erro ao baixar arquivo:', error)
      return new Response(
        JSON.stringify({ error: 'Arquivo não encontrado', details: error.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!fileData) {
      console.error('❌ Arquivo vazio retornado do storage')
      return new Response(
        JSON.stringify({ error: 'Arquivo está vazio' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Arquivo baixado com sucesso, tamanho:', fileData.size)

    // Retornar arquivo como blob
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="apolice.pdf"',
      },
    })

  } catch (error) {
    console.error('Erro na edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})