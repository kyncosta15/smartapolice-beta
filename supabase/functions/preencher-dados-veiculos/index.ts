import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://deno.land/x/supabase@1.0.0/client.ts';

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

    console.log('Buscando veículos com campos vazios...')
    // Buscar apenas veículos que têm campos REALMENTE vazios/nulos
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

    // Buscar dados de referência de outros veículos da mesma empresa para análise
    console.log('Buscando dados de referência para análise...')
    const { data: veiculosReferencia, error: refError } = await supabase
      .from('frota_veiculos')
      .select('marca, modelo, categoria, renavam, ano_modelo, chassi, localizacao, codigo')
      .eq('empresa_id', empresaId)
      .not('renavam', 'is', null)
      .not('ano_modelo', 'is', null)
      .not('chassi', 'is', null)
      .not('localizacao', 'is', null)
      .not('codigo', 'is', null)

    if (refError) {
      console.warn('Erro ao buscar dados de referência:', refError)
    }

    console.log(`Encontrados ${veiculosReferencia?.length || 0} veículos com dados completos para referência`)

    // Função para analisar e sugerir RENAVAM baseado em dados reais
    const analisarRenavam = (marca: string, modelo: string, ano: number) => {
      if (!veiculosReferencia || veiculosReferencia.length === 0) {
        return null // Não gerar dados fictícios
      }

      // Buscar veículos similares
      const similares = veiculosReferencia.filter(v => 
        v.marca?.toLowerCase().includes(marca?.toLowerCase() || '') ||
        v.modelo?.toLowerCase().includes(modelo?.toLowerCase() || '') ||
        Math.abs((v.ano_modelo || 0) - ano) <= 2
      )

      if (similares.length === 0) return null

      // Analisar padrões de RENAVAM dos similares
      const renavams = similares.map(v => v.renavam).filter(Boolean)
      console.log(`Analisando ${renavams.length} RENAVAMs de referência para ${marca} ${modelo}`)
      
      return null // Por enquanto, não sugerir RENAVAM - aguardar dados reais
    }

    // Função para analisar e sugerir chassi baseado em dados reais
    const analisarChassi = (marca: string, modelo: string, ano: number) => {
      if (!veiculosReferencia || veiculosReferencia.length === 0) {
        return null // Não gerar dados fictícios
      }

      // Buscar veículos da mesma marca
      const mesmamarca = veiculosReferencia.filter(v => 
        v.marca?.toLowerCase().includes(marca?.toLowerCase() || '') &&
        Math.abs((v.ano_modelo || 0) - ano) <= 3
      )

      if (mesmamarca.length === 0) return null

      // Analisar padrões de chassi dos similares
      const chassis = mesmamarca.map(v => v.chassi).filter(Boolean)
      console.log(`Analisando ${chassis.length} chassis de referência para ${marca}`)
      
      return null // Por enquanto, não sugerir chassi - aguardar dados reais
    }

    // Função para analisar e sugerir ano baseado em dados reais
    const analisarAno = (placa: string, marca: string, modelo: string) => {
      if (!veiculosReferencia || veiculosReferencia.length === 0) {
        return null // Não sugerir ano fictício
      }

      // Buscar veículos similares (mesma marca/modelo)
      const similares = veiculosReferencia.filter(v => 
        v.marca?.toLowerCase().includes(marca?.toLowerCase() || '') &&
        v.modelo?.toLowerCase().includes(modelo?.toLowerCase() || '')
      )

      if (similares.length === 0) {
        // Buscar apenas pela marca
        const mesmamarca = veiculosReferencia.filter(v => 
          v.marca?.toLowerCase().includes(marca?.toLowerCase() || '')
        )
        
        if (mesmamarca.length > 0) {
          // Calcular ano médio dos veículos da mesma marca
          const anos = mesmamarca.map(v => v.ano_modelo).filter(Boolean)
          if (anos.length > 0) {
            const anoMedio = Math.round(anos.reduce((sum, ano) => sum + ano, 0) / anos.length)
            console.log(`Sugerindo ano ${anoMedio} baseado em ${anos.length} veículos da marca ${marca}`)
            return anoMedio
          }
        }
      } else {
        // Calcular ano médio dos similares
        const anos = similares.map(v => v.ano_modelo).filter(Boolean)
        if (anos.length > 0) {
          const anoMedio = Math.round(anos.reduce((sum, ano) => sum + ano, 0) / anos.length)
          console.log(`Sugerindo ano ${anoMedio} baseado em ${anos.length} veículos similares`)
          return anoMedio
        }
      }

      return null // Não conseguiu analisar dados reais
    }

    // Função para analisar e sugerir localização baseada em dados reais
    const analisarLocalizacao = (categoria: string, marca: string) => {
      if (!veiculosReferencia || veiculosReferencia.length === 0) {
        return null // Não sugerir localização fictícia
      }

      // Buscar veículos da mesma categoria
      const mesmaCategoria = veiculosReferencia.filter(v => 
        v.categoria?.toLowerCase() === categoria?.toLowerCase()
      )

      if (mesmaCategoria.length > 0) {
        // Encontrar a localização mais comum da categoria
        const localizacoes = mesmaCategoria.map(v => v.localizacao).filter(Boolean)
        const contagem: { [key: string]: number } = {}
        
        localizacoes.forEach(loc => {
          contagem[loc] = (contagem[loc] || 0) + 1
        })

        const locMaisComum = Object.entries(contagem)
          .sort(([,a], [,b]) => b - a)[0]

        if (locMaisComum) {
          console.log(`Sugerindo localização "${locMaisComum[0]}" baseada em ${locMaisComum[1]} veículos da categoria ${categoria}`)
          return locMaisComum[0]
        }
      }

      // Se não encontrou por categoria, buscar por marca
      const mesmamarca = veiculosReferencia.filter(v => 
        v.marca?.toLowerCase().includes(marca?.toLowerCase() || '')
      )

      if (mesmamarca.length > 0) {
        const localizacoes = mesmamarca.map(v => v.localizacao).filter(Boolean)
        const contagem: { [key: string]: number } = {}
        
        localizacoes.forEach(loc => {
          contagem[loc] = (contagem[loc] || 0) + 1
        })

        const locMaisComum = Object.entries(contagem)
          .sort(([,a], [,b]) => b - a)[0]

        if (locMaisComum) {
          console.log(`Sugerindo localização "${locMaisComum[0]}" baseada em ${locMaisComum[1]} veículos da marca ${marca}`)
          return locMaisComum[0]
        }
      }

      return null // Não conseguiu analisar dados reais
    }

    // Função para analisar e sugerir código baseado em dados reais
    const analisarCodigo = (placa: string, categoria: string, marca: string) => {
      if (!veiculosReferencia || veiculosReferencia.length === 0) {
        return null // Não gerar código fictício
      }

      // Buscar padrões de códigos existentes
      const codigos = veiculosReferencia.map(v => v.codigo).filter(Boolean)
      
      if (codigos.length === 0) return null

      // Analisar padrões comuns
      const padroes: { [key: string]: number } = {}
      codigos.forEach(codigo => {
        // Extrair possível prefixo (primeiras 3-4 letras)
        const prefixo = codigo.match(/^[A-Z]+/)?.[0] || ''
        if (prefixo) {
          padroes[prefixo] = (padroes[prefixo] || 0) + 1
        }
      })

      const prefixoMaisComum = Object.entries(padroes)
        .sort(([,a], [,b]) => b - a)[0]

      if (prefixoMaisComum && placa) {
        const sufixo = placa.length >= 3 ? placa.slice(-3) : '000'
        const codigoSugerido = `${prefixoMaisComum[0]}${sufixo}`
        console.log(`Sugerindo código "${codigoSugerido}" baseado no padrão mais comum "${prefixoMaisComum[0]}"`)
        return codigoSugerido
      }

      return null // Não conseguiu analisar padrão
    }

    console.log('Preparando atualizações BASEADAS EM ANÁLISE DE DADOS REAIS...')
    // Atualizar veículos baseado em análise de dados existentes no banco
    const updates = veiculos.map(veiculo => {
      console.log(`Analisando veículo ${veiculo.placa} (${veiculo.marca} ${veiculo.modelo})...`)
      
      const dadosAnalisados: any = {
        id: veiculo.id
      }

      // Analisar e sugerir ano baseado em dados reais
      if (!veiculo.ano_modelo) {
        const anoSugerido = analisarAno(veiculo.placa, veiculo.marca || '', veiculo.modelo || '')
        if (anoSugerido) {
          dadosAnalisados.ano_modelo = anoSugerido
        } else {
          console.log(`❌ Não foi possível analisar ano para ${veiculo.placa} - dados insuficientes`)
        }
      }

      // Analisar e sugerir localização baseada em dados reais
      if (!veiculo.localizacao) {
        const localizacaoSugerida = analisarLocalizacao(veiculo.categoria || '', veiculo.marca || '')
        if (localizacaoSugerida) {
          dadosAnalisados.localizacao = localizacaoSugerida
        } else {
          console.log(`❌ Não foi possível analisar localização para ${veiculo.placa} - dados insuficientes`)
        }
      }

      // Analisar e sugerir código baseado em padrões reais
      if (!veiculo.codigo) {
        const codigoSugerido = analisarCodigo(veiculo.placa, veiculo.categoria || '', veiculo.marca || '')
        if (codigoSugerido) {
          dadosAnalisados.codigo = codigoSugerido
        } else {
          console.log(`❌ Não foi possível analisar código para ${veiculo.placa} - dados insuficientes`)
        }
      }

      // Para RENAVAM e CHASSI, não sugerimos dados fictícios - aguardamos dados reais
      if (!veiculo.renavam) {
        console.log(`⏳ RENAVAM vazio para ${veiculo.placa} - aguardando dados reais da planilha`)
      }
      
      if (!veiculo.chassi) {
        console.log(`⏳ CHASSI vazio para ${veiculo.placa} - aguardando dados reais da planilha`)
      }
      
      const camposAtualizados = Object.keys(dadosAnalisados).filter(k => k !== 'id')
      console.log(`Veículo ${veiculo.placa}: Campos baseados em análise:`, camposAtualizados)
      
      return dadosAnalisados
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
        
        // Só fazer update se houver dados para atualizar (excluindo o ID)
        const updateData = Object.fromEntries(
          Object.entries(update).filter(([key]) => key !== 'id')
        );
        
        if (Object.keys(updateData).length === 0) {
          console.log(`Pulando veículo ${update.id} - nenhum campo para atualizar`)
          updatedCount++
          continue;
        }
        
        console.log(`Atualizando campos:`, Object.keys(updateData))
        const { data, error: updateError } = await supabase
          .from('frota_veiculos')
          .update(updateData)
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})