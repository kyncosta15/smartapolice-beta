import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Buscar agendamentos ativos que precisam ser enviados
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from("report_schedules")
      .select(`
        *,
        empresas:empresa_id (
          id,
          nome,
          cnpj
        )
      `)
      .eq("ativo", true)
      .or(`proximo_envio.is.null,proximo_envio.lte.${new Date().toISOString()}`);

    if (schedulesError) {
      console.error("Erro ao buscar agendamentos:", schedulesError);
      throw schedulesError;
    }

    console.log(`Encontrados ${schedules?.length || 0} agendamentos para processar`);

    const results = [];

    for (const schedule of schedules || []) {
      try {
        console.log(`Processando agendamento ${schedule.id} para ${schedule.email}`);

        // Buscar dados da empresa para o relatório
        const { data: veiculos } = await supabaseAdmin
          .from("frota_veiculos")
          .select("*")
          .eq("empresa_id", schedule.empresa_id);

        const { data: apolices } = await supabaseAdmin
          .from("apolices_beneficios")
          .select("*")
          .eq("empresa_id", schedule.empresa_id);

        const { data: sinistros } = await supabaseAdmin
          .from("tickets")
          .select("*")
          .eq("empresa_id", schedule.empresa_id)
          .eq("tipo", "sinistro");

        const { data: assistencias } = await supabaseAdmin
          .from("tickets")
          .select("*")
          .eq("empresa_id", schedule.empresa_id)
          .eq("tipo", "assistencia");

        // Montar HTML do relatório
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
              .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
              .metric { display: inline-block; margin: 10px 20px; text-align: center; }
              .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
              .metric-label { font-size: 14px; color: #666; }
              .footer { text-align: center; margin-top: 40px; padding: 20px; color: #666; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #667eea; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Relatório Executivo</h1>
                <p>${schedule.empresas?.nome || "Empresa"}</p>
                <p>Período: ${new Date().toLocaleDateString("pt-BR")}</p>
              </div>

              <div class="section">
                <h2>🚗 Gestão de Frotas</h2>
                <div class="metric">
                  <div class="metric-value">${veiculos?.length || 0}</div>
                  <div class="metric-label">Veículos</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${veiculos?.filter(v => v.status_seguro === 'segurado').length || 0}</div>
                  <div class="metric-label">Segurados</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${veiculos?.filter(v => v.status_seguro === 'sem_seguro').length || 0}</div>
                  <div class="metric-label">Sem Seguro</div>
                </div>
              </div>

              <div class="section">
                <h2>🏥 Apólices de Benefícios</h2>
                <div class="metric">
                  <div class="metric-value">${apolices?.length || 0}</div>
                  <div class="metric-label">Apólices Ativas</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${apolices?.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0) || 0}</div>
                  <div class="metric-label">Vidas</div>
                </div>
              </div>

              <div class="section">
                <h2>🚨 Sinistros e Assistências</h2>
                <div class="metric">
                  <div class="metric-value">${sinistros?.length || 0}</div>
                  <div class="metric-label">Sinistros</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${assistencias?.length || 0}</div>
                  <div class="metric-label">Assistências</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${[...(sinistros || []), ...(assistencias || [])].filter(t => t.status === 'aberto').length}</div>
                  <div class="metric-label">Em Aberto</div>
                </div>
              </div>

              <div class="footer">
                <p><strong>RCORP Gestão de Seguros</strong></p>
                <p>Este é um relatório automático. Não responda este email.</p>
                <p>Para acessar o sistema completo, visite: <a href="https://fdab69fb-cde0-4bb7-ac60-2a713d93f1b4.lovableproject.com">Dashboard RCORP</a></p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Enviar email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "RCORP Relatórios <relatorios@resend.dev>",
          to: [schedule.email],
          subject: `📊 Relatório ${schedule.frequencia_dias} dias - ${schedule.empresas?.nome || "Sua Empresa"}`,
          html: htmlContent,
        });

        if (emailError) {
          console.error("Erro ao enviar email:", emailError);
          
          // Registrar falha no log
          await supabaseAdmin.from("report_sends").insert({
            schedule_id: schedule.id,
            empresa_id: schedule.empresa_id,
            email: schedule.email,
            status: "failed",
            error_message: emailError.message,
          });

          results.push({
            schedule_id: schedule.id,
            status: "failed",
            error: emailError.message,
          });
          
          continue;
        }

        console.log("Email enviado com sucesso:", emailData);

        // Registrar envio bem-sucedido
        await supabaseAdmin.from("report_sends").insert({
          schedule_id: schedule.id,
          empresa_id: schedule.empresa_id,
          email: schedule.email,
          status: "sent",
        });

        // Atualizar próximo envio
        const proximoEnvio = new Date();
        proximoEnvio.setDate(proximoEnvio.getDate() + schedule.frequencia_dias);
        proximoEnvio.setDate(schedule.dia_envio);

        await supabaseAdmin
          .from("report_schedules")
          .update({
            ultimo_envio: new Date().toISOString(),
            proximo_envio: proximoEnvio.toISOString(),
          })
          .eq("id", schedule.id);

        results.push({
          schedule_id: schedule.id,
          status: "sent",
          email_id: emailData?.id,
        });

      } catch (error) {
        console.error(`Erro ao processar agendamento ${schedule.id}:`, error);
        
        await supabaseAdmin.from("report_sends").insert({
          schedule_id: schedule.id,
          empresa_id: schedule.empresa_id,
          email: schedule.email,
          status: "failed",
          error_message: error.message,
        });

        results.push({
          schedule_id: schedule.id,
          status: "failed",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});