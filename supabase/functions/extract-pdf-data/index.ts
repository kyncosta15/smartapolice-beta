import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [extract-pdf-data] Iniciando processamento...');
    
    const { client_id, pdf_url } = await req.json();

    if (!client_id && !pdf_url) {
      throw new Error('client_id ou pdf_url é obrigatório');
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let pdfUrlToProcess = pdf_url;
    let clientData = null;

    // Se recebeu client_id, buscar dados do cliente
    if (client_id) {
      console.log(`📋 Buscando dados do cliente: ${client_id}`);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();

      if (error) throw new Error(`Erro ao buscar cliente: ${error.message}`);
      if (!data) throw new Error('Cliente não encontrado');
      
      clientData = data;
      pdfUrlToProcess = data.pdf_url;

      if (!pdfUrlToProcess) {
        throw new Error('Cliente não possui URL de PDF cadastrada');
      }
    }

    console.log(`📥 Baixando PDF de: ${pdfUrlToProcess}`);

    // Baixar o PDF
    const pdfResponse = await fetch(pdfUrlToProcess);
    
    console.log(`📡 Status da resposta: ${pdfResponse.status} ${pdfResponse.statusText}`);
    
    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text().catch(() => 'Sem detalhes');
      console.error(`❌ Erro HTTP ${pdfResponse.status}: ${errorText}`);
      throw new Error(`Erro ao baixar PDF (${pdfResponse.status}): ${pdfResponse.statusText}. URL: ${pdfUrlToProcess}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      throw new Error('PDF baixado está vazio');
    }
    
    console.log(`✅ PDF baixado com sucesso: ${pdfBuffer.byteLength} bytes`);

    console.log('🔍 Extraindo texto do PDF...');

    let text = '';
    
    try {
      // Usar unpdf - biblioteca feita para Deno
      const { extractText } = await import('https://esm.sh/unpdf@0.11.0');
      
      // Extrair texto do PDF
      const result = await extractText(new Uint8Array(pdfBuffer));
      
      // O resultado pode vir em diferentes formatos, vamos normalizar
      let extractedText = '';
      
      if (typeof result === 'string') {
        extractedText = result;
      } else if (result && typeof result.text === 'string') {
        extractedText = result.text;
      } else if (result && Array.isArray(result.pages)) {
        // Se vier como páginas, juntar tudo
        extractedText = result.pages.map((p: any) => p.text || '').join('\n');
      } else if (result && typeof result === 'object') {
        // Tentar extrair de qualquer estrutura
        extractedText = JSON.stringify(result);
      }
      
      console.log(`📊 Tipo de resultado: ${typeof result}`);
      console.log(`📊 Estrutura: ${Object.keys(result || {}).join(', ')}`);
      
      text = String(extractedText)
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`✅ Texto extraído: ${text.length} caracteres`);
      console.log(`📄 Primeiros 500 chars: ${text.substring(0, 500)}`);
      
    } catch (parseError) {
      console.error('❌ unpdf falhou:', parseError.message);
      
      // Fallback: extração manual do buffer PDF
      console.log('⚙️ Tentando extração manual...');
      
      try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(pdfBuffer);
        
        // Extrair texto visível entre parênteses do PDF
        const matches = rawText.match(/\(([^)]{2,})\)/g) || [];
        const extractedParts = matches
          .map(m => m.slice(1, -1))
          .map(s => s.replace(/\\n/g, ' ').replace(/\\r/g, ' '))
          .filter(s => s.length > 2);
        
        text = extractedParts.join(' ')
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log(`✅ Extração manual: ${text.length} caracteres`);
        console.log(`📄 Primeiros 500 chars: ${text.substring(0, 500)}`);
        
      } catch (fallbackError) {
        console.error('❌ Extração manual também falhou:', fallbackError.message);
        throw new Error(`Não foi possível extrair texto do PDF`);
      }
    }

    if (!text || text.length < 50) {
      console.error('❌ Texto extraído muito curto:', text.length);
      throw new Error('PDF não contém texto suficiente para extração. O PDF pode estar como imagem ou protegido.');
    }

    console.log(`✅ Texto extraído: ${text.length} caracteres`);
    console.log('📄 Primeiros 1000 chars:', text.substring(0, 1000));

    // Usar IA para extrair dados estruturados do PDF
    console.log('🤖 Processando texto com IA...');
    
    const prompt = `Extraia dados estruturados de apólice de seguro do texto abaixo.

Retorne APENAS JSON compacto (sem espaços extras):

{"segurado":"","documento":"","documento_tipo":"","dataNascimento":"","seguradora":"","numeroApolice":"","inicioVigencia":"","fimVigencia":"","tipoSeguro":"","modeloVeiculo":"","placa":"","anoModelo":"","valorPremio":0,"quantidadeParcelas":0,"valorParcela":0,"formaPagamento":"","franquia":0,"condutorPrincipal":"","email":"","telefone":"","status":"Ativa","corretora":"","cidade":"","uf":"","coberturas":[]}

Regras:
- documento_tipo: CPF (11 dígitos), CNPJ (14 dígitos), ou DESCONHECIDO
- tipoSeguro: infira do contexto (automóvel, moto, residencial, vida, etc.)
- Datas: yyyy-mm-dd
- Números sem R$ ou %
- Campos vazios: números=0, textos="", datas=null
- coberturas: array de objetos com formato {"descricao": "nome da cobertura", "lmi": valor_numerico}. Extraia o valor LMI (Limite Máximo de Indenização) como número sem R$ ou formatação. Se não houver valor numérico, use null
- Sem explicações ou comentários

Texto:
${text}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`Erro na API de IA: ${aiResponse.status} - ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const aiOutput = aiData.choices[0]?.message?.content || '';
    
    console.log('🤖 Resposta da IA:', aiOutput);
    
    // Limpar e parsear resposta da IA
    let extractedData;
    try {
      const cleanOutput = aiOutput.replace(/```json|```/g, '').trim();
      extractedData = JSON.parse(cleanOutput);
      console.log('✅ Dados extraídos pela IA:', JSON.stringify(extractedData, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta da IA:', parseError.message);
      throw new Error('Erro ao processar dados extraídos do PDF');
    }

    // Normalizar dados para o formato do banco
    const normalizedData = {
      insuredName: extractedData.segurado || 'Não identificado',
      document: extractedData.documento || '',
      documentType: extractedData.documento_tipo || 'CPF',
      policyNumber: extractedData.numeroApolice || `AUTO-${Date.now()}`,
      insurer: extractedData.seguradora || 'Não identificada',
      startDate: extractedData.inicioVigencia || null,
      endDate: extractedData.fimVigencia || null,
      totalPremium: parseFloat(extractedData.valorPremio) || 0,
      monthlyAmount: parseFloat(extractedData.valorParcela) || 0,
      insuranceType: extractedData.tipoSeguro || 'Auto',
      vehicleModel: extractedData.modeloVeiculo || '',
      plate: extractedData.placa || '',
      status: extractedData.status || 'ativa',
      coverages: (extractedData.coberturas || []).map((c: any) => ({
        descricao: c.descricao,
        lmi: parseFloat(c.lmi) || 0
      })),
      installments: []
    };

    console.log('📊 ===== DADOS NORMALIZADOS =====');
    console.log(JSON.stringify(normalizedData, null, 2));
    console.log('====================================');
    
    if (normalizedData.coverages && normalizedData.coverages.length > 0) {
      console.log('🔍 COBERTURAS EXTRAÍDAS:');
      normalizedData.coverages.forEach((cov: any, idx: number) => {
        console.log(`  ${idx + 1}. ${cov.descricao} - LMI: R$ ${cov.lmi.toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('⚠️ NENHUMA COBERTURA FOI EXTRAÍDA DO PDF');
    }

    // Determinar user_id
    let userId = clientData?.created_by;
    
    // Se não tiver user_id do cliente, tentar pegar do token
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          userId = user?.id;
        } catch (authError) {
          console.error('⚠️ Erro ao obter usuário do token:', authError.message);
        }
      }
    }

    if (!userId) {
      throw new Error('Não foi possível determinar o user_id. Faça login novamente.');
    }

    console.log(`👤 user_id determinado: ${userId}`);

    // Buscar apólice existente
    let existingPolicy = null;
    
    if (client_id) {
      // Se tem client_id, buscar por ele
      const { data } = await supabase
        .from('policies')
        .select('id')
        .eq('client_id', client_id)
        .maybeSingle();
      existingPolicy = data;
      
      console.log(`🔍 Buscando apólice por client_id ${client_id}:`, existingPolicy ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    } else {
      // Senão, buscar por número da apólice
      const { data } = await supabase
        .from('policies')
        .select('id')
        .eq('numero_apolice', normalizedData.policyNumber)
        .maybeSingle();
      existingPolicy = data;
      
      console.log(`🔍 Buscando apólice por numero ${normalizedData.policyNumber}:`, existingPolicy ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    }

    let policyId: string;

    if (existingPolicy) {
      console.log('🔄 Atualizando apólice:', existingPolicy.id);
      
      // Atualizar apólice existente
      const { data: updated, error: updateError } = await supabase
        .from('policies')
        .update({
          segurado: normalizedData.insuredName || null,
          documento: normalizedData.document || null,
          documento_tipo: normalizedData.documentType || null,
          seguradora: normalizedData.insurer || null,
          inicio_vigencia: normalizedData.startDate || null,
          fim_vigencia: normalizedData.endDate || null,
          valor_premio: normalizedData.totalPremium || null,
          custo_mensal: normalizedData.monthlyAmount || null,
          tipo_seguro: normalizedData.insuranceType || null,
          modelo_veiculo: normalizedData.vehicleModel || null,
          placa: normalizedData.plate || null,
          status: normalizedData.status || null,
          extraction_timestamp: new Date().toISOString()
        })
        .eq('id', existingPolicy.id)
        .select()
        .single();

      if (updateError) throw updateError;
      policyId = updated.id;

      // Deletar coberturas antigas
      await supabase.from('coberturas').delete().eq('policy_id', policyId);
      
    } else {
      console.log('➕ Criando nova apólice...');
      
      // Criar nova apólice
      const { data: created, error: createError } = await supabase
        .from('policies')
        .insert({
          user_id: userId,
          client_id: client_id || null,
          segurado: normalizedData.insuredName || null,
          documento: normalizedData.document || null,
          documento_tipo: normalizedData.documentType || null,
          numero_apolice: normalizedData.policyNumber,
          seguradora: normalizedData.insurer || null,
          inicio_vigencia: normalizedData.startDate || null,
          fim_vigencia: normalizedData.endDate || null,
          valor_premio: normalizedData.totalPremium || null,
          custo_mensal: normalizedData.monthlyAmount || null,
          tipo_seguro: normalizedData.insuranceType || null,
          modelo_veiculo: normalizedData.vehicleModel || null,
          placa: normalizedData.plate || null,
          status: normalizedData.status || null,
          created_by_extraction: true,
          extraction_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      policyId = created.id;
    }

    // Inserir coberturas se houver
    if (normalizedData.coverages && normalizedData.coverages.length > 0) {
      console.log(`📋 Inserindo ${normalizedData.coverages.length} coberturas...`);
      
      const coveragesToInsert = normalizedData.coverages.map((cov: any) => ({
        policy_id: policyId,
        descricao: cov.descricao,
        lmi: cov.lmi
      }));

      const { error: coverageError } = await supabase
        .from('coberturas')
        .insert(coveragesToInsert);

      if (coverageError) {
        console.error('⚠️ Erro ao inserir coberturas:', coverageError);
      }
    }

    // Inserir parcelas se houver
    if (normalizedData.installments && normalizedData.installments.length > 0) {
      console.log(`💰 Inserindo ${normalizedData.installments.length} parcelas...`);
      
      const installmentsToInsert = normalizedData.installments.map((inst: any) => ({
        policy_id: policyId,
        numero: inst.numero,
        valor: inst.valor,
        data_vencimento: inst.data,
        status: inst.status || 'pendente'
      }));

      const { error: installmentError } = await supabase
        .from('installments')
        .insert(installmentsToInsert);

      if (installmentError) {
        console.error('⚠️ Erro ao inserir parcelas:', installmentError);
      }
    }

    console.log('✅ Processamento concluído com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        policy_id: policyId,
        extracted_data: normalizedData,
        debug_info: {
          text_length: text.length,
          insurer_found: normalizedData.insurer,
          dates_found: {
            start: normalizedData.startDate,
            end: normalizedData.endDate
          },
          values_found: {
            premium: normalizedData.totalPremium,
            monthly: normalizedData.monthlyAmount
          },
          coverages_count: normalizedData.coverages?.length || 0,
          installments_count: normalizedData.installments?.length || 0
        },
        message: existingPolicy ? 'Apólice atualizada com sucesso' : 'Apólice criada com sucesso'
      }),
      { headers: corsHeaders }
    );
    
    // Se não tiver user_id do cliente, tentar pegar do token
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    // Verificar se já existe apólice para este cliente
    let existingPolicy = null;
    
    if (client_id) {
      // Se tem client_id, buscar apólice vinculada a este cliente
      const { data } = await supabase
        .from('policies')
        .select('id')
        .eq('client_id', client_id)
        .maybeSingle();
      existingPolicy = data;
      
      console.log(`🔍 Buscando apólice por client_id ${client_id}:`, existingPolicy ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    } else {
      // Senão, buscar por número da apólice
      const { data } = await supabase
        .from('policies')
        .select('id')
        .eq('numero_apolice', extractedData.policyNumber)
        .maybeSingle();
      existingPolicy = data;
      
      console.log(`🔍 Buscando apólice por numero ${extractedData.policyNumber}:`, existingPolicy ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    }

    let policyId: string;

    if (existingPolicy) {
      console.log('🔄 Atualizando apólice:', existingPolicy.id);
      
      // Atualizar apólice existente
      const { data: updated, error: updateError } = await supabase
        .from('policies')
        .update({
          segurado: extractedData.insuredName || null,
          documento: extractedData.document || null,
          documento_tipo: extractedData.documentType || null,
          seguradora: extractedData.insurer || null,
          inicio_vigencia: extractedData.startDate || null,
          fim_vigencia: extractedData.endDate || null,
          valor_premio: extractedData.totalPremium || null,
          custo_mensal: extractedData.monthlyAmount || null,
          tipo_seguro: extractedData.insuranceType || null,
          modelo_veiculo: extractedData.vehicleModel || null,
          placa: extractedData.plate || null,
          status: extractedData.status || null,
          extraction_timestamp: new Date().toISOString()
        })
        .eq('id', existingPolicy.id)
        .select()
        .single();

      if (updateError) throw updateError;
      policyId = updated.id;

      // Deletar coberturas antigas
      await supabase.from('coberturas').delete().eq('policy_id', policyId);
      
    } else {
      console.log('➕ Criando nova apólice...');
      
      // Criar nova apólice
      const { data: created, error: createError } = await supabase
        .from('policies')
        .insert({
          user_id: userId,
          client_id: client_id || null,
          segurado: extractedData.insuredName || null,
          documento: extractedData.document || null,
          documento_tipo: extractedData.documentType || null,
          numero_apolice: extractedData.policyNumber,
          seguradora: extractedData.insurer || null,
          inicio_vigencia: extractedData.startDate || null,
          fim_vigencia: extractedData.endDate || null,
          valor_premio: extractedData.totalPremium || null,
          custo_mensal: extractedData.monthlyAmount || null,
          tipo_seguro: extractedData.insuranceType || null,
          modelo_veiculo: extractedData.vehicleModel || null,
          placa: extractedData.plate || null,
          status: extractedData.status || null,
          created_by_extraction: true,
          extraction_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      policyId = created.id;
    }

    // Inserir coberturas se houver
    if (extractedData.coverages && extractedData.coverages.length > 0) {
      console.log(`📋 Inserindo ${extractedData.coverages.length} coberturas...`);
      
      const coveragesToInsert = extractedData.coverages.map(cov => ({
        policy_id: policyId,
        descricao: cov.descricao,
        lmi: cov.lmi
      }));

      const { error: coverageError } = await supabase
        .from('coberturas')
        .insert(coveragesToInsert);

      if (coverageError) {
        console.error('⚠️ Erro ao inserir coberturas:', coverageError);
      }
    }

    // Inserir parcelas se houver
    if (extractedData.installments && extractedData.installments.length > 0) {
      console.log(`💰 Inserindo ${extractedData.installments.length} parcelas...`);
      
      const installmentsToInsert = extractedData.installments.map(inst => ({
        policy_id: policyId,
        numero: inst.numero,
        valor: inst.valor,
        data_vencimento: inst.data,
        status: inst.status || 'pendente'
      }));

      const { error: installmentError } = await supabase
        .from('installments')
        .insert(installmentsToInsert);

      if (installmentError) {
        console.error('⚠️ Erro ao inserir parcelas:', installmentError);
      }
    }

    console.log('✅ Processamento concluído com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        policy_id: policyId,
        extracted_data: extractedData,
        debug_info: {
          text_length: text.length,
          insurer_found: extractedData.insurer,
          dates_found: {
            start: extractedData.startDate,
            end: extractedData.endDate
          },
          values_found: {
            premium: extractedData.totalPremium,
            monthly: extractedData.monthlyAmount
          },
          coverages_count: extractedData.coverages?.length || 0,
          installments_count: extractedData.installments?.length || 0
        },
        message: existingPolicy ? 'Apólice atualizada com sucesso' : 'Apólice criada com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Função de extração de dados baseada nos patterns existentes
function extractPolicyData(text: string) {
  console.log('🔍 Aplicando regex patterns...');
  
  const normalizedText = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Detectar seguradora
  const insurer = detectInsurer(normalizedText);
  
  // Extrair nome do segurado
  const insuredNamePatterns = [
    /Nome\s+do\s*\(?a?\)?\s*Proponente\s*\/\s*Segurado\s*\(?a?\)?\s+CPF\s*\/\s*CNPJ\s+([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i,
    /Segurado\s*\(?a?\)?\s+Corretor\s+([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+)/i,
    /Nome\s+do\s*\(?a?\)?\s+Segurado\s*\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
  ];
  const insuredName = extractWithPatterns(normalizedText, insuredNamePatterns, 'Não identificado');

  // Extrair CPF/CNPJ
  const documentPatterns = [
    /[A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]+\s+([\d]{3}\.[\d]{3}\.[\d]{3}\-[\d]{2})/i,
    /CPF\s*\/\s*CNPJ\s+([\d\.\/\-]{11,18})/i,
    /CPF\s*[:\s]*([\d\.\-]{11,14})/i,
    /CNPJ\s*[:\s]*([\d\.\-\/]{14,18})/i,
  ];
  const document = extractWithPatterns(normalizedText, documentPatterns, '').replace(/\D/g, '');
  const documentType = document && document.length === 14 ? 'CNPJ' : 'CPF';

  // Extrair número da apólice
  const policyPatterns = [
    /Proposta\s+N[oº°]\s+Vigencia\s+Filial\s+([\d]+)/i,
    /Proposta\s*N[oº°]?\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Apólice\s*N[oº°]?\s*[:\s]*([\d\.\-\/]{5,})/i,
  ];
  const policyNumber = extractWithPatterns(normalizedText, policyPatterns, `AUTO-${Date.now()}`);

  // Extrair datas de vigência
  const startDatePatterns = [
    /(\d{2}\/\d{2}\/\d{4})\s+a\s+\d{2}\/\d{2}\/\d{4}/i,
    /Vigencia\s+Filial\s+[\d]+\s+(\d{2}\/\d{2}\/\d{4})/i,
    /Início\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
  ];
  const startDate = convertToISODate(extractWithPatterns(normalizedText, startDatePatterns, ''));

  const endDatePatterns = [
    /\d{2}\/\d{2}\/\d{4}\s+a\s+(\d{2}\/\d{2}\/\d{4})/i,
    /(?:Fim|Final|Término)\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
  ];
  const endDate = convertToISODate(extractWithPatterns(normalizedText, endDatePatterns, ''));

  // Extrair valores
  const premiumPatterns = [
    /Premio\s+Total\s+\(R\$\)\s+Juros\s*\(%\)\s+[\d\.,]+\s+[\d\.,]+\s+[\d\.,]+\s+[\d\.,]+\s+([\d\.,]+)/i,
    /Prêmio\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
  ];
  const totalPremiumStr = extractWithPatterns(normalizedText, premiumPatterns, '0');
  const totalPremium = parseFloat(totalPremiumStr.replace(/\./g, '').replace(',', '.')) || 0;

  // Extrair parcelas e valor mensal
  const installments = extractInstallments(normalizedText);
  
  // Tentar extrair valor da parcela diretamente
  const monthlyPatterns = [
    /Tipo\s+de\s+Cobranca\s+Banco\s+N[oº°]?\s+Agencia\s+N[oº°]?\s+Conta[\-\s]Corrente\s+Valor\s+\(R\$\)\s+[^\d]+([\d\.,]+)/i,
    /Valor\s+\(R\$\)\s+([\d\.,]+)/i,
  ];
  const monthlyStr = extractWithPatterns(normalizedText, monthlyPatterns, '0');
  const monthlyAmount = parseFloat(monthlyStr.replace(/\./g, '').replace(',', '.')) || (installments.length > 0 ? installments[0].valor : totalPremium / 12);

  // Extrair veículo
  const vehiclePatterns = [
    /Marca\s*\/\s*Tipo\s+do\s+Veiculo\s+Ano\s+Fabricacao\s*\/\s*Modelo\s+([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+\d{4}\/\d{4})/i,
    /Veículo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
  ];
  const vehicleModel = extractWithPatterns(normalizedText, vehiclePatterns, '');

  // Extrair placa
  const platePatterns = [
    /Placa\s+Capacidade\s+Categoria\s+([A-Z0-9]{7})/i,
    /Placa\s*[:\s]*([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2}|[A-Z0-9]{7})/i
  ];
  const plate = extractWithPatterns(normalizedText, platePatterns, '');

  // Extrair coberturas
  const coverages = extractCoverages(normalizedText);

  // Determinar status
  const status = determineStatus(startDate, endDate);

  return {
    insuredName,
    document,
    documentType,
    policyNumber,
    insurer,
    startDate,
    endDate,
    totalPremium,
    monthlyAmount,
    insuranceType: 'Auto',
    vehicleModel,
    plate,
    status,
    coverages,
    installments
  };
}

function detectInsurer(text: string): string {
  const insurers = [
    'Liberty Seguros', 'Porto Seguro', 'Tokio Marine', 'Bradesco Seguros',
    'Itaú Seguros', 'Allianz', 'Mapfre', 'Sompo', 'HDI Seguros',
    'SulAmérica', 'Zurich', 'AXA', 'Chubb', 'Azul Seguros'
  ];

  const textLower = text.toLowerCase().substring(0, 2000);
  
  for (const insurer of insurers) {
    if (textLower.includes(insurer.toLowerCase())) {
      return insurer;
    }
  }
  
  return 'Não identificada';
}

function extractWithPatterns(text: string, patterns: RegExp[], defaultValue: string): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value && value.length > 0) {
        return value;
      }
    }
  }
  return defaultValue;
}

function convertToISODate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

function extractInstallments(text: string) {
  const installments: Array<{ numero: number; valor: number; data: string; status: string }> = [];
  
  // Pattern para capturar parcelas: XXXX DD/MM/YYYY VALOR
  const pattern = /(\d{4})\s*(\d{2}\/\d{2}\/\d{4})\s*([0-9\.,]+)/gi;
  
  let match;
  let numero = 1;
  
  while ((match = pattern.exec(text)) !== null) {
    const valor = parseFloat(match[3].replace(/\./g, '').replace(',', '.'));
    const data = convertToISODate(match[2]);
    
    if (valor > 0 && data) {
      installments.push({
        numero: numero++,
        valor,
        data,
        status: 'pendente'
      });
    }
  }
  
  return installments;
}

function extractCoverages(text: string) {
  const coverages: Array<{ descricao: string; lmi: number }> = [];
  
  // Pattern para Liberty: "DESCRIÇÃO DA COBERTURA LMI PRÊMIO FRANQUIA"
  const libertyPattern = /([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\-]{15,}?)\s+([\d\.]+,\d{2})\s+([\d\.]+,\d{2})\s+([\d\.]+,\d{2})/g;
  
  let match;
  while ((match = libertyPattern.exec(text)) !== null) {
    const descricao = match[1].trim();
    const lmi = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
    
    if (lmi > 0 && descricao.length > 5) {
      coverages.push({
        descricao: descricao.substring(0, 100),
        lmi
      });
    }
  }
  
  return coverages;
}

function determineStatus(startDate: string | null, endDate: string | null): string {
  if (!endDate) return 'ativa';
  
  const now = new Date();
  const end = new Date(endDate);
  const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencida';
  if (diffDays <= 30) return 'vencendo';
  return 'ativa';
}
