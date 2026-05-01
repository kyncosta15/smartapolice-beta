// Edge function: gerar-parecer-consultoria
// Lê PDFs do caso de consultoria, envia para Lovable AI (Gemini 2.5 Pro) com tool calling,
// e persiste o parecer estruturado + lacunas no banco.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PARECER_TOOL = {
  type: "function",
  function: {
    name: "registrar_parecer",
    description:
      "Registra o parecer técnico de consultoria estruturado no padrão Rcaldas. Use sempre que finalizar a análise.",
    parameters: {
      type: "object",
      properties: {
        resumo_executivo: {
          type: "string",
          description:
            "Sumário executivo de 5–8 linhas, em PT-BR, citando os principais riscos e oportunidades quantificadas.",
        },
        economia_anual_estimada: {
          type: "number",
          description: "Economia anual estimada (R$). 0 se não houver economia identificável.",
        },
        oportunidade_capitalizacao_total: {
          type: "number",
          description:
            "Capital de oportunidade total (R$): soma de capitais que poderiam ser ajustados/recuperados.",
        },
        blocos: {
          type: "array",
          description: "Um bloco por produto/linha analisada (Rcredi, Vida, Saúde, Frota, etc.).",
          items: {
            type: "object",
            properties: {
              produto: {
                type: "string",
                description:
                  "Identificador do produto: rcredi | vida | saude | frota | patrimonial | rc | financiamento | outro",
              },
              titulo: { type: "string", description: "Título humano do bloco." },
              resumo: { type: "string", description: "Resumo técnico do bloco em PT-BR." },
              dados_chave: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rotulo: { type: "string" },
                    valor: { type: "string" },
                  },
                  required: ["rotulo", "valor"],
                  additionalProperties: false,
                },
                description: "Pares rótulo/valor com os números relevantes (capital, prazo, taxa, etc.).",
              },
            },
            required: ["produto", "titulo", "resumo", "dados_chave"],
            additionalProperties: false,
          },
        },
        lacunas: {
          type: "array",
          description: "Lacunas e oportunidades identificadas, priorizadas.",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              categoria: {
                type: "string",
                description:
                  "rcredi | vida | saude | frota | patrimonial | rc | financiamento | outro",
              },
              severidade: {
                type: "string",
                enum: ["alta", "media", "baixa"],
              },
              descricao: { type: "string" },
              recomendacao: { type: "string" },
              valor_estimado: {
                type: "number",
                description: "Valor estimado em R$ (capital ou economia). 0 se não aplicável.",
              },
              cnpj_referencia: { type: "string" },
            },
            required: ["titulo", "categoria", "severidade", "descricao", "recomendacao"],
            additionalProperties: false,
          },
        },
        plano_acao: {
          type: "array",
          description: "Próximos passos com prazo (30/60/90 dias).",
          items: {
            type: "object",
            properties: {
              prazo_dias: { type: "number", enum: [30, 60, 90] },
              acao: { type: "string" },
            },
            required: ["prazo_dias", "acao"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "resumo_executivo",
        "economia_anual_estimada",
        "oportunidade_capitalizacao_total",
        "blocos",
        "lacunas",
        "plano_acao",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Não autenticado" }, 401);
    }

    // Service-role client for DB + storage
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // User-bound client to verify caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Sessão inválida" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const casoId = body?.casoId as string | undefined;
    if (!casoId) {
      return jsonResponse({ error: "casoId obrigatório" }, 400);
    }

    // Carregar caso
    const { data: caso, error: casoErr } = await admin
      .from("consultoria_casos")
      .select("*")
      .eq("id", casoId)
      .maybeSingle();
    if (casoErr || !caso) {
      return jsonResponse({ error: "Caso não encontrado" }, 404);
    }

    // Verificar se usuário pertence à empresa do caso
    const { data: membership } = await admin
      .from("user_memberships")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("empresa_id", caso.empresa_id)
      .maybeSingle();
    if (!membership) {
      return jsonResponse({ error: "Sem acesso a este caso" }, 403);
    }

    // Carregar config da empresa
    const { data: config } = await admin
      .from("consultoria_config")
      .select("*")
      .eq("empresa_id", caso.empresa_id)
      .maybeSingle();

    // Carregar documentos
    const { data: docs, error: docsErr } = await admin
      .from("consultoria_documentos")
      .select("*")
      .eq("caso_id", casoId);
    if (docsErr) throw docsErr;
    if (!docs || docs.length === 0) {
      return jsonResponse(
        { error: "Envie ao menos 1 documento antes de gerar o parecer." },
        400,
      );
    }

    // Status: em_analise
    await admin
      .from("consultoria_casos")
      .update({ status: "em_analise" })
      .eq("id", casoId);

    // Baixar PDFs e converter para base64 (limita 10 arquivos)
    const pdfsParts: Array<{
      type: "image_url" | "input_text";
      [k: string]: any;
    }> = [];
    const maxDocs = Math.min(docs.length, 10);
    for (let i = 0; i < maxDocs; i++) {
      const doc = docs[i];
      const { data: blob, error: dlErr } = await admin.storage
        .from("consultoria-documentos")
        .download(doc.storage_path);
      if (dlErr || !blob) {
        console.error("download falhou", doc.storage_path, dlErr);
        continue;
      }
      const buf = new Uint8Array(await blob.arrayBuffer());
      const b64 = base64Encode(buf);
      pdfsParts.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${b64}` },
      });
      pdfsParts.push({
        type: "text",
        text: `[Documento ${i + 1}: ${doc.nome_original} — tipo: ${doc.tipo_documento}${
          doc.cnpj_referencia ? ` — CNPJ: ${doc.cnpj_referencia}` : ""
        }]`,
      });
    }

    const promptMestre =
      config?.prompt_mestre ||
      "Você é o Consultor Sênior da Rcaldas. Gere um parecer técnico de consultoria.";
    const criterios = config?.criterios ?? {};

    const userContent: any[] = [
      {
        type: "text",
        text:
          `Caso: ${caso.titulo}\n` +
          `Tipo: ${caso.tipo_caso}\n` +
          `CNPJs: ${(caso.cnpjs ?? []).join(", ") || "—"}\n` +
          `Perfil: ${JSON.stringify(caso.perfil ?? {})}\n` +
          `Critérios objetivos:\n${JSON.stringify(criterios, null, 2)}\n\n` +
          `Analise os ${maxDocs} documentos PDF anexos e gere o parecer chamando a função registrar_parecer. ` +
          `Quantifique sempre que possível. Idioma: PT-BR. Moeda: R$.`,
      },
      ...pdfsParts,
    ];

    // Chamar Lovable AI
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: promptMestre },
          { role: "user", content: userContent },
        ],
        tools: [PARECER_TOOL],
        tool_choice: { type: "function", function: { name: "registrar_parecer" } },
      }),
    });

    if (aiResp.status === 429) {
      await admin
        .from("consultoria_casos")
        .update({ status: "rascunho" })
        .eq("id", casoId);
      return jsonResponse(
        { error: "Limite de requisições atingido. Tente novamente em alguns instantes." },
        429,
      );
    }
    if (aiResp.status === 402) {
      await admin
        .from("consultoria_casos")
        .update({ status: "rascunho" })
        .eq("id", casoId);
      return jsonResponse(
        { error: "Créditos da IA esgotados. Adicione créditos em Settings → Workspace → Usage." },
        402,
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Lovable AI error:", aiResp.status, t);
      await admin
        .from("consultoria_casos")
        .update({ status: "rascunho" })
        .eq("id", casoId);
      return jsonResponse({ error: "Falha na IA", detail: t }, 500);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Sem tool_call na resposta", JSON.stringify(aiData));
      await admin
        .from("consultoria_casos")
        .update({ status: "rascunho" })
        .eq("id", casoId);
      return jsonResponse({ error: "IA não retornou parecer estruturado" }, 502);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("JSON inválido", toolCall.function.arguments);
      return jsonResponse({ error: "Parecer da IA não pôde ser interpretado" }, 502);
    }

    // Próxima versão
    const { data: prevPareceres } = await admin
      .from("consultoria_pareceres")
      .select("versao")
      .eq("caso_id", casoId)
      .order("versao", { ascending: false })
      .limit(1);
    const nextVersao = (prevPareceres?.[0]?.versao ?? 0) + 1;

    // Inserir parecer
    const { data: parecer, error: parecerErr } = await admin
      .from("consultoria_pareceres")
      .insert({
        empresa_id: caso.empresa_id,
        caso_id: casoId,
        versao: nextVersao,
        status: caso.revisao_obrigatoria ? "em_revisao" : "aprovado",
        resumo_executivo: parsed.resumo_executivo ?? null,
        economia_anual_estimada: parsed.economia_anual_estimada ?? null,
        oportunidade_capitalizacao_total: parsed.oportunidade_capitalizacao_total ?? null,
        estrutura: {
          blocos: parsed.blocos ?? [],
          plano_acao: parsed.plano_acao ?? [],
        },
        ia_modelo: "google/gemini-2.5-pro",
        ia_tokens_uso: aiData?.usage ?? null,
      })
      .select()
      .single();
    if (parecerErr) throw parecerErr;

    // Inserir lacunas
    if (Array.isArray(parsed.lacunas) && parsed.lacunas.length > 0) {
      const lacunasRows = parsed.lacunas.map((l: any, idx: number) => ({
        empresa_id: caso.empresa_id,
        parecer_id: parecer.id,
        titulo: String(l.titulo ?? "").slice(0, 240),
        categoria: String(l.categoria ?? "outro"),
        severidade: ["alta", "media", "baixa"].includes(l.severidade) ? l.severidade : "media",
        descricao: l.descricao ?? null,
        recomendacao: l.recomendacao ?? null,
        valor_estimado: typeof l.valor_estimado === "number" ? l.valor_estimado : null,
        cnpj_referencia: l.cnpj_referencia ?? null,
        ordem: idx,
      }));
      const { error: lacunasErr } = await admin.from("consultoria_lacunas").insert(lacunasRows);
      if (lacunasErr) console.error("erro inserindo lacunas", lacunasErr);
    }

    // Atualizar status do caso
    const novoStatus = caso.revisao_obrigatoria ? "em_revisao" : "entregue";
    await admin
      .from("consultoria_casos")
      .update({
        status: novoStatus,
        delivered_at: caso.revisao_obrigatoria ? null : new Date().toISOString(),
      })
      .eq("id", casoId);

    return jsonResponse({ ok: true, parecer_id: parecer.id, versao: nextVersao });
  } catch (e: any) {
    console.error("erro inesperado", e);
    return jsonResponse({ error: e?.message ?? "Erro inesperado" }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64Encode(bytes: Uint8Array): string {
  // chunked para não estourar string
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}
