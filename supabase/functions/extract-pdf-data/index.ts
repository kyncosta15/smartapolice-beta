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
      // Usar pdf-lib que é mais compatível com Deno
      const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
      
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      console.log(`📄 PDF carregado: ${pages.length} páginas`);
      
      // Extrair texto usando regex patterns no buffer
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(pdfBuffer);
      
      // Extrair texto entre parênteses e colchetes (formato comum em PDFs)
      const textMatches = rawText.match(/\(([^)]+)\)|\[([^\]]+)\]/g) || [];
      const extractedTexts = textMatches
        .map(match => {
          // Remover parênteses/colchetes
          let content = match.slice(1, -1);
          
          // Decodificar escape sequences comuns em PDFs
          content = content
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .replace(/\\(/g, '(')
            .replace(/\\)/g, ')')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"');
          
          return content;
        })
        .filter(t => t.trim().length > 0);
      
      // Também extrair texto literal (palavras visíveis)
      const literalText = rawText.match(/[A-Za-zÀ-ÿ0-9\s\-,.:;!?()]+/g) || [];
      const cleanLiteral = literalText
        .filter(t => t.trim().length > 3)
        .join(' ');
      
      // Combinar ambas as extrações
      text = [...extractedTexts, cleanLiteral].join(' ')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`✅ Extração concluída: ${text.length} caracteres`);
      console.log(`📄 Primeiros 500 chars: ${text.substring(0, 500)}`);
      
    } catch (parseError) {
      console.error('❌ Erro na extração:', parseError.message);
      throw new Error(`Erro ao extrair texto do PDF: ${parseError.message}`);
    }

    if (!text || text.length < 50) {
      console.error('❌ Texto extraído muito curto:', text.length);
      throw new Error('PDF não contém texto suficiente para extração. O PDF pode estar como imagem ou protegido.');
    }

    console.log(`✅ Texto extraído: ${text.length} caracteres`);
    console.log('📄 Primeiros 500 chars:', text.substring(0, 500));

    // Aplicar regex patterns para extrair dados
    const extractedData = extractPolicyData(text);

    console.log('📊 ===== DADOS EXTRAÍDOS DO PDF =====');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('====================================');

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
