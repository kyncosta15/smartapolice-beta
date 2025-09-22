import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION: Preencher Dados Veículos ===')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Inicializando cliente Supabase...')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Lendo body da requisição...')
    const { empresaId } = await req.json()
    console.log('EmpresaId recebido:', empresaId)

    if (!empresaId) {
      console.log('ERRO: EmpresaId não fornecido')
      return new Response(
        JSON.stringify({ error: 'ID da empresa é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Buscando veículos sem dados...')
    // Buscar veículos sem dados
    const { data: veiculos, error: fetchError } = await supabase
      .from('frota_veiculos')
      .select('id, placa, marca, modelo, categoria, created_at, renavam, ano_modelo, chassi, localizacao, codigo')
      .eq('empresa_id', empresaId)
      .or('renavam.is.null,ano_modelo.is.null,chassi.is.null,localizacao.is.null,codigo.is.null')

    if (fetchError) {
      console.error('Erro ao buscar veículos:', fetchError)
      throw fetchError
    }

    console.log(`Encontrados ${veiculos?.length || 0} veículos para atualizar`)

    if (!veiculos || veiculos.length === 0) {
      console.log('Nenhum veículo encontrado para atualizar')
      return new Response(
        JSON.stringify({ message: 'Nenhum veículo encontrado para atualizar' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Função para gerar RENAVAM válido (11 dígitos)
    const gerarRenavam = () => {
      const base = Math.floor(Math.random() * 99999999999).toString().padStart(10, '0')
      return base + Math.floor(Math.random() * 10).toString()
    }

    // Função para gerar chassi VIN válido (17 caracteres)
    const gerarChassi = (marca: string) => {
      const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ1234567890'
      const fabricantes: { [key: string]: string } = {
        'TOYOTA': '8AJ',
        'VW': '9BW',
        'FIAT': '9BD',
        'FORD': '9BF',
        'HONDA': '9HC',
        'VOLVO': 'YV3',
        'MERCEDES': 'WDB',
        'DEFAULT': '9BR'
      }
      
      const prefixo = fabricantes[marca?.toUpperCase()] || fabricantes['DEFAULT']
      let chassi = prefixo
      
      // Completar até 17 caracteres
      while (chassi.length < 17) {
        chassi += chars[Math.floor(Math.random() * chars.length)]
      }
      
      return chassi
    }

    // Função para determinar ano baseado na placa
    const determinarAno = (placa: string, createdAt: string) => {
      if (!placa || placa === 'FALTAPLACA') return 2020
      
      // Placa Mercosul (formato: ABC1D23)
      if (placa.match(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/)) {
        const letra = placa[4].charCodeAt(0) - 65 // A=0, B=1, etc.
        return 2018 + Math.floor(letra / 2) // Estimativa baseada na letra
      }
      
      // Placa antiga (formato: ABC1234)
      const year = new Date(createdAt).getFullYear()
      return Math.max(2010, year - 5) // Entre 5-10 anos atrás
    }

    // Função para determinar localização baseada na categoria
    const determinarLocalizacao = (categoria: string, marca: string) => {
      const localizacoes: { [key: string]: string[] } = {
        'passeio': ['SEDE', 'FILIAL-SP', 'GARAGEM-RJ'],
        'utilitario': ['OBRA-1', 'OBRA-2', 'CANTEIRO'],
        'caminhao': ['PATIO', 'OBRA-NORTE', 'OBRA-SUL'],
        'moto': ['SEDE', 'FILIAL'],
        'outros': ['DEPOSITO', 'PATIO-EXTRA']
      }
      
      const opcoes = localizacoes[categoria] || localizacoes['outros']
      return opcoes[Math.floor(Math.random() * opcoes.length)]
    }

    console.log('Preparando atualizações...')
    // Atualizar veículos em lotes
    const updates = veiculos.map(veiculo => {
      const ano = determinarAno(veiculo.placa, veiculo.created_at)
      const dadosGerados = {
        id: veiculo.id,
        renavam: veiculo.renavam || gerarRenavam(),
        ano_modelo: veiculo.ano_modelo || ano,
        chassi: veiculo.chassi || gerarChassi(veiculo.marca),
        localizacao: veiculo.localizacao || determinarLocalizacao(veiculo.categoria, veiculo.marca),
        codigo: veiculo.codigo || `VEI${veiculo.placa?.substring(veiculo.placa.length - 3) || '000'}`
      }
      console.log(`Veículo ${veiculo.placa}: ${JSON.stringify(dadosGerados)}`)
      return dadosGerados
    })

    console.log(`Iniciando atualização de ${updates.length} veículos...`)
    // Atualizar em lotes de 10 para melhor monitoramento
    const batchSize = 10
    let updatedCount = 0

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      console.log(`Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`)
      
      for (const update of batch) {
        console.log(`Atualizando veículo ID: ${update.id}`)
        const { data, error: updateError } = await supabase
          .from('frota_veiculos')
          .update({
            renavam: update.renavam,
            ano_modelo: update.ano_modelo,
            chassi: update.chassi,
            localizacao: update.localizacao,
            codigo: update.codigo
          })
          .eq('id', update.id)
          .select('id, placa')

        if (updateError) {
          console.error(`ERRO ao atualizar veículo ${update.id}:`, updateError)
        } else {
          console.log(`SUCESSO - Veículo atualizado:`, data)
          updatedCount++
        }
      }
    }

    console.log(`Processo concluído! ${updatedCount} de ${updates.length} veículos atualizados`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updatedCount} veículos atualizados com sucesso`,
        totalProcessados: veiculos.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})