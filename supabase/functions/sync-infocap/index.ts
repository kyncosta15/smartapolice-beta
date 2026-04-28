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
    console.log('🚀 ===== FUNÇÃO SYNC-INFOCAP INICIADA - VERSÃO COM FILA SEQUENCIAL =====');

    const { documento } = await req.json();

    // Buscar CPFs vinculados do usuário PRIMEIRO
    const { data: cpfsVinculados } = await supabaseClient
      .from('user_cpf_vinculos')
      .select('cpf, nome, tipo')
      .eq('user_id', user.id)
      .eq('ativo', true);

    const cpfsAtivos = cpfsVinculados?.map(v => v.cpf.replace(/\D/g, '')) || [];
    
    // Construir lista de documentos a sincronizar
    const documentosParaBuscar: string[] = [];
    
    // Adicionar documento principal se existir
    if (documento && documento.trim()) {
      documentosParaBuscar.push(documento);
      console.log(`📄 Documento principal: ${documento}`);
    } else {
      console.log('ℹ️ Nenhum documento principal fornecido');
    }
    
    // Adicionar CPFs vinculados
    if (cpfsVinculados && cpfsVinculados.length > 0) {
      console.log(`📋 Encontrados ${cpfsVinculados.length} CPFs vinculados`);
      cpfsVinculados.forEach(v => {
        // Evitar duplicatas
        if (!documentosParaBuscar.includes(v.cpf)) {
          documentosParaBuscar.push(v.cpf);
          console.log(`   + ${v.cpf} (${v.nome || 'sem nome'})`);
        }
      });
    } else {
      console.log('ℹ️ Nenhum CPF vinculado encontrado');
    }

    // Verificar se há documentos para processar
    if (documentosParaBuscar.length === 0) {
      console.log('⚠️ Nenhum documento para sincronizar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum documento para sincronizar',
          synced: 0,
          documentos: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n📊 TOTAL DE DOCUMENTOS A PROCESSAR: ${documentosParaBuscar.length}`);
    console.log(`📋 Lista de documentos: ${documentosParaBuscar.join(', ')}\n`);

    // LIMPAR APÓLICES DE CPFs DESVINCULADOS
    console.log('🧹 Verificando apólices de CPFs desvinculados...');
    const { data: apolicesVinculadas, error: fetchError } = await supabaseClient
      .from('policies')
      .select('id, vinculo_cpf, numero_apolice')
      .eq('user_id', user.id)
      .not('vinculo_cpf', 'is', null);

    if (apolicesVinculadas && apolicesVinculadas.length > 0) {
      const apolicesParaRemover = apolicesVinculadas.filter(ap => {
        const vinculoLimpo = ap.vinculo_cpf?.replace(/\D/g, '');
        return vinculoLimpo && !cpfsAtivos.includes(vinculoLimpo);
      });

      if (apolicesParaRemover.length > 0) {
        console.log(`🗑️ Removendo ${apolicesParaRemover.length} apólices de CPFs desvinculados...`);
        const idsParaRemover = apolicesParaRemover.map(ap => ap.id);
        
        const { error: deleteError } = await supabaseClient
          .from('policies')
          .delete()
          .in('id', idsParaRemover);

        if (deleteError) {
          console.error('❌ Erro ao remover apólices antigas:', deleteError);
        } else {
          console.log(`✅ ${apolicesParaRemover.length} apólices removidas com sucesso`);
          apolicesParaRemover.forEach(ap => {
            console.log(`   - ${ap.numero_apolice} (CPF: ${ap.vinculo_cpf})`);
          });
        }
      } else {
        console.log('✅ Nenhuma apólice de CPF desvinculado encontrada');
      }
    }

    let totalApolicesSincronizadas = 0;

    // Sincronizar apólices de todos os documentos
    for (const doc of documentosParaBuscar) {
      try {
        console.log(`\n🔄 ===== Sincronizando documento: ${doc} =====\n`);

        // Limpar documento
        const cleanDocument = doc.replace(/\D/g, '');
        const isCPF = cleanDocument.length === 11;

    // PASSO 1: Buscar cliente pelo documento para obter o nome
    const cpfEndpoint = `${CORPNUVEM_API_URL}/busca_cpf?cpf_cnpj=${cleanDocument}`;
    const cnpjEndpoint = `${CORPNUVEM_API_URL}/busca_cnpj?cpf_cnpj=${cleanDocument}`;

    // A API /busca_cpf aceita tanto CPF quanto CNPJ. Usamos ela primeiro e
    // deixamos /busca_cnpj apenas como fallback para manter compatibilidade.
    console.log(`🔍 Buscando cliente (endpoint principal /busca_cpf): ${cpfEndpoint}`);
    let clienteResponse = await corpNuvemFetch(cpfEndpoint);

    if (!clienteResponse.ok && !isCPF) {
      console.warn(`⚠️ /busca_cpf retornou status ${clienteResponse.status} para CNPJ. Tentando /busca_cnpj como fallback: ${cnpjEndpoint}`);
      clienteResponse = await corpNuvemFetch(cnpjEndpoint);
    }

    if (!clienteResponse.ok) {
      const errorBody = await clienteResponse.text();
      console.error(`❌ Erro ao buscar cliente - Body: ${errorBody}`);
      throw new Error(`Erro ao buscar cliente: ${clienteResponse.statusText}`);
    }

    const clienteData = await clienteResponse.json();
    console.log(`📦 Dados do cliente:`, JSON.stringify(clienteData, null, 2));

    // Extrair nome do cliente E código do cliente - ajustado para estrutura correta da API
    let nomeCliente = '';
    let codigoCliente: number | null = null;
    if (Array.isArray(clienteData) && clienteData.length > 0) {
      nomeCliente = clienteData[0].nome || clienteData[0].cliente || '';
      codigoCliente = clienteData[0].codigo || clienteData[0].cod || clienteData[0].codcli || null;
    } else if (clienteData?.cliente?.nome) {
      // API retorna { cliente: { nome: "..." } }
      nomeCliente = clienteData.cliente.nome;
      codigoCliente = clienteData.cliente.codigo || clienteData.cliente.cod || null;
    } else if (clienteData?.nome) {
      nomeCliente = clienteData.nome;
      codigoCliente = clienteData.codigo || clienteData.cod || null;
    }

    if (!nomeCliente) {
      console.error('❌ Nome do cliente não encontrado');
      throw new Error('Cliente não encontrado na base CorpNuvem');
    }

    console.log(`✅ Cliente encontrado: ${nomeCliente} (código: ${codigoCliente})`);

    // PASSO 2: Buscar apólices usando o endpoint /cliente_ligacoes
    // Este endpoint retorna TODAS as apólices vinculadas ao cliente pelo código
    if (!codigoCliente) {
      console.error('❌ Código do cliente não encontrado, não é possível buscar apólices');
      throw new Error('Código do cliente não encontrado');
    }
    
    const ligacoesUrl = `${CORPNUVEM_API_URL}/cliente_ligacoes?codigo=${codigoCliente}`;
    console.log(`📄 Buscando ligações do cliente: ${ligacoesUrl}`);

    const ligacoesResponse = await corpNuvemFetch(ligacoesUrl);

    if (!ligacoesResponse.ok) {
      const errorBody = await ligacoesResponse.text();
      console.error(`❌ Erro ao buscar ligações - Body: ${errorBody}`);
      throw new Error(`Erro ao buscar ligações: ${ligacoesResponse.statusText}`);
    }

    const ligacoesData = await ligacoesResponse.json();
    console.log(`📦 Ligações encontradas:`, JSON.stringify(ligacoesData, null, 2));

    // Extrair documentos (apólices) da resposta
    const documentosResponse = ligacoesData?.documentos?.documentos || [];
    console.log(`📋 Total de documentos encontrados: ${documentosResponse.length}`);
    
    // 🔍 LOG DETALHADO: Mostrar JSON completo de cada apólice
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 JSON COMPLETO DA API - TODAS AS APÓLICES');
    console.log('═══════════════════════════════════════════════════');
    documentosResponse.forEach((ap: any, index: number) => {
      console.log(`\n📄 APÓLICE ${index + 1}/${documentosResponse.length}:`);
      console.log(JSON.stringify(ap, null, 2));
      console.log(`   Key: codfil=${ap.codfil}, nosnum=${ap.nosnum}, numapo=${ap.numapo}, cliente_codigo=${ap.cliente_codigo}, cliente=${ap.cliente}`);
    });
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    // Todas as apólices já são do cliente correto (filtrado por código)
    const apolices = documentosResponse;
    console.log(`🎯 Total de apólices do cliente ${codigoCliente}: ${apolices.length}`);
    
    // FILTRAR APENAS APÓLICES ATIVAS (tipo "A") E NÃO CANCELADAS
    // Tipo "C" = Cancelamento/Endosso, "M" = Modificação não devem ser processados
    const apolicesAtivas = apolices.filter((ap: any) => ap.tipdoc === 'A' && ap.cancelado !== 'S');
    console.log(`📋 Apólices ativas (tipo A, não canceladas): ${apolicesAtivas.length}`);
    console.log(`⏭️  Ignorando ${apolices.length - apolicesAtivas.length} endossos ou canceladas`);

    // LIMPAR APÓLICES QUE NÃO PERTENCEM MAIS A ESTE CLIENTE
    // Coletar nosnum válidos para este documento
    const nosnumValidos = apolicesAtivas.map((ap: any) => ap.nosnum);
    console.log(`📋 Nosnum válidos para ${cleanDocument}: ${nosnumValidos.join(', ')}`);
    
    // Buscar apólices existentes deste vínculo que NÃO estão na lista válida
    const { data: apolicesExistentes } = await supabaseClient
      .from('policies')
      .select('id, nosnum, numero_apolice, segurado')
      .eq('user_id', user.id)
      .eq('vinculo_cpf', doc);
    
    if (apolicesExistentes && apolicesExistentes.length > 0) {
      const apolicesInvalidas = apolicesExistentes.filter(ap => 
        ap.nosnum && !nosnumValidos.includes(ap.nosnum)
      );
      
      if (apolicesInvalidas.length > 0) {
        console.log(`🗑️ Removendo ${apolicesInvalidas.length} apólices que não pertencem mais a ${nomeCliente}...`);
        apolicesInvalidas.forEach(ap => {
          console.log(`   - ${ap.numero_apolice} (${ap.segurado}) - nosnum: ${ap.nosnum}`);
        });
        
        const { error: deleteError } = await supabaseClient
          .from('policies')
          .delete()
          .in('id', apolicesInvalidas.map(ap => ap.id));
        
        if (deleteError) {
          console.error('❌ Erro ao remover apólices inválidas:', deleteError);
        } else {
          console.log(`✅ ${apolicesInvalidas.length} apólices removidas com sucesso`);
        }
      }
    }

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
          if (diffDays <= 90) return 'vencendo'; // Qualquer apólice vencendo em até 90 dias
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

        // Log completo dos campos disponíveis e valores
        console.log(`📋 ===== APÓLICE ${ap.nosnum} =====`);
        console.log(`📋 Campos em detalhesApolice:`, Object.keys(detalhesApolice || {}));
        console.log(`📋 Campos em ap (produção):`, Object.keys(ap || {}));
        console.log(`📋 Todos os valores de ap:`, JSON.stringify(ap, null, 2));
        if (detalhesApolice) {
          console.log(`📋 Todos os valores de detalhesApolice:`, JSON.stringify(detalhesApolice, null, 2));
        }
        
        // Determinar se foi renovada - testar TODOS os campos possíveis
        const sitRenovacao = detalhesApolice?.sit_renovacao 
          || detalhesApolice?.sitRenovacao 
          || detalhesApolice?.renovacao_situacao
          || ap.renovacao_situacao 
          || ap.sit_renovacao;
          
        console.log(`🔄 Apólice ${ap.nosnum} - sit_renovacao encontrado: ${sitRenovacao}, tipo: ${typeof sitRenovacao}`);
        
        // sit_renovacao: 1 = Nova, 2 = Renovada, 3 = Não renovada
        // Se não tiver o campo, assumir como renovada (true) para manter compatibilidade
        const foiRenovada = sitRenovacao ? (parseInt(sitRenovacao) !== 3) : true;
        console.log(`🔄 RESULTADO FINAL: foiRenovada = ${foiRenovada}`);
        
        // Normalizar dados para tabela policies
        // SEMPRE usar codfil-nosnum como numero_apolice para garantir unicidade
        const numeroApolice = (ap.numapo && ap.numapo !== '0' && ap.numapo !== 0) 
          ? ap.numapo 
          : `${ap.codfil}-${ap.nosnum}`;
        
        // CRÍTICO: Usar o nome do cliente DA APÓLICE, não do documento buscado
        // Cada apólice pode pertencer a um cliente diferente (mesmo sendo encontrada pela busca)
        const nomeClienteApolice = ap.cliente || detalhesApolice?.cliente || detalhesApolice?.nome_cliente || nomeCliente;
        console.log(`🏢 Nome do cliente da apólice ${ap.nosnum}: "${nomeClienteApolice}" (ap.cliente: "${ap.cliente}", detalhes: "${detalhesApolice?.cliente}")`);
          
        // Capturar dados de renovação detalhados da API
        // renovado_nosnum/renovado_codfil: apontam para a apólice NOVA que SUBSTITUIU esta
        const renovadoNosnumRaw = detalhesApolice?.renovado_nosnum ?? ap.renovado_nosnum ?? null;
        const renovadoCodfilRaw = detalhesApolice?.renovado_codfil ?? ap.renovado_codfil ?? null;
        const renovadoNosnum = renovadoNosnumRaw ? parseInt(String(renovadoNosnumRaw)) || null : null;
        const renovadoCodfil = renovadoCodfilRaw ? parseInt(String(renovadoCodfilRaw)) || null : null;
        const sitRenovacaoNum = sitRenovacao ? parseInt(String(sitRenovacao)) || null : null;
        const sitRenovacaoTxt = detalhesApolice?.sit_renovacao_txt
          || detalhesApolice?.sitRenovacaoTxt
          || ap.sit_renovacao_txt
          || null;

        console.log(`🔁 Renovação detalhada - sit:${sitRenovacaoNum} txt:${sitRenovacaoTxt} | renovado_por: codfil=${renovadoCodfil}, nosnum=${renovadoNosnum}`);

        const policyData = {
          user_id: user.id,
          documento: cleanDocument,
          vinculo_cpf: doc !== documento ? doc : null, // Marcar se veio de um CPF vinculado
          segurado: nomeClienteApolice, // CORRIGIDO: Usar nome do cliente DA apólice
          seguradora: detalhesApolice?.seguradora || ap.seguradora || '',
          numero_apolice: numeroApolice,
          tipo_seguro: detalhesApolice?.ramo || ap.ramo || 'Não especificado',
          inicio_vigencia: convertBRDateToISO(ap.inivig || detalhesApolice?.inivig),
          fim_vigencia: convertBRDateToISO(ap.fimvig || detalhesApolice?.fimvig),
          valor_premio: valorPremioTotal,
          valor_parcela: valorParcela,
          quantidade_parcelas: numParcelas,
          status: statusPolicy,
          renovada: foiRenovada,
          renovado_nosnum: renovadoNosnum,
          renovado_codfil: renovadoCodfil,
          sit_renovacao: sitRenovacaoNum,
          sit_renovacao_txt: sitRenovacaoTxt,
          corretora: 'RCaldas Corretora de Seguros',
          extraction_timestamp: new Date().toISOString(),
          created_by_extraction: true,
          responsavel_nome: nomeClienteApolice, // CORRIGIDO: Consistência
          nosnum: ap.nosnum,
          codfil: ap.codfil,
        };

        console.log(`💾 Salvando apólice:`, policyData);

        // Verificar se já existe apólice com mesmo user_id + nosnum + codfil
        const { data: existingPolicies, error: selectError } = await supabaseClient
          .from('policies')
          .select('id')
          .eq('user_id', user.id)
          .eq('nosnum', ap.nosnum)
          .eq('codfil', ap.codfil);

        if (selectError) {
          console.error(`❌ ERRO AO VERIFICAR EXISTÊNCIA - nosnum: ${ap.nosnum}`, selectError);
          errorCount++;
          continue;
        }

        if (existingPolicies && existingPolicies.length > 0) {
          // Atualizar apólice existente
          const { error: updateError } = await supabaseClient
            .from('policies')
            .update(policyData)
            .eq('id', existingPolicies[0].id);

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
            console.log(`✅ Apólice ${policyData.numero_apolice} (nosnum: ${ap.nosnum}) inserida com sucesso`);
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

    totalApolicesSincronizadas += syncedCount;
    console.log(`✅ Sincronização do documento ${doc} concluída: ${syncedCount} apólices ativas processadas, ${errorCount} erros`);

      } catch (docError) {
        console.error(`❌ Erro ao processar documento ${doc}:`, docError);
      }
    }

    console.log(`\n🎉 SINCRONIZAÇÃO TOTAL CONCLUÍDA: ${totalApolicesSincronizadas} apólices processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída',
        synced: totalApolicesSincronizadas,
        documentos: documentosParaBuscar.length,
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
