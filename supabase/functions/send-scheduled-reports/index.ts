import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

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

    // Verificar se é um teste forçado
    const { force = false } = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // Buscar agendamentos ativos
    let query = supabaseAdmin
      .from("report_schedules")
      .select(`
        *,
        empresas:empresa_id (
          id,
          nome,
          cnpj
        )
      `)
      .eq("ativo", true);

    // Se não for forçado, verificar data de envio
    if (!force) {
      query = query.or(`proximo_envio.is.null,proximo_envio.lte.${new Date().toISOString()}`);
    }

    const { data: schedules, error: schedulesError } = await query;

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

        // Calcular estatísticas
        const stats = {
          totalVeiculos: veiculos?.length || 0,
          veiculosSegurados: veiculos?.filter(v => v.status_seguro === 'segurado').length || 0,
          veiculosSemSeguro: veiculos?.filter(v => v.status_seguro === 'sem_seguro').length || 0,
          totalApolices: apolices?.length || 0,
          totalVidas: apolices?.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0) || 0,
          totalSinistros: sinistros?.length || 0,
          totalAssistencias: assistencias?.length || 0,
          ticketsAbertos: [...(sinistros || []), ...(assistencias || [])].filter(t => t.status === 'aberto').length
        };

        // Gerar PDF do relatório
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();
        let yPosition = height - 50;

        // Título
        page.drawText('Relatório Executivo', {
          x: 50,
          y: yPosition,
          size: 24,
          font: helveticaBold,
          color: rgb(0.4, 0.49, 0.92),
        });
        yPosition -= 30;

        page.drawText(`${schedule.empresas?.nome || "Empresa"}`, {
          x: 50,
          y: yPosition,
          size: 16,
          font: helveticaBold,
        });
        yPosition -= 20;

        page.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 40;

        // Gestão de Frotas
        page.drawText('GESTÃO DE FROTAS', {
          x: 50,
          y: yPosition,
          size: 14,
          font: helveticaBold,
          color: rgb(0.4, 0.49, 0.92),
        });
        yPosition -= 25;

        page.drawText(`Total de Veículos: ${stats.totalVeiculos}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 20;

        page.drawText(`Veículos Segurados: ${stats.veiculosSegurados}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 20;

        page.drawText(`Veículos Sem Seguro: ${stats.veiculosSemSeguro}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 40;

        // Apólices de Benefícios
        page.drawText('APÓLICES DE BENEFÍCIOS', {
          x: 50,
          y: yPosition,
          size: 14,
          font: helveticaBold,
          color: rgb(0.4, 0.49, 0.92),
        });
        yPosition -= 25;

        page.drawText(`Apólices Ativas: ${stats.totalApolices}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 20;

        page.drawText(`Total de Vidas: ${stats.totalVidas}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 40;

        // Sinistros e Assistências
        page.drawText('SINISTROS E ASSISTÊNCIAS', {
          x: 50,
          y: yPosition,
          size: 14,
          font: helveticaBold,
          color: rgb(0.4, 0.49, 0.92),
        });
        yPosition -= 25;

        page.drawText(`Total de Sinistros: ${stats.totalSinistros}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 20;

        page.drawText(`Total de Assistências: ${stats.totalAssistencias}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 20;

        page.drawText(`Tickets em Aberto: ${stats.ticketsAbertos}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });

        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                color: #333; 
                line-height: 1.6; 
                background: #f5f5f5;
                padding: 10px;
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center;
              }
              .header h1 { 
                font-size: 24px; 
                margin-bottom: 10px; 
                font-weight: 600;
              }
              .header p { 
                margin: 5px 0; 
                opacity: 0.95; 
                font-size: 14px;
              }
              .alert-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 16px;
                margin: 20px;
                border-radius: 4px;
              }
              .alert-box h3 {
                color: #856404;
                margin-bottom: 8px;
                font-size: 16px;
              }
              .alert-box p {
                color: #856404;
                font-size: 14px;
              }
              .download-btn {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 12px;
                font-weight: 600;
              }
              .section { 
                padding: 24px 20px; 
                border-bottom: 1px solid #e5e7eb;
              }
              .section:last-of-type {
                border-bottom: none;
              }
              .section h2 { 
                font-size: 18px; 
                margin-bottom: 20px; 
                color: #1f2937;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .metrics { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 16px;
                justify-content: center;
              }
              .metric { 
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                text-align: center; 
                min-width: 100px;
                flex: 1;
              }
              .metric-value { 
                font-size: 32px; 
                font-weight: 700; 
                color: #667eea;
                display: block;
                margin-bottom: 8px;
              }
              .metric-label { 
                font-size: 13px; 
                color: #6b7280;
                font-weight: 500;
              }
              .footer { 
                text-align: center; 
                padding: 30px 20px; 
                background: #f9fafb;
                color: #6b7280; 
                font-size: 12px;
              }
              .footer p { 
                margin: 8px 0; 
              }
              .footer strong { 
                color: #1f2937; 
                font-size: 14px;
              }
              .footer a { 
                color: #667eea; 
                text-decoration: none;
              }
              
              @media only screen and (max-width: 600px) {
                body { padding: 0; }
                .container { border-radius: 0; }
                .header { padding: 24px 16px; }
                .header h1 { font-size: 20px; }
                .header p { font-size: 13px; }
                .section { padding: 20px 16px; }
                .section h2 { font-size: 16px; margin-bottom: 16px; }
                .metrics { gap: 12px; }
                .metric { 
                  padding: 16px 12px; 
                  min-width: 90px;
                  flex: 1 1 calc(33.333% - 12px);
                }
                .metric-value { font-size: 28px; margin-bottom: 6px; }
                .metric-label { font-size: 12px; }
                .footer { padding: 24px 16px; }
              }
              
              @media only screen and (max-width: 400px) {
                .metric { 
                  flex: 1 1 calc(50% - 12px);
                  max-width: calc(50% - 12px);
                }
                .metric-value { font-size: 24px; }
                .metric-label { font-size: 11px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Relatório Executivo</h1>
                <p><strong>${schedule.empresas?.nome || "Empresa"}</strong></p>
                <p>Período: ${new Date().toLocaleDateString("pt-BR")}</p>
              </div>

              <div class="alert-box">
                <h3>📎 Relatório em Anexo</h3>
                <p>O relatório executivo em PDF está anexado a este email. Para análises mais detalhadas e gráficos interativos, acesse o sistema:</p>
                <a href="https://fdab69fb-cde0-4bb7-ac60-2a713d93f1b4.lovableproject.com" class="download-btn">Acessar Sistema Completo</a>
              </div>

              <div class="section">
                <h2>🚗 Gestão de Frotas</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${stats.totalVeiculos}</span>
                    <span class="metric-label">Veículos</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${stats.veiculosSegurados}</span>
                    <span class="metric-label">Segurados</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${stats.veiculosSemSeguro}</span>
                    <span class="metric-label">Sem Seguro</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2>🏥 Apólices de Benefícios</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${stats.totalApolices}</span>
                    <span class="metric-label">Apólices Ativas</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${stats.totalVidas}</span>
                    <span class="metric-label">Vidas</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2>🚨 Sinistros e Assistências</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${stats.totalSinistros}</span>
                    <span class="metric-label">Sinistros</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${stats.totalAssistencias}</span>
                    <span class="metric-label">Assistências</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${stats.ticketsAbertos}</span>
                    <span class="metric-label">Em Aberto</span>
                  </div>
                </div>
              </div>

              <div class="footer">
                <p><strong>RCORP Gestão de Seguros</strong></p>
                <p>Este é um relatório automático. Não responda este email.</p>
                <p>Para acessar o sistema completo e baixar o relatório em PDF, visite: <a href="https://fdab69fb-cde0-4bb7-ac60-2a713d93f1b4.lovableproject.com">Dashboard RCORP</a></p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Enviar email via Resend com PDF anexado
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "RCORP Relatórios <relatorios@resend.dev>",
          to: [schedule.email],
          subject: `📊 Relatório ${schedule.frequencia_dias} dias - ${schedule.empresas?.nome || "Sua Empresa"}`,
          html: htmlContent,
          attachments: [
            {
              filename: `relatorio-${schedule.empresas?.nome?.replace(/[^a-zA-Z0-9]/g, '-') || 'empresa'}-${new Date().toISOString().split('T')[0]}.pdf`,
              content: pdfBase64,
            },
          ],
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