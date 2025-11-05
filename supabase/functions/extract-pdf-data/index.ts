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

    // Tentar múltiplas abordagens de extração
    let text = '';
    
    try {
      // Primeira tentativa: usar pdf-parse com Uint8Array
      // Usar esm.sh com bundle para incluir todas as dependências
      const pdfParse = (await import('https://esm.sh/pdf-parse@1.1.1?bundle')).default;
      const uint8Array = new Uint8Array(pdfBuffer);
      const data = await pdfParse(uint8Array);
      text = data.text || '';
      console.log('✅ Extração via pdf-parse bem-sucedida');
    } catch (parseError) {
      console.warn('⚠️ pdf-parse falhou, tentando extração básica:', parseError.message);
      
      // Fallback: tentar extrair texto básico do buffer
      // Converter ArrayBuffer para string e procurar por padrões de texto
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(pdfBuffer);
      
      // Procurar por texto entre streams do PDF
      const textMatches = rawText.match(/\(([^)]+)\)/g) || [];
      const extractedTexts = textMatches.map(match => 
        match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
      );
      
      text = extractedTexts.join(' ')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('✅ Extração básica realizada');
    }

    if (!text || text.length < 50) {
      console.error('❌ Texto extraído muito curto:', text.length);
      throw new Error('PDF não contém texto suficiente para extração. O PDF pode estar como imagem ou protegido.');
    }

    console.log(`✅ Texto extraído: ${text.length} caracteres`);

    // Aplicar regex patterns para extrair dados
    const extractedData = extractPolicyData(text);

    console.log('📊 Dados extraídos:', JSON.stringify(extractedData, null, 2));

    // Determinar user_id
    let userId = clientData?.created_by;
    
    // Se não tiver user_id do cliente, tentar pegar do token
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    // Verificar se já existe apólice com mesmo número
    const { data: existingPolicy } = await supabase
      .from('policies')
      .select('id')
      .eq('numero_apolice', extractedData.policyNumber)
      .maybeSingle();

    let policyId: string;

    if (existingPolicy) {
      console.log('🔄 Atualizando apólice existente...');
      
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
    /Nome\s+do\(?a?\)?\s+Segurado\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
    /Segurado\(?a?\)?\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i,
    /Nome\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s\.]{3,})/i
  ];
  const insuredName = extractWithPatterns(normalizedText, insuredNamePatterns, 'Não identificado');

  // Extrair CPF/CNPJ
  const documentPatterns = [
    /CPF\/CNPJ\s*[:\s]*([\d\.\-\/]{11,18})/i,
    /CPF\s*[:\s]*([\d\.\-]{11,14})/i,
    /CNPJ\s*[:\s]*([\d\.\-\/]{14,18})/i,
    /(\d{2,3}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s\/]?\d{4}[\-\s]?\d{2})/
  ];
  const document = extractWithPatterns(normalizedText, documentPatterns, '');
  const documentType = document && document.replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF';

  // Extrair número da apólice
  const policyPatterns = [
    /Apólice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Apolice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Número\s+da\s+Apólice\s*[:\s]*([\d\.\-\/]{5,})/i,
    /Proposta\s*[:\s]*([\d\.\-\/]{5,})/i
  ];
  const policyNumber = extractWithPatterns(normalizedText, policyPatterns, `AUTO-${Date.now()}`);

  // Extrair datas de vigência
  const startDatePatterns = [
    /Início\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /Data\s+de\s+Início\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /Vigência\s*[:\s]*de\s+(\d{2}\/\d{2}\/\d{4})/i,
    /De\s+(\d{2}\/\d{2}\/\d{4})\s+até/i
  ];
  const startDate = convertToISODate(extractWithPatterns(normalizedText, startDatePatterns, ''));

  const endDatePatterns = [
    /(?:Fim|Final|Término)\s+(?:de\s+)?Vigência\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /até\s+(\d{2}\/\d{2}\/\d{4})/i,
    /Vence\s+em\s+(\d{2}\/\d{2}\/\d{4})/i
  ];
  const endDate = convertToISODate(extractWithPatterns(normalizedText, endDatePatterns, ''));

  // Extrair valores
  const premiumPatterns = [
    /Prêmio\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
    /Valor\s+Total\s*\(R\$?\)\s*[:\s]*([0-9\.,]+)/i,
    /Total\s+a\s+Pagar\s*[:\s]*R?\$?\s*([0-9\.,]+)/i
  ];
  const totalPremiumStr = extractWithPatterns(normalizedText, premiumPatterns, '0');
  const totalPremium = parseFloat(totalPremiumStr.replace(/\./g, '').replace(',', '.')) || 0;

  // Extrair parcelas
  const installments = extractInstallments(normalizedText);
  const monthlyAmount = installments.length > 0 
    ? installments[0].valor 
    : totalPremium / 12;

  // Extrair veículo
  const vehiclePatterns = [
    /Veículo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i,
    /Modelo\s*[:\s]*([A-ZÁÊÔÃÇÀÉÍÓÚÜ0-9\s\/\-\.]+)/i
  ];
  const vehicleModel = extractWithPatterns(normalizedText, vehiclePatterns, '');

  // Extrair placa
  const platePatterns = [
    /Placa\s*[:\s]*([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})/i
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
    'Porto Seguro', 'Liberty Seguros', 'Tokio Marine', 'Bradesco Seguros',
    'Itaú Seguros', 'Allianz', 'Mapfre', 'Sompo', 'HDI Seguros',
    'SulAmérica', 'Zurich', 'AXA', 'Chubb', 'Azul Seguros'
  ];

  const textLower = text.toLowerCase().substring(0, 1000);
  
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
  
  // Pattern simplificado para coberturas
  const pattern = /([A-ZÁÊÔÃÇÀÉÍÓÚÜ\s]{10,})\s+R?\$?\s*([0-9\.,]+)/gi;
  
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('cobertura') || 
        line.toLowerCase().includes('dano') ||
        line.toLowerCase().includes('colisao')) {
      
      const match = line.match(pattern);
      if (match) {
        const lmi = parseFloat(match[0].replace(/[^\d,]/g, '').replace(',', '.'));
        if (lmi > 1000) {
          coverages.push({
            descricao: line.trim().substring(0, 100),
            lmi
          });
        }
      }
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
