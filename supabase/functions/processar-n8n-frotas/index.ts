import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VeiculoN8N {
  codigo?: string;
  placa: string;
  modelo?: string;
  chassi?: string;
  renavam?: string;
  marca?: string;
  ano?: number;
  proprietario?: string;
  proprietario_doc?: string;
  proprietario_tipo?: string;
  localizacao?: string;
  familia?: string;
  funcao?: string;
  status?: string;
  status_seguro?: string;
  combustivel?: string;
  codigo_fipe?: string;
  uf_emplacamento?: string;
  preco_nf?: number;
  preco_fipe?: number;
  data_venc_emplacamento?: string;
  modalidade_compra?: string;
  observacoes?: string;
  origem_planilha?: string;
}

interface N8NData {
  empresa?: any;
  apolice?: {
    tipo_beneficio: string;
    status: string;
  };
  veiculos: VeiculoN8N[];
  empresaId?: string; // ID direto da empresa
  userEmail?: string; // Email do usuário
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION: Processar N8N Frotas ===')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Inicializando cliente Supabase...')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Lendo dados do N8N...')
    const n8nData: N8NData = await req.json()
    console.log('Dados recebidos:', JSON.stringify(n8nData, null, 2))

    if (!n8nData.veiculos || !Array.isArray(n8nData.veiculos)) {
      console.log('ERRO: Dados de veículos não encontrados ou inválidos')
      return new Response(
        JSON.stringify({ error: 'Dados de veículos não encontrados ou inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Primeiro, verificar se empresaId foi fornecido diretamente
    let empresaId: string | null = n8nData.empresaId || null;
    
    if (empresaId) {
      console.log('EmpresaId fornecido diretamente:', empresaId);
    } else {
      // Tentar obter empresa do usuário autenticado (se houver token)
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { data: { user } } = await (supabase.auth as any).getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          console.log('Usuário autenticado encontrado:', user.id);
          
          // Buscar empresa do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('company')
            .eq('id', user.id)
            .single();
            
          if (userData?.company) {
            const { data: empresa } = await supabase
              .from('empresas')
              .select('id')
              .eq('nome', userData.company)
              .single();
              
            if (empresa) {
              empresaId = empresa.id;
              console.log('Empresa encontrada:', empresaId);
            }
          }
        }
      }
    }

    // Se não encontrou empresa pelo usuário, tentar usar uma empresa padrão ou criar
    if (!empresaId) {
      console.log('Empresa não encontrada, usando empresa padrão ou criando...');
      
      // Verificar se há uma empresa com nome "N8N_IMPORT" ou similar
      const { data: empresaDefault } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', 'ESCAVE_BAHIA')
        .single();
        
      if (empresaDefault) {
        empresaId = empresaDefault.id;
        console.log('Usando empresa padrão ESCAVE_BAHIA:', empresaId);
      } else {
        // Criar empresa padrão se não existir
        const { data: novaEmpresa, error: empresaError } = await supabase
          .from('empresas')
          .insert({
            nome: 'ESCAVE_BAHIA',
            cnpj: '00000000000001',
            contato_rh_nome: 'Sistema N8N',
            contato_rh_email: 'n8n@escave.com.br'
          })
          .select('id')
          .single();
          
        if (empresaError) {
          console.error('Erro ao criar empresa padrão:', empresaError);
          throw empresaError;
        }
        
        empresaId = novaEmpresa.id;
        console.log('Empresa padrão criada:', empresaId);
      }
    }

    console.log(`Processando ${n8nData.veiculos.length} veículos...`);
    
    // Função para normalizar categoria
    const normalizarCategoria = (categoria: string): string => {
      const cat = (categoria || '').toLowerCase().trim();
      
      // Mapeamento de categorias
      if (cat.includes('moto') || cat.includes('motocicleta') || cat.includes('bicicleta motor')) {
        return 'Moto';
      }
      
      if (cat.includes('caminhão') || cat.includes('caminhao') || cat.includes('rebocador') ||
          cat.includes('reboque') || cat.includes('semi-reboque') || cat.includes('truck') ||
          cat.includes('trator')) {
        return 'Caminhão';
      }
      
      // Carros (passeio, utilitário, picape, van, etc.)
      return 'Carros';
    };

    // Normaliza datas para ISO (YYYY-MM-DD) para evitar falha de inserção em colunas DATE
    const normalizarDataISO = (valor?: string): string | null => {
      if (!valor) return null;
      const v = String(valor).trim();
      if (!v) return null;

      // ISO date (ou datetime)
      const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

      // DD/MM/YYYY ou DD-MM-YYYY
      const br = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (br) {
        const dd = br[1].padStart(2, '0');
        const mm = br[2].padStart(2, '0');
        const yyyy = br[3].length === 2 ? `20${br[3]}` : br[3];
        return `${yyyy}-${mm}-${dd}`;
      }

      // Qualquer outro formato: descartar para não quebrar o lote
      return null;
    };

    // Normaliza status_seguro para valores aceitos pela constraint: 'segurado', 'sem_seguro', 'cotacao'
    const normalizarStatusSeguro = (status?: string): string => {
      if (!status) return 'sem_seguro';
      const s = String(status).toLowerCase().trim();
      
      // Mapeamentos aceitos
      if (s === 'segurado' || s === 'com_seguro' || s === 'com seguro' || s.includes('segur')) {
        return 'segurado';
      }
      if (s === 'cotacao' || s === 'cotação' || s.includes('cota')) {
        return 'cotacao';
      }
      // Padrão
      return 'sem_seguro';
    };

    // Normaliza proprietario_tipo para valores aceitos pela constraint: 'pj', 'pf'
    const normalizarProprietarioTipo = (tipo?: string): string | null => {
      if (!tipo) return null;
      const t = String(tipo).toLowerCase().trim();
      
      // Mapeamentos aceitos
      if (t === 'pj' || t === 'cnpj' || t.includes('juridica') || t.includes('jurídica')) {
        return 'pj';
      }
      if (t === 'pf' || t === 'cpf' || t.includes('fisica') || t.includes('física')) {
        return 'pf';
      }
      // Fallback
      return null;
    };
    
    // Mapear e normalizar dados dos veículos
    const veiculosProcessados = n8nData.veiculos.map((veiculo, index) => {
      console.log(`Processando veículo ${index + 1}: ${veiculo.placa}`);
      
      // Mapear campos do N8N para campos da tabela
      // Gerar código de chassi único se não houver placa
      const placaFinal = veiculo.placa?.trim() || (veiculo.chassi ? `CHASSI_${veiculo.chassi.slice(-8)}` : `SEM_PLACA_${index}`);
      
      const veiculoMapeado = {
        empresa_id: empresaId,
        placa: placaFinal,
        marca: veiculo.marca || null,
        modelo: veiculo.modelo || null,
        categoria: normalizarCategoria(veiculo.familia || 'Carros'), // Normalizar categoria
        funcao: veiculo.funcao || veiculo.familia || null, // Guardar função/categoria original
        ano_modelo: veiculo.ano || null,
        chassi: veiculo.chassi || null,
        renavam: veiculo.renavam || null,
        codigo: veiculo.codigo || null,
        codigo_fipe: veiculo.codigo_fipe || null,
        combustivel: veiculo.combustivel || null,
        uf_emplacamento: veiculo.uf_emplacamento || null,
        localizacao: veiculo.localizacao || null,
        proprietario_nome: veiculo.proprietario || null,
        proprietario_doc: veiculo.proprietario_doc || null,
        proprietario_tipo: normalizarProprietarioTipo(veiculo.proprietario_tipo) || (veiculo.proprietario ? 'pj' : null),
        status_veiculo: veiculo.status || 'ativo',
        status_seguro: normalizarStatusSeguro(veiculo.status_seguro),
        preco_nf: veiculo.preco_nf || null,
        preco_fipe: veiculo.preco_fipe || null,
        data_venc_emplacamento: normalizarDataISO(veiculo.data_venc_emplacamento),
        modalidade_compra: veiculo.modalidade_compra || null,
        origem_planilha: veiculo.origem_planilha || 'N8N',
        observacoes: veiculo.observacoes || null
      };
      
      console.log(`Veículo mapeado:`, veiculoMapeado);
      return veiculoMapeado;
    });

    console.log('Inserindo veículos no banco de dados...');

    // Deduplicar placas dentro do payload (a planilha pode repetir veículos)
    const mapaUnicos = new Map<string, any>();
    let duplicadosPlanilha = 0;

    for (const v of veiculosProcessados) {
      const key = String(v.placa || '').trim();
      if (!key) continue;

      const existente = mapaUnicos.get(key);
      if (!existente) {
        mapaUnicos.set(key, v);
        continue;
      }

      duplicadosPlanilha += 1;

      // Merge conservador: só preenche campos vazios com valores não vazios do duplicado
      for (const [k, val] of Object.entries(v)) {
        if (val === null || val === undefined || val === '') continue;
        const atual = (existente as any)[k];
        if (atual === null || atual === undefined || atual === '') {
          (existente as any)[k] = val;
        }
      }
    }

    const veiculosUnicos = Array.from(mapaUnicos.values());
    console.log(`Veículos únicos para inserção: ${veiculosUnicos.length} (duplicados na planilha: ${duplicadosPlanilha})`);

    // Verificar quantos já existem no banco (para relatório)
    let jaExistiamNoBanco = 0;
    try {
      if (empresaId && veiculosUnicos.length > 0) {
        const placas = Array.from(mapaUnicos.keys());
        const { data: existentes, error: existErr } = await supabase
          .from('frota_veiculos')
          .select('placa')
          .eq('empresa_id', empresaId)
          .in('placa', placas);

        if (existErr) {
          console.warn('Aviso: erro ao verificar veículos já existentes:', existErr);
        } else {
          jaExistiamNoBanco = existentes?.length || 0;
        }
      }
    } catch (e) {
      console.warn('Aviso: falha ao verificar veículos já existentes:', e);
    }

    // Inserir veículos em lotes para melhor performance
    const batchSize = 50;
    let veiculosInseridos = 0;
    let errosInsercao = 0;
    const errosDetalhados = [];

    for (let i = 0; i < veiculosUnicos.length; i += batchSize) {
      const lote = veiculosUnicos.slice(i, i + batchSize);
      console.log(`Inserindo lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(veiculosUnicos.length/batchSize)} (${lote.length} veículos)`);

      // Upsert com ignoreDuplicates evita falha por placa repetida (único por empresa_id + placa)
      const { data, error } = await supabase
        .from('frota_veiculos')
        .upsert(lote, { onConflict: 'empresa_id,placa', ignoreDuplicates: true })
        .select('id, placa');

      if (error) {
        console.error(`Erro no lote ${Math.floor(i/batchSize) + 1}:`, error);
        errosInsercao += lote.length;
        errosDetalhados.push({
          lote: Math.floor(i/batchSize) + 1,
          erro: error.message,
          veiculos: lote.map(v => v.placa)
        });
      } else {
        console.log(`Lote ${Math.floor(i/batchSize) + 1} inserido com sucesso:`, data?.length || 0, 'veículos');
        veiculosInseridos += data?.length || 0;
      }
    }

    // Depois da inserção, chamar função de preenchimento de dados vazios
    console.log('Chamando função para preencher dados vazios...');
    let dadosPreenchidos = 0;
    
    if (veiculosInseridos > 0 && empresaId) {
      try {
        const preencherResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/preencher-dados-veiculos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ empresaId })
        });

        if (preencherResponse.ok) {
          const preencherResult = await preencherResponse.json();
          console.log('Resultado do preenchimento:', preencherResult);
          dadosPreenchidos = preencherResult.totalProcessados || 0;
        } else {
          console.warn('Erro ao chamar função de preenchimento:', await preencherResponse.text());
        }
      } catch (error) {
        console.warn('Erro ao chamar função de preenchimento:', error);
      }
    }

    const resultado = {
      success: errosInsercao === 0,
      message: `Processamento concluído: ${veiculosInseridos} veículos inseridos${jaExistiamNoBanco > 0 ? `, ${jaExistiamNoBanco} já existiam no banco` : ''}${duplicadosPlanilha > 0 ? `, ${duplicadosPlanilha} duplicados na planilha` : ''}${errosInsercao > 0 ? `, ${errosInsercao} erros` : ''}${dadosPreenchidos > 0 ? `, ${dadosPreenchidos} campos vazios preenchidos automaticamente` : ''}`,
      detalhes: {
        total_recebidos: n8nData.veiculos.length,
        total_unicos: veiculosUnicos.length,
        duplicados_planilha: duplicadosPlanilha,
        ja_existiam_no_banco: jaExistiamNoBanco,
        veiculos_inseridos: veiculosInseridos,
        erros_insercao: errosInsercao,
        empresa_id: empresaId,
        dados_preenchidos: dadosPreenchidos
      },
      erros: errosDetalhados.length > 0 ? errosDetalhados : undefined
    };

    console.log('Resultado final:', resultado);

    return new Response(
      JSON.stringify(resultado),
      { 
        status: errosInsercao === 0 ? 200 : 207, // 207 = Multi-Status (sucesso parcial)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Erro interno no processamento dos dados'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})