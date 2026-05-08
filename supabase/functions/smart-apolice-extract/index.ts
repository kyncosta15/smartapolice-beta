// Smart Apolice PDF extractor - replica do workflow n8n
// Pipeline: Upload -> Extrair Texto -> OpenAI GPT-4o -> Parametrizar -> Salvar
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { extractText, getDocumentProxy } from 'https://esm.sh/unpdf@0.12.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `Você é um extrator de dados de apólices de seguro.

Sua tarefa é extrair dados estruturados de apólice de seguro do texto fornecido.

Retorne APENAS JSON compacto (sem espaços extras) no seguinte formato:

{"segurado":"","documento":"","documento_tipo":"","dataNascimento":"","seguradora":"","numeroApolice":"","inicioVigencia":"","fimVigencia":"","tipoSeguro":"","modeloVeiculo":"","placa":"","anoModelo":"","valorPremio":0,"quantidadeParcelas":0,"valorParcela":0,"formaPagamento":"","franquia":0,"condutorPrincipal":"","email":"","telefone":"","status":"Ativa","corretora":"","cidade":"","uf":"","coberturas":[]}

Regras:
- documento_tipo: CPF (11 dígitos), CNPJ (14 dígitos), ou DESCONHECIDO
- tipoSeguro: infira do contexto (automóvel, residencial, vida, etc.)
- Datas: yyyy-mm-dd
- Números sem R$ ou %
- Campos vazios: números=0, textos="", datas=null
- coberturas: array de objetos com formato {"descricao": "nome da cobertura", "lmi": valor_numerico}. Extraia o valor LMI (Limite Máximo de Indenização) como número sem R$ ou formatação. Se não houver valor numérico, use null
- Sem explicações ou comentários`;

function safeNumber(val: any): number {
  if (val == null) return 0;
  const str = String(val).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
  let num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num >= 100000 && num % 100 === 0) num = num / 100;
  return +num.toFixed(2);
}

function inferirTipoPorTamanho(doc: any): string {
  const d = (doc ?? '').toString().replace(/\D/g, '');
  if (d.length === 11) return 'CPF';
  if (d.length === 14) return 'CNPJ';
  return 'DESCONHECIDO';
}

function extrairCoberturas(texto: any): any[] {
  if (!texto) return [];
  const str = Array.isArray(texto) ? texto.join('\n') : String(texto);
  const regex = /(.+?)\s+([\d.]+\d,\d{2}|Ver\s+Cond\.?\s*Gerais)/gi;
  const result: any[] = [];
  let m;
  while ((m = regex.exec(str)) !== null) {
    const desc = m[1].trim().replace(/\s{2,}/g, ' ').replace(/\s-\s/g, ' - ');
    const lmiRaw = m[2].trim();
    const lmiNum = /Ver\s+Cond/.test(lmiRaw) ? null : safeNumber(lmiRaw);
    result.push({ descricao: desc, lmi: lmiNum });
  }
  return result;
}

function parametrizar(input: any, user_id: string | null) {
  const parcelas = safeNumber(input.quantidadeParcelas);
  const premio = safeNumber(input.valorPremio);
  const valor_parcela = safeNumber(input.valorParcela);
  const franquia = safeNumber(input.franquia);
  const custo_mensal = +(parcelas > 0 ? premio / parcelas : 0).toFixed(2);

  let coberturas;
  if (Array.isArray(input.coberturas)) coberturas = input.coberturas;
  else coberturas = extrairCoberturas(input.coberturas);

  return {
    user_id,
    segurado: input.segurado ?? '',
    documento: input.documento ?? '',
    documento_tipo: inferirTipoPorTamanho(input.documento),
    data_nascimento: input.dataNascimento || null,
    seguradora: input.seguradora ?? '',
    numero_apolice: input.numeroApolice ?? '',
    inicio: input.inicioVigencia || null,
    fim: input.fimVigencia || null,
    tipo: input.tipoSeguro ?? '',
    modelo_veiculo: input.modeloVeiculo ?? '',
    placa: input.placa ?? '',
    ano_modelo: input.anoModelo ?? '',
    premio,
    parcelas,
    valor_parcela,
    pagamento: input.formaPagamento ?? '',
    custo_mensal,
    franquia,
    condutor: input.condutorPrincipal ?? '',
    email: input.email ?? '',
    telefone: input.telefone ?? '',
    status: input.status ?? 'Ativa',
    corretora: input.corretora ?? '',
    cidade: input.cidade ?? '',
    uf: input.uf ?? '',
    coberturas,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const stepTimes: Record<string, number> = {};
  const stepOutputs: Record<string, any> = {};
  const t0 = Date.now();

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth: identificar user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== Carrega configuração editável =====
    const { data: cfgRow } = await supabase
      .from('smart_apolice_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    const cfg = {
      system_prompt: cfgRow?.system_prompt ?? SYSTEM_PROMPT,
      openai_model: cfgRow?.openai_model ?? 'gpt-4o',
      temperature: Number(cfgRow?.temperature ?? 0.3),
      top_p: Number(cfgRow?.top_p ?? 1),
      max_tokens: Number(cfgRow?.max_tokens ?? 4000),
      merge_pages: cfgRow?.merge_pages ?? true,
      max_pdf_mb: Number(cfgRow?.max_pdf_mb ?? 15),
      save_default: cfgRow?.save_default ?? true,
      bucket_name: cfgRow?.bucket_name ?? 'pdfs',
      policy_number_prefix: cfgRow?.policy_number_prefix ?? 'SA_',
      default_status: cfgRow?.default_status ?? 'vigente',
    };

    // ===== NÓ 1: Webhook (recebe PDF) =====
    let s = Date.now();
    const body = await req.json();
    const { filename, base64, save = cfg.save_default } = body;
    if (!filename || !base64) {
      return new Response(JSON.stringify({ error: 'filename e base64 obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const sizeBytes = Math.round((base64.length * 3) / 4);
    if (sizeBytes > cfg.max_pdf_mb * 1024 * 1024) {
      return new Response(JSON.stringify({ error: `PDF excede ${cfg.max_pdf_mb}MB` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    stepTimes.webhook = Date.now() - s;
    stepOutputs.webhook = { filename, size_bytes: sizeBytes, max_mb: cfg.max_pdf_mb };

    // ===== NÓ 2: Tratar PDF (decode base64) =====
    s = Date.now();
    const cleanB64 = base64.replace(/^data:.*;base64,/, '');
    const binary = Uint8Array.from(atob(cleanB64), (c) => c.charCodeAt(0));
    stepTimes.tratar = Date.now() - s;
    stepOutputs.tratar = { filename, user_id: userId, bytes: binary.length };

    // ===== NÓ 3: Extrair texto =====
    s = Date.now();
    const pdf = await getDocumentProxy(binary);
    const { text } = await extractText(pdf, { mergePages: cfg.merge_pages });
    const fullText = Array.isArray(text) ? text.join('\n') : text;
    stepTimes.extrair = Date.now() - s;
    stepOutputs.extrair = {
      caracteres: fullText.length,
      merge_pages: cfg.merge_pages,
      preview: fullText.slice(0, 500),
    };

    if (!fullText || fullText.length < 50) {
      throw new Error('PDF sem texto extraível (provavelmente imagem/escaneado)');
    }

    // ===== NÓ 4: AI Agent (OpenAI) =====
    s = Date.now();
    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.openai_model,
        temperature: cfg.temperature,
        top_p: cfg.top_p,
        max_tokens: cfg.max_tokens,
        messages: [
          { role: 'system', content: cfg.system_prompt },
          { role: 'user', content: fullText },
        ],
      }),
    });
    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      throw new Error(`OpenAI erro ${aiResp.status}: ${errTxt}`);
    }
    const aiJson = await aiResp.json();
    const aiContent = aiJson.choices?.[0]?.message?.content ?? '';
    stepTimes.ai = Date.now() - s;
    stepOutputs.ai = {
      model: cfg.openai_model,
      temperature: cfg.temperature,
      top_p: cfg.top_p,
      max_tokens: cfg.max_tokens,
      tokens: aiJson.usage,
      raw: aiContent.slice(0, 800),
    };

    // ===== NÓ 5: Parametrização =====
    s = Date.now();
    let cleaned = aiContent.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Falha ao parsear JSON do AI: ${(e as Error).message}`);
    }
    const apolice = parametrizar(parsed, userId);
    stepTimes.parametrizar = Date.now() - s;
    stepOutputs.parametrizar = apolice;

    // ===== NÓ 6: Retornar / Salvar =====
    s = Date.now();
    let policyId: string | null = null;
    let pdfPath: string | null = null;
    if (save) {
      // Upload PDF ao bucket configurado
      try {
        const safeName = filename.replace(/[^\w.\-]+/g, '_');
        pdfPath = `${userId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('pdfs')
          .upload(pdfPath, binary, { contentType: 'application/pdf', upsert: false });
        if (upErr) {
          console.error('[smart-apolice-extract] upload PDF erro:', upErr);
          pdfPath = null;
        }
      } catch (e) {
        console.error('[smart-apolice-extract] upload PDF exception:', e);
        pdfPath = null;
      }
      // Verifica duplicata por user_id + numero_apolice
      const { data: existing } = await supabase
        .from('policies')
        .select('id')
        .eq('user_id', userId)
        .eq('numero_apolice', apolice.numero_apolice || `__SA_${Date.now()}`)
        .maybeSingle();

      const policyPayload: any = {
        user_id: userId,
        segurado: apolice.segurado,
        documento: apolice.documento || null,
        documento_tipo: apolice.documento_tipo === 'DESCONHECIDO' ? null : apolice.documento_tipo,
        seguradora: apolice.seguradora,
        numero_apolice: apolice.numero_apolice || `SA_${Date.now()}`,
        tipo_seguro: apolice.tipo,
        inicio_vigencia: apolice.inicio,
        fim_vigencia: apolice.fim,
        expiration_date: apolice.fim,
        valor_premio: apolice.premio,
        custo_mensal: apolice.custo_mensal,
        quantidade_parcelas: apolice.parcelas,
        modelo_veiculo: apolice.modelo_veiculo || null,
        placa: apolice.placa || null,
        ano_modelo: apolice.ano_modelo || null,
        uf: apolice.uf || null,
        franquia: apolice.franquia || null,
        corretora: apolice.corretora || null,
        status: 'vigente',
        created_by_extraction: true,
        arquivo_url: pdfPath,
      };

      if (existing) {
        policyId = existing.id;
        await supabase.from('policies').update(policyPayload).eq('id', policyId);
        await supabase.from('coberturas').delete().eq('policy_id', policyId);
      } else {
        policyId = crypto.randomUUID();
        const { error: insErr } = await supabase
          .from('policies')
          .insert({ id: policyId, ...policyPayload, created_at: new Date().toISOString() });
        if (insErr) throw new Error(`Erro inserir policy: ${insErr.message}`);
      }

      // Coberturas
      if (apolice.coberturas?.length) {
        const cobsRows = apolice.coberturas.map((c: any) => ({
          policy_id: policyId,
          descricao: c.descricao,
          lmi: c.lmi,
        }));
        await supabase.from('coberturas').insert(cobsRows);
      }
    }
    stepTimes.salvar = Date.now() - s;
    stepOutputs.salvar = { policy_id: policyId, saved: !!save, pdf_path: pdfPath };

    return new Response(
      JSON.stringify({
        success: true,
        policy_id: policyId,
        apolice,
        steps: stepTimes,
        outputs: stepOutputs,
        total_ms: Date.now() - t0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[smart-apolice-extract] erro:', e);
    return new Response(
      JSON.stringify({
        error: (e as Error).message,
        steps: stepTimes,
        outputs: stepOutputs,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
