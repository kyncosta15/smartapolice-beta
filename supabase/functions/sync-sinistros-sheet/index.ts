import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { config_id, sheet_url, empresa_id } = body;

    if (!sheet_url || !empresa_id) {
      return new Response(JSON.stringify({ error: "sheet_url e empresa_id são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract Google Sheets ID from URL
    const sheetIdMatch = sheet_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!sheetIdMatch) {
      return new Response(JSON.stringify({ error: "URL do Google Sheets inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sheetId = sheetIdMatch[1];

    // Fetch CSV from Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const csvResponse = await fetch(csvUrl);
    if (!csvResponse.ok) {
      return new Response(JSON.stringify({ error: "Erro ao acessar a planilha. Verifique se ela está pública." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csvText = await csvResponse.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "Planilha vazia ou sem dados" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse header row (first row)
    const headers = rows[0].map((h: string) => h.toLowerCase().trim());
    const dataRows = rows.slice(1).filter((row: string[]) => row.some((cell: string) => cell.trim()));

    // Map columns
    const colMap = {
      nome: findCol(headers, ["controle de sinistros", "nome", "beneficiario", "segurado"]),
      numero_sinistro: findCol(headers, ["nª do sinistro", "n do sinistro", "numero sinistro", "nº sinistro", "numero_sinistro"]),
      subsidiaria: findCol(headers, ["sub", "subsidiaria", "subsidiária", "filial"]),
      data_abertura: findCol(headers, ["data de abertura", "data abertura", "data_abertura", "abertura"]),
      tipo: findCol(headers, ["tipo"]),
      status: findCol(headers, ["status"]),
      prazo: findCol(headers, ["prazo"]),
      valor_pago: findCol(headers, ["v. pago", "valor pago", "valor_pago", "v.pago"]),
    };

    // Get existing sinistros for this empresa to avoid duplicates
    const { data: existingTickets } = await supabase
      .from("tickets")
      .select("id, numero_sinistro, beneficiario_nome, payload")
      .eq("empresa_id", empresa_id)
      .eq("tipo", "sinistro");

    const existingNums = new Set(
      (existingTickets || [])
        .filter((t: any) => t.numero_sinistro)
        .map((t: any) => normalizeNumSinistro(t.numero_sinistro))
    );
    const existingNames = new Set(
      (existingTickets || [])
        .filter((t: any) => t.beneficiario_nome)
        .map((t: any) => t.beneficiario_nome.toUpperCase().trim())
    );

    let registros_novos = 0;
    let registros_existentes = 0;
    let erros = 0;
    const detalhes: any[] = [];

    for (const row of dataRows) {
      try {
        const nome = getCell(row, colMap.nome);
        const numSinistro = getCell(row, colMap.numero_sinistro);
        const subsidiaria = getCell(row, colMap.subsidiaria);
        const dataAbertura = getCell(row, colMap.data_abertura);
        const tipo = getCell(row, colMap.tipo);
        const statusText = getCell(row, colMap.status);
        const prazo = getCell(row, colMap.prazo);
        const valorPagoText = getCell(row, colMap.valor_pago);

        if (!nome) continue;

        // Check duplicates by numero_sinistro or nome
        const normalizedNum = numSinistro ? normalizeNumSinistro(numSinistro) : null;
        if (normalizedNum && existingNums.has(normalizedNum)) {
          registros_existentes++;
          detalhes.push({ nome, numero_sinistro: numSinistro, status: "existente" });
          continue;
        }
        if (!normalizedNum && existingNames.has(nome.toUpperCase().trim())) {
          registros_existentes++;
          detalhes.push({ nome, status: "existente_por_nome" });
          continue;
        }

        // Parse data_abertura (DD/MM/YYYY)
        const parsedDate = parseDate(dataAbertura);

        // Parse valor_pago
        const valorPago = parseValor(valorPagoText);

        // Map status
        const { ticketStatus, statusIndenizacao } = mapStatus(statusText, valorPagoText);

        // Insert ticket
        const { error: insertError } = await supabase
          .from("tickets")
          .insert({
            tipo: "sinistro",
            status: ticketStatus,
            empresa_id: empresa_id,
            origem: "importacao",
            beneficiario_nome: nome,
            numero_sinistro: numSinistro || null,
            subsidiaria: subsidiaria || null,
            data_evento: parsedDate,
            prazo: prazo ? parseDate(prazo) : null,
            valor_pago: valorPago,
            status_indenizacao: statusIndenizacao,
            payload: {
              tipo_evento: tipo || null,
              status_original: statusText || null,
              importado_de: "google_sheets",
              sheet_url: sheet_url,
            },
          });

        if (insertError) {
          erros++;
          detalhes.push({ nome, error: insertError.message });
        } else {
          registros_novos++;
          if (normalizedNum) existingNums.add(normalizedNum);
          existingNames.add(nome.toUpperCase().trim());
          detalhes.push({ nome, numero_sinistro: numSinistro, status: "importado" });
        }
      } catch (rowError) {
        erros++;
        detalhes.push({ error: String(rowError) });
      }
    }

    // Log sync
    if (config_id) {
      await supabase.from("sinistro_sheet_sync_logs").insert({
        config_id,
        registros_encontrados: dataRows.length,
        registros_novos,
        registros_existentes,
        erros,
        detalhes,
        status: erros > 0 ? "parcial" : "sucesso",
      });

      // Update config
      await supabase
        .from("sinistro_sheet_configs")
        .update({
          last_synced_at: new Date().toISOString(),
          sync_count: registros_novos,
        })
        .eq("id", config_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        registros_encontrados: dataRows.length,
        registros_novos,
        registros_existentes,
        erros,
        detalhes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Utilities ---

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(current);
        current = "";
        rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function getCell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  return (row[idx] || "").trim();
}

function normalizeNumSinistro(num: string): string {
  return num.replace(/[\s.]/g, "").toUpperCase();
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function parseValor(text: string): number | null {
  if (!text || text.toUpperCase() === "NEGADO") return null;
  const cleaned = text.replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function mapStatus(
  statusText: string,
  valorPagoText: string
): { ticketStatus: string; statusIndenizacao: string | null } {
  const upper = (statusText || "").toUpperCase();
  const valorUpper = (valorPagoText || "").toUpperCase();

  if (upper.includes("INDENIZADO")) {
    return { ticketStatus: "finalizado", statusIndenizacao: "Indenizado" };
  }
  if (upper.includes("RECUSADO") || valorUpper === "NEGADO") {
    return { ticketStatus: "finalizado", statusIndenizacao: "Negado" };
  }
  if (upper.includes("PENDENCIA") || upper.includes("PENDÊNCIA")) {
    return { ticketStatus: "em_analise", statusIndenizacao: "Pendente" };
  }
  if (upper.includes("ABERTURA")) {
    return { ticketStatus: "aberto", statusIndenizacao: null };
  }
  return { ticketStatus: "aberto", statusIndenizacao: null };
}
