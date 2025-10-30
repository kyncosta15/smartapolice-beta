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

    // PASSO 2: Buscar documentos (apólices resumidas) usando o nome
    const documentosUrl = `${CORPNUVEM_API_URL}/documentos?nome=${encodeURIComponent(nomeCliente)}`;
    console.log(`📄 Buscando documentos: ${documentosUrl}`);

    const documentosResponse = await corpNuvemFetch(documentosUrl);

    if (!documentosResponse.ok) {
      const errorBody = await documentosResponse.text();
      console.error(`❌ Erro ao buscar documentos - Body: ${errorBody}`);
      throw new Error(`Erro ao buscar documentos: ${documentosResponse.statusText}`);
    }

    const documentosData = await documentosResponse.json();
    console.log(`📦 Documentos encontrados:`, JSON.stringify(documentosData, null, 2));

    const apolices = documentosData?.documentos || [];
    console.log(`📋 Total de apólices: ${apolices.length}`);

    let syncedCount = 0;
    let errorCount = 0;

    // PASSO 3: Para cada apólice, buscar detalhes completos
    for (const ap of apolices) {
      try {
        console.log(`🔄 Processando apólice nosnum: ${ap.nosnum}, codfil: ${ap.codfil}`);

        // Buscar detalhes completos da apólice
        let detalhesApolice = null;
        if (ap.codfil && ap.nosnum) {
          const documentoUrl = `${CORPNUVEM_API_URL}/documento?codfil=${ap.codfil}&nosnum=${ap.nosnum}`;
          console.log(`📄 Buscando detalhes: ${documentoUrl}`);
          
          try {
            const detalhesResponse = await corpNuvemFetch(documentoUrl);
            
            if (detalhesResponse.ok) {
              detalhesApolice = await detalhesResponse.json();
              console.log(`✅ Detalhes da apólice ${ap.nosnum}:`, JSON.stringify(detalhesApolice, null, 2));
            }
          } catch (err) {
            console.warn(`⚠️ Erro ao buscar detalhes da apólice ${ap.nosnum}:`, err);
          }
        }

        // Normalizar dados para tabela policies
        const policyData = {
          user_id: user.id,
          documento: cleanDocument,
          segurado: nomeCliente,
          seguradora: ap.seguradora || detalhesApolice?.seguradora || '',
          numero_apolice: ap.numapo || detalhesApolice?.numapo || ap.nosnum?.toString() || '',
          tipo_seguro: ap.ramo || detalhesApolice?.ramo || 'Não especificado',
          inicio_vigencia: ap.inivig || detalhesApolice?.inivig || null,
          fim_vigencia: ap.fimvig || detalhesApolice?.fimvig || null,
          valor_premio: detalhesApolice?.prtot ? parseFloat(detalhesApolice.prtot) : 0,
          valor_parcela: detalhesApolice?.prliq ? parseFloat((detalhesApolice.prliq / 12).toFixed(2)) : 0,
          quantidade_parcelas: 12,
          status: ap.cancelado === 'S' ? 'Cancelada' : 
                  ap.sin_situacao === 1 ? 'Ativa' : 'Pendente',
          corretora: 'RCaldas Corretora de Seguros',
          extraction_timestamp: new Date().toISOString(),
          created_by_extraction: true,
          responsavel_nome: nomeCliente,
        };

        console.log(`💾 Salvando apólice:`, policyData);

        // Upsert na tabela policies
        const { error: upsertError } = await supabaseClient
          .from('policies')
          .upsert(policyData, {
            onConflict: 'numero_apolice,user_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`❌ Erro ao inserir apólice ${ap.nosnum}:`, upsertError);
          errorCount++;
        } else {
          console.log(`✅ Apólice ${ap.nosnum} sincronizada com sucesso`);
          syncedCount++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar apólice:`, err);
        errorCount++;
      }
    }

    console.log(`✅ Sincronização concluída: ${syncedCount} apólices, ${errorCount} erros`);

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
