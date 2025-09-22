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

    // Função para gerar RENAVAM mais realista (11 dígitos)
    const gerarRenavam = () => {
      // Gerar RENAVAM com padrão mais realista baseado em faixas reais
      const prefixo = Math.floor(1000000000 + Math.random() * 8999999999) // 10 dígitos
      const dv = Math.floor(Math.random() * 10) // Dígito verificador
      return prefixo.toString() + dv.toString()
    }

    // Função para gerar chassi mais realista (17 caracteres)
    const gerarChassi = (marca: string, ano?: number) => {
      const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ1234567890'
      const fabricantes: { [key: string]: string } = {
        'HONDA': '9HC',
        'VW': '9BW',
        'VOLKSWAGEN': '9BW',
        'FIAT': '9BD',
        'FORD': '9BF',
        'GM': '9BG',
        'CHEVROLET': '9BG',
        'TOYOTA': '9BR',
        'MERCEDES': '9BM',
        'M.BENZ': '9BM',
        'VOLVO': 'YV1',
        'YAMAHA': '9CY',
        'SUZUKI': '9CS',
        'KAWASAKI': '9CK',
        'IVECO': '9BH',
        'EFFA': '9BX'
      }
      
      // Normalizar marca
      let marcaNormalizada = marca?.toUpperCase().trim() || 'DEFAULT'
      if (marcaNormalizada.includes('HONDA')) marcaNormalizada = 'HONDA'
      if (marcaNormalizada.includes('VW') || marcaNormalizada.includes('VOLKSWAGEN')) marcaNormalizada = 'VW'
      if (marcaNormalizada.includes('FIAT')) marcaNormalizada = 'FIAT'
      if (marcaNormalizada.includes('FORD')) marcaNormalizada = 'FORD'
      
      const prefixo = fabricantes[marcaNormalizada] || '9BX'
      let chassi = prefixo
      
      // Adicionar dígitos específicos por posição
      for (let i = 3; i < 17; i++) {
        if (i === 8 && ano) {
          // 9ª posição representa ano (código específico)
          const anosChar: { [key: number]: string } = {
            2018: 'J', 2019: 'K', 2020: 'L', 2021: 'M', 
            2022: 'N', 2023: 'P', 2024: 'R', 2025: 'S'
          }
          chassi += anosChar[ano] || 'M'
        } else if (i === 10) {
          // 11ª posição - número sequencial de produção
          chassi += Math.floor(Math.random() * 10).toString()
        } else {
          chassi += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      
      return chassi
    }

    // Função para determinar ano mais preciso baseado na placa e marca
    const determinarAno = (placa: string, createdAt: string, marca: string, modelo: string) => {
      if (!placa || placa === 'FALTAPLACA') return 2020
      
      // Para motos Honda mais recentes
      if (marca?.includes('HONDA') && modelo?.includes('CG')) {
        // Placa Mercosul (formato: ABC1D23) - mais recente
        if (placa.match(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/)) {
          const letra = placa[4]
          // Mapear letras para anos mais precisos
          const mapeamento: { [key: string]: number } = {
            'A': 2018, 'B': 2019, 'C': 2020, 'D': 2020, 
            'E': 2021, 'F': 2021, 'G': 2022, 'H': 2022,
            'I': 2023, 'J': 2023, 'K': 2024, 'L': 2024
          }
          return mapeamento[letra] || 2022
        }
      }
      
      // Placa Mercosul geral
      if (placa.match(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/)) {
        return 2019 + Math.floor(Math.random() * 5) // 2019-2024
      }
      
      // Placas antigas - anos anteriores
      const anoCreacao = new Date(createdAt).getFullYear()
      return Math.max(2015, anoCreacao - Math.floor(Math.random() * 3))
    }

    // Função para determinar localização mais realista
    const determinarLocalizacao = (categoria: string, marca: string) => {
      const localizacoes: { [key: string]: string[] } = {
        'moto': ['SEDE SALVADOR-BA', 'FILIAL LAURO DE FREITAS-BA', 'CAMPO ITAPUÃ-BA'],
        'carro': ['SEDE SALVADOR-BA', 'ESCRITÓRIO PELOURINHO-BA', 'UNIDADE PITUBA-BA'],
        'utilitario': ['OBRA CENTRO-BA', 'OBRA PITUBA-BA', 'CAMPO PARALELA-BA'],
        'caminhao': ['PÁTIO PARALELA-BA', 'OBRA PORTO-BA', 'TERMINAL SUBURBANA-BA'],
        'outros': ['DEPÓSITO FEIRA-BA', 'PÁTIO CAMAÇARI-BA', 'MANUTENÇÃO-BA']
      }
      
      const opcoes = localizacoes[categoria] || localizacoes['outros']
      return opcoes[Math.floor(Math.random() * opcoes.length)]
    }

    // Função para gerar código mais inteligente
    const gerarCodigo = (placa: string, categoria: string, marca: string) => {
      const prefixos: { [key: string]: string } = {
        'moto': 'MOTO',
        'carro': 'AUTO', 
        'utilitario': 'UTIL',
        'caminhao': 'CAM',
        'outros': 'VEI'
      }
      
      const prefixo = prefixos[categoria] || 'VEI'
      const sufixo = placa?.length >= 3 ? placa.slice(-3) : '000'
      return `${prefixo}${sufixo}`
    }

    console.log('Preparando atualizações...')
    // Atualizar veículos em lotes
    const updates = veiculos.map(veiculo => {
      const ano = determinarAno(veiculo.placa, veiculo.created_at, veiculo.marca || '', veiculo.modelo || '')
      const dadosGerados = {
        id: veiculo.id,
        renavam: veiculo.renavam || gerarRenavam(),
        ano_modelo: veiculo.ano_modelo || ano,
        chassi: veiculo.chassi || gerarChassi(veiculo.marca, ano),
        localizacao: veiculo.localizacao || determinarLocalizacao(veiculo.categoria, veiculo.marca),
        codigo: veiculo.codigo || gerarCodigo(veiculo.placa, veiculo.categoria, veiculo.marca)
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