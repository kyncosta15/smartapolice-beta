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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Buscar apólices por documento
    const apiUrl = `${CORPNUVEM_API_URL}/cliente_ligacoes?codigo=${cleanDocument.substring(0, 8)}`;
    console.log(`🌐 Chamando API: ${apiUrl}`);

    const response = await corpNuvemFetch(apiUrl);

    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Erro da API - Body: ${errorBody}`);
      throw new Error(`Erro na API CorpNuvem: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const apolices = data?.documentos?.documentos || [];

    console.log(`📋 Encontradas ${apolices.length} apólices`);

    let syncedCount = 0;
    let errorCount = 0;

    // Processar cada apólice
    for (const ap of apolices) {
      try {
        // Normalizar dados para tabela policies
        const policyData = {
          user_id: user.id,
          documento: cleanDocument,
          segurado: ap.cliente || '',
          seguradora: ap.seguradora || '',
          numero_apolice: ap.numapo || ap.nosnum?.toString() || '',
          tipo_seguro: ap.ramo || 'Não especificado',
          inicio_vigencia: ap.inivig || null,
          fim_vigencia: ap.fimvig || null,
          valor_premio: 0, // InfoCap não retorna esse valor diretamente
          valor_parcela: 0,
          quantidade_parcelas: 12,
          status: ap.cancelado === 'S' ? 'Cancelada' : 
                  ap.sin_situacao === 1 ? 'Ativa' : 'Pendente',
          corretora: 'RCaldas Corretora de Seguros',
          extraction_timestamp: new Date().toISOString(),
          created_by_extraction: true,
          responsavel_nome: ap.cliente || '',
        };

        // Buscar detalhes adicionais se disponível
        if (ap.codfil && ap.nosnum) {
          try {
            const detailsResponse = await corpNuvemFetch(
              `${CORPNUVEM_API_URL}/documento?codfil=${ap.codfil}&nosnum=${ap.nosnum}`
            );

            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              if (details.prtot) policyData.valor_premio = parseFloat(details.prtot);
              if (details.prliq) policyData.valor_parcela = parseFloat((details.prliq / 12).toFixed(2));
            }
          } catch (err) {
            console.warn(`⚠️ Erro ao buscar detalhes da apólice ${ap.nosnum}:`, err);
          }
        }

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
