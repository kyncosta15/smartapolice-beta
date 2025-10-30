import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const CORPNUVEM_API_URL = 'https://api.corpnuvem.com';

// Cache do token de autenticação
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Função para obter token de autenticação
async function getAuthToken(): Promise<string> {
  const now = Date.now();
  
  // Se já temos um token válido no cache, retornar
  if (cachedToken && tokenExpiry > now) {
    console.log('✅ Usando token em cache');
    return cachedToken;
  }

  console.log('🔄 Obtendo novo token de autenticação...');

  const username = Deno.env.get('CORPNUVEM_USERNAME');
  const password = Deno.env.get('CORPNUVEM_PASSWORD');

  if (!username || !password) {
    throw new Error('Credenciais CorpNuvem não configuradas');
  }

  const response = await fetch(`${CORPNUVEM_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: username,
      senha: password,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro no login:', errorText);
    throw new Error(`Falha na autenticação: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.token) {
    throw new Error('Token não retornado pela API');
  }

  // Cachear token por 50 minutos (3000000 ms)
  cachedToken = data.token;
  tokenExpiry = now + 3000000;
  
  console.log('✅ Novo token obtido com sucesso');
  return cachedToken;
}

// Função auxiliar para fazer chamadas à API com retry automático
async function corpNuvemFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Se receber 401, limpar cache e tentar novamente com novo token
  if (response.status === 401) {
    console.log('⚠️ Token expirado, renovando...');
    cachedToken = null;
    tokenExpiry = 0;
    
    const newToken = await getAuthToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        'Authorization': newToken,
      },
    });
  }

  return response;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Nenhum token de autorização fornecido');
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
      return new Response(
        JSON.stringify({ error: `Erro de autenticação: ${authError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);

    const { documento } = await req.json();

    if (!documento) {
      return new Response(
        JSON.stringify({ error: 'Documento (CPF/CNPJ) é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Iniciando sincronização para documento: ${documento}`);

    // Limpar documento
    const cleanDocument = documento.replace(/\D/g, '');
    const isCPF = cleanDocument.length === 11;

    // PASSO 1: Buscar cliente pelo documento para obter o nome
    const clienteEndpoint = isCPF 
      ? `${CORPNUVEM_API_URL}/busca_cpf?cpf_cnpj=${cleanDocument}`
      : `${CORPNUVEM_API_URL}/busca_cnpj?cpf_cnpj=${cleanDocument}`;
    
    console.log(`🔍 Buscando cliente: ${clienteEndpoint}`);
    
    const clienteResponse = await corpNuvemFetch(clienteEndpoint);
    
    if (!clienteResponse.ok) {
      const errorBody = await clienteResponse.text();
      console.error(`❌ Erro ao buscar cliente - Body: ${errorBody}`);
      throw new Error(`Erro ao buscar cliente: ${clienteResponse.statusText}`);
    }

    const clienteData = await clienteResponse.json();
    console.log(`📦 Dados do cliente:`, JSON.stringify(clienteData, null, 2));

    // Extrair nome do cliente - ajustado para estrutura correta da API
    let nomeCliente = '';
    if (Array.isArray(clienteData) && clienteData.length > 0) {
      nomeCliente = clienteData[0].nome || clienteData[0].cliente || '';
    } else if (clienteData?.cliente?.nome) {
      // API retorna { cliente: { nome: "..." } }
      nomeCliente = clienteData.cliente.nome;
    } else if (clienteData?.nome) {
      nomeCliente = clienteData.nome;
    }

    if (!nomeCliente) {
      console.error('❌ Nome do cliente não encontrado');
      throw new Error('Cliente não encontrado na base CorpNuvem');
    }

    console.log(`✅ Cliente encontrado: ${nomeCliente}`);

    // PASSO 2: Buscar apólices usando o endpoint /producao
    // Definir período amplo para pegar todas as apólices
    const dataInicial = '01/01/2015';
    const dataFinal = '01/01/2027';
    
    const producaoUrl = `${CORPNUVEM_API_URL}/producao?texto=${encodeURIComponent(nomeCliente)}&dt_ini=${dataInicial}&dt_fim=${dataFinal}&ordem=inivig&orientacao=asc&so_renovados=t&so_emitidos=x`;
    console.log(`📄 Buscando produção: ${producaoUrl}`);

    const producaoResponse = await corpNuvemFetch(producaoUrl);

    if (!producaoResponse.ok) {
      const errorBody = await producaoResponse.text();
      console.error(`❌ Erro ao buscar produção - Body: ${errorBody}`);
      throw new Error(`Erro ao buscar produção: ${producaoResponse.statusText}`);
    }

    const producaoData = await producaoResponse.json();
    console.log(`📦 Produção encontrada:`, JSON.stringify(producaoData, null, 2));

    const apolices = producaoData?.producao || [];
    console.log(`📋 Total de registros encontrados: ${apolices.length}`);
    
    // FILTRAR APENAS APÓLICES ATIVAS (tipo "A")
    // Tipo "C" = Cancelamento/Endosso, "M" = Modificação não devem ser processados
    const apolicesAtivas = apolices.filter((ap: any) => ap.tipdoc === 'A');
    console.log(`📋 Apólices ativas (tipo A): ${apolicesAtivas.length}`);
    console.log(`⏭️  Ignorando ${apolices.length - apolicesAtivas.length} endossos (tipo C/M)`);

    let syncedCount = 0;
    let errorCount = 0;

    // PASSO 3: Para cada apólice ATIVA, buscar detalhes completos
    for (const ap of apolicesAtivas) {
      try {
        console.log(`🔄 Processando apólice nosnum: ${ap.nosnum}, codfil: ${ap.codfil}, renovacao_situacao: ${ap.renovacao_situacao}`);

        // Buscar detalhes completos da apólice
        let detalhesApolice = null;
        if (ap.codfil && ap.nosnum) {
          const documentoUrl = `${CORPNUVEM_API_URL}/documento?codfil=${ap.codfil}&nosnum=${ap.nosnum}`;
          console.log(`📄 Buscando detalhes: ${documentoUrl}`);
          
          try {
            const detalhesResponse = await corpNuvemFetch(documentoUrl);
            
            if (detalhesResponse.ok) {
              const responseData = await detalhesResponse.json();
              console.log(`✅ Resposta da API:`, JSON.stringify(responseData, null, 2));
              
              // Extrair o primeiro documento do array
              if (responseData?.documento && Array.isArray(responseData.documento) && responseData.documento.length > 0) {
                detalhesApolice = responseData.documento[0];
                console.log(`✅ Detalhes da apólice ${ap.nosnum} extraídos com sucesso`);
              } else {
                console.warn(`⚠️ Estrutura inesperada na resposta da API para apólice ${ap.nosnum}`);
              }
            }
          } catch (err) {
            console.warn(`⚠️ Erro ao buscar detalhes da apólice ${ap.nosnum}:`, err);
          }
        }

        // Função auxiliar para converter data BR (DD/MM/YYYY) para ISO (YYYY-MM-DD)
        const convertBRDateToISO = (dateStr: string | null): string | null => {
          if (!dateStr) return null;
          
          // Já está em formato ISO?
          if (dateStr.includes('-')) return dateStr;
          
          // Formato DD/MM/YYYY
          const parts = dateStr.split('/');
          if (parts.length !== 3) return null;
          
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };

        // Determinar status baseado na data de vencimento
        const determineStatusFromDate = (fimVigencia: string | null): string => {
          if (!fimVigencia) return 'vigente';
          
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const fimVigISO = convertBRDateToISO(fimVigencia);
          if (!fimVigISO) return 'vigente';
          
          const expDate = new Date(fimVigISO);
          expDate.setHours(0, 0, 0, 0);
          
          if (isNaN(expDate.getTime())) return 'vigente';
          
          const diffTime = expDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) return 'vencida';
          if (diffDays <= 30) return 'vence_30_dias';
          if (diffDays <= 60) return 'vence_60_dias';
          if (diffDays <= 90) return 'vence_90_dias';
          return 'vigente';
        };

        // Determinar status válido considerando cancelamento E data de vencimento
        let statusPolicy = 'vigente';
        if (ap.cancelado === 'S') {
          statusPolicy = 'vencida';
        } else {
          // Se não cancelada, determinar status pela data
          statusPolicy = determineStatusFromDate(ap.fimvig);
        }

        // Calcular valor da parcela
        const numParcelas = parseInt(detalhesApolice?.numpar) || 0;
        const valorPremioTotal = parseFloat(detalhesApolice?.pretot) || 0;
        const valorPremioLiquido = parseFloat(detalhesApolice?.preliq) || 0;
        
        console.log(`📊 Dados brutos da API - numpar: ${detalhesApolice?.numpar}, pretot: ${detalhesApolice?.pretot}, preliq: ${detalhesApolice?.preliq}`);
        console.log(`📦 Parcelas disponíveis:`, detalhesApolice?.parcelas?.length || 0);
        
        let valorParcela = 0;
        if (detalhesApolice?.parcelas && Array.isArray(detalhesApolice.parcelas) && detalhesApolice.parcelas.length > 0) {
          // Usar valor real da primeira parcela
          const vlvencParcela = detalhesApolice.parcelas[0].vlvenc;
          console.log(`💵 Valor primeira parcela (vlvenc): ${vlvencParcela}`);
          valorParcela = parseFloat(vlvencParcela) || 0;
        } else if (valorPremioLiquido > 0 && numParcelas > 0) {
          // Fallback: dividir pelo número correto de parcelas
          valorParcela = parseFloat((valorPremioLiquido / numParcelas).toFixed(2));
          console.log(`⚠️ Usando cálculo fallback - valorParcela: ${valorParcela}`);
        }

        console.log(`✅ Dados financeiros finais - Prêmio Total: ${valorPremioTotal}, Parcelas: ${numParcelas}, Valor Parcela: ${valorParcela}`);

        // Determinar se foi renovada
        // renovacao_situacao: 1 = Nova, 2 = Renovada, 3 = Não renovada
        const foiRenovada = ap.renovacao_situacao !== 3;
        console.log(`🔄 Apólice ${ap.nosnum} - renovacao_situacao: ${ap.renovacao_situacao}, foiRenovada: ${foiRenovada}`);
        
        // Normalizar dados para tabela policies
        const policyData = {
          user_id: user.id,
          documento: cleanDocument,
          segurado: nomeCliente,
          seguradora: detalhesApolice?.seguradora || ap.seguradora || '',
          numero_apolice: ap.numapo || detalhesApolice?.numapo || uniqueIdentifier,
          tipo_seguro: detalhesApolice?.ramo || ap.ramo || 'Não especificado',
          inicio_vigencia: convertBRDateToISO(ap.inivig || detalhesApolice?.inivig),
          fim_vigencia: convertBRDateToISO(ap.fimvig || detalhesApolice?.fimvig),
          valor_premio: valorPremioTotal,
          valor_parcela: valorParcela,
          quantidade_parcelas: numParcelas,
          status: statusPolicy,
          renovada: foiRenovada,
          corretora: 'RCaldas Corretora de Seguros',
          extraction_timestamp: new Date().toISOString(),
          created_by_extraction: true,
          responsavel_nome: nomeCliente,
          nosnum: ap.nosnum,
          codfil: ap.codfil,
        };

        console.log(`💾 Salvando apólice:`, policyData);

        // Verificar se já existe uma apólice com este numero_apolice + documento
        const { data: existingPolicy } = await supabaseClient
          .from('policies')
          .select('id')
          .eq('user_id', user.id)
          .eq('documento', cleanDocument)
          .eq('numero_apolice', policyData.numero_apolice)
          .maybeSingle();

        if (existingPolicy) {
          // Atualizar apólice existente
          const { error: updateError } = await supabaseClient
            .from('policies')
            .update(policyData)
            .eq('id', existingPolicy.id);

          if (updateError) {
            console.error(`❌ FALHA AO ATUALIZAR - nosnum: ${ap.nosnum}, numero_apolice: ${policyData.numero_apolice}`);
            console.error(`❌ Código do erro:`, updateError.code);
            console.error(`❌ Mensagem:`, updateError.message);
            console.error(`❌ Detalhes:`, updateError.details);
            errorCount++;
          } else {
            console.log(`✅ Apólice ${policyData.numero_apolice} (nosnum: ${ap.nosnum}) atualizada com sucesso`);
            syncedCount++;
          }
        } else {
          // Inserir nova apólice
          const { error: insertError } = await supabaseClient
            .from('policies')
            .insert(policyData);

          if (insertError) {
            console.error(`❌ FALHA AO INSERIR - nosnum: ${ap.nosnum}, numero_apolice: ${policyData.numero_apolice}`);
            console.error(`❌ Código do erro:`, insertError.code);
            console.error(`❌ Mensagem:`, insertError.message);
            console.error(`❌ Detalhes:`, insertError.details);
            errorCount++;
          } else {
            console.log(`✅ Apólice ${policyData.numero_apolice} (nosnum: ${ap.nosnum}) sincronizada com sucesso`);
            syncedCount++;
          }
        }
      } catch (err) {
        console.error(`❌ ERRO AO PROCESSAR - nosnum: ${ap.nosnum}, codfil: ${ap.codfil}`);
        console.error(`❌ Erro completo:`, err);
        console.error(`❌ Stack:`, err instanceof Error ? err.stack : 'N/A');
        errorCount++;
      }
    }

    console.log(`✅ Sincronização concluída: ${syncedCount} apólices ativas processadas, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída',
        synced: syncedCount,
        errors: errorCount,
        total: apolices.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
