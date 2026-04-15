import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AUTH_URLS = {
  production: "https://ms-gateway.juntoseguros.com/guarantee/api/v2/authentication",
  sandbox: "https://ms-gateway-box.juntoseguros.com/guarantee/api/v2/authentication",
} as const;

const BASE_URLS = {
  production: "https://ms-gateway.juntoseguros.com/guarantee/api/v2",
  sandbox: "https://ms-gateway-box.juntoseguros.com/guarantee/api/v2",
} as const;

type Environment = keyof typeof AUTH_URLS;

async function getAccessToken(environment: Environment): Promise<string> {
  const clientId = Deno.env.get("JUNTO_CLIENT_ID");
  const clientSecret = Deno.env.get("JUNTO_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais da Junto não configuradas");
  }

  const response = await fetch(AUTH_URLS[environment], {
    method: "POST",
    headers: {
      "Content-Type": "application/json-patch+json",
      Accept: "*/*",
    },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na autenticação (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data.accessToken || data.access_token;
  if (!token) throw new Error("Token não retornado pela API");

  const tokenType = data.tokenType || data.token_type || "Bearer";
  return `${tokenType} ${token}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const environment: Environment = body.environment === "sandbox" ? "sandbox" : "production";
    const action = body.action || "list"; // list | details

    // Get Junto access token
    const bearerToken = await getAccessToken(environment);
    const baseUrl = BASE_URLS[environment];

    if (action === "list") {
      // Build query params for billings list
      const params = new URLSearchParams();
      params.set("PageNumber", String(body.pageNumber || 1));
      params.set("RowsOfPage", String(body.rowsOfPage || 50));

      if (body.status) params.set("Status", body.status);
      if (body.expirationStart) params.set("ExpirationStart", body.expirationStart);
      if (body.expirationEnd) params.set("ExpirationEnd", body.expirationEnd);
      if (body.policyNumber) params.set("PolicyNumber", body.policyNumber);
      if (body.order) params.set("Order", body.order);

      const url = `${baseUrl}/billings?${params.toString()}`;
      console.log(`[junto-billings] Buscando títulos: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: bearerToken,
          Accept: "application/json",
        },
      });

      const responseText = await response.text();
      console.log(`[junto-billings] Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[junto-billings] Erro: ${responseText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar títulos (${response.status})`,
          details: responseText.slice(0, 500),
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = JSON.parse(responseText);

      // Sync to guarantee_billings table
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
          auth: { persistSession: false },
        });

        const billingRecords = data.data.map((b: any) => ({
          user_id: user.id,
          external_id: String(b.id),
          policy_number: b.policyNumber,
          document_number: String(b.documentNumber),
          document_type: b.documentType?.description || null,
          installment_number: b.installmentNumber,
          booklet_number: String(b.paymentCarnet || ""),
          expiration_date: b.dueDate,
          original_expiration_date: b.originalDueDate,
          amount_due: b.amountToPay,
          days_overdue: b.dayOfDelay,
          payment_date: b.paymentDate || null,
          amount_paid: b.amountPaid || null,
          discount: b.discountValue || null,
          cancellation_date: b.cancellationDate || null,
          write_off_date: b.terminateDate || null,
          policyholder_document: b.policyholder?.federalId || null,
          policyholder_name: b.policyholder?.name || null,
          economic_group: b.economicGroup?.name || null,
          modality: b.modality?.description || null,
          status: b.paymentDate ? "Paid" : (b.cancellationDate ? "Cancelled" : (b.dayOfDelay > 0 ? "Overdue" : "Opened")),
          raw_data: b,
          synced_at: new Date().toISOString(),
        }));

        // Upsert by external_id + user_id
        for (const record of billingRecords) {
          await adminClient
            .from("guarantee_billings")
            .upsert(record, { onConflict: "external_id,user_id", ignoreDuplicates: false })
            .select();
        }

        console.log(`[junto-billings] ${billingRecords.length} títulos sincronizados`);
      }

      return new Response(JSON.stringify({
        success: true,
        pagination: {
          pageNumber: data.pageNumber,
          totalPages: data.totalPages,
          pageSize: data.pageSize,
          totalCount: data.totalCount,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        },
        billings: data.data || [],
        environment,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "details") {
      const billingId = body.billingId;
      if (!billingId) {
        return new Response(JSON.stringify({ success: false, error: "billingId é obrigatório" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `${baseUrl}/billings/${billingId}`;
      console.log(`[junto-billings] Detalhes do título: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: bearerToken,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Erro ao buscar detalhes (${response.status})`,
          details: errorText.slice(0, 500),
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const details = await response.json();

      return new Response(JSON.stringify({
        success: true,
        billing: details,
        environment,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Ação inválida" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[junto-billings] Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
