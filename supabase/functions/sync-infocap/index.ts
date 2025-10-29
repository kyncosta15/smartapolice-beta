import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const CORPNUVEM_API_URL = 'https://api.corpnuvem.com';

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

    // Buscar dados na API CorpNuvem
    const corpToken = Deno.env.get('CORPNUVEM_API_TOKEN');
    if (!corpToken) {
      throw new Error('Token CorpNuvem não configurado');
    }

    console.log(`🔑 Token disponível: ${corpToken ? 'SIM (primeiros 10 chars: ' + corpToken.substring(0, 10) + '...)' : 'NÃO'}`);
    console.log(`🔑 Comprimento do token: ${corpToken?.length}`);

    // Buscar apólices por documento
    const apiUrl = `${CORPNUVEM_API_URL}/cliente_ligacoes?codigo=${cleanDocument.substring(0, 8)}`;
    console.log(`🌐 Chamando API: ${apiUrl}`);

    const headers = {
      'Authorization': corpToken,
      'Content-Type': 'application/json',
    };
    console.log(`📋 Headers sendo enviados:`, JSON.stringify(headers, null, 2));

    const response = await fetch(apiUrl, {
      headers: headers,
    });

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
            const detailsResponse = await fetch(
              `${CORPNUVEM_API_URL}/documento?codfil=${ap.codfil}&nosnum=${ap.nosnum}`,
              {
                headers: {
                  'Authorization': corpToken,
                  'Content-Type': 'application/json',
                },
              }
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
