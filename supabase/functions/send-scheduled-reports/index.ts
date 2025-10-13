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

        // Buscar dados completos da empresa para o relatório (mesma estrutura do ClientReports)
        const { data: empresaUsers } = await supabaseAdmin
          .from("user_memberships")
          .select("user_id")
          .eq("empresa_id", schedule.empresa_id);

        const userIds = empresaUsers?.map(m => m.user_id) || [];

        const [ticketsRes, veiculosRes, apolicesBeneficiosRes, apolicesSegurosRes] = await Promise.all([
          supabaseAdmin
            .from("tickets")
            .select("*")
            .eq("empresa_id", schedule.empresa_id),
          
          supabaseAdmin
            .from("frota_veiculos")
            .select("*")
            .eq("empresa_id", schedule.empresa_id),
          
          supabaseAdmin
            .from("apolices_beneficios")
            .select("*")
            .eq("empresa_id", schedule.empresa_id),

          userIds.length > 0
            ? supabaseAdmin
                .from("policies")
                .select("*")
                .in("user_id", userIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        const tickets = ticketsRes.data || [];
        const veiculos = veiculosRes.data || [];
        const apolicesBeneficios = apolicesBeneficiosRes.data || [];
        const apolicesSeguros = apolicesSegurosRes.data || [];

        // Calcular estatísticas completas
        const sinistros = tickets.filter(t => t.tipo === 'sinistro');
        const assistencias = tickets.filter(t => t.tipo === 'assistencia');
        const veiculosSegurados = veiculos.filter(v => v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro');
        const veiculosSemSeguro = veiculos.filter(v => v.status_seguro === 'sem_seguro');

        // Combinar todas as apólices
        const todasApolices = [
          ...apolicesBeneficios,
          ...apolicesSeguros.map(p => ({
            numero_apolice: p.numero_apolice || '-',
            seguradora: p.seguradora || '-',
            tipo_beneficio: p.tipo_seguro || 'Auto',
            status: p.status || '-',
            valor_total: parseFloat(String(p.valor_premio || 0)),
            quantidade_vidas: null
          }))
        ];

        const stats = {
          totalVeiculos: veiculos.length,
          veiculosSegurados: veiculosSegurados.length,
          veiculosSemSeguro: veiculosSemSeguro.length,
          totalApolices: todasApolices.length,
          totalVidas: todasApolices.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0),
          totalSinistros: sinistros.length,
          totalAssistencias: assistencias.length,
          ticketsAbertos: tickets.filter(t => t.status === 'aberto').length,
          percentualSegurado: veiculos.length > 0 ? ((veiculosSegurados.length / veiculos.length) * 100).toFixed(1) : '0.0',
          apolicesAtivas: todasApolices.filter(a => a.status === 'ativa' || a.status === 'Ativa').length,
          valorTotalApolices: todasApolices.reduce((sum, a) => sum + (parseFloat(String(a.valor_total || 0))), 0)
        };

        // Gerar PDF executivo completo (mesma estrutura do ClientReports)
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();
        let yPosition = height - 40;

        // === CAPA DO RELATÓRIO ===
        page.drawRectangle({
          x: 0,
          y: height - 60,
          width: width,
          height: 60,
          color: rgb(0, 0.28, 1), // Azul RCorp
        });

        page.drawText('Relatório Executivo', {
          x: width / 2 - 80,
          y: height - 30,
          size: 24,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });

        page.drawText('Gestão de Frotas e Seguros', {
          x: width / 2 - 65,
          y: height - 48,
          size: 14,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });

        yPosition = height - 80;

        // === INFORMAÇÕES DA EMPRESA ===
        page.drawText(schedule.empresas?.nome || "Empresa", {
          x: 50,
          y: yPosition,
          size: 14,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 20;

        const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        page.drawText(`Data de geração: ${dataGeracao}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 30;

        // === KPIs PRINCIPAIS ===
        page.drawRectangle({
          x: 30,
          y: yPosition - 55,
          width: width - 60,
          height: 60,
          color: rgb(0.96, 0.96, 0.97),
        });

        page.drawText('INDICADORES PRINCIPAIS', {
          x: 40,
          y: yPosition - 5,
          size: 10,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 20;

        // KPIs em grid (4 colunas)
        const kpis = [
          { label: 'Total Veículos', value: stats.totalVeiculos.toString(), color: rgb(0, 0.28, 1) },
          { label: 'Segurados', value: stats.veiculosSegurados.toString(), color: rgb(0.13, 0.77, 0.37) },
          { label: 'Sem Seguro', value: stats.veiculosSemSeguro.toString(), color: rgb(0.94, 0.27, 0.27) },
          { label: 'Total Apólices', value: stats.totalApolices.toString(), color: rgb(0.98, 0.45, 0.09) }
        ];

        let kpiX = 40;
        const kpiWidth = 120;
        const kpiHeight = 40;

        kpis.forEach((kpi) => {
          page.drawRectangle({
            x: kpiX,
            y: yPosition - 35,
            width: kpiWidth,
            height: kpiHeight,
            color: kpi.color,
          });

          page.drawText(kpi.value, {
            x: kpiX + kpiWidth / 2 - (kpi.value.length * 5),
            y: yPosition - 15,
            size: 18,
            font: helveticaBold,
            color: rgb(1, 1, 1),
          });

          page.drawText(kpi.label, {
            x: kpiX + kpiWidth / 2 - (kpi.label.length * 2.5),
            y: yPosition - 28,
            size: 8,
            font: helveticaFont,
            color: rgb(1, 1, 1),
          });

          kpiX += kpiWidth + 10;
        });

        yPosition -= 65;

        // === INSIGHTS AUTOMÁTICOS ===
        page.drawRectangle({
          x: 30,
          y: yPosition - 45,
          width: width - 60,
          height: 50,
          color: rgb(1, 0.95, 0.8),
        });

        page.drawText('INSIGHTS', {
          x: 40,
          y: yPosition - 5,
          size: 10,
          font: helveticaBold,
          color: rgb(0.57, 0.25, 0.05),
        });
        yPosition -= 18;

        const insights = [
          `• ${stats.percentualSegurado}% da frota está coberta por seguro`,
          `• ${stats.apolicesAtivas} apólices ativas gerenciadas`,
          `• ${stats.ticketsAbertos} tickets necessitam acompanhamento`,
          `• Valor total mensal: R$ ${(stats.valorTotalApolices / 1000).toFixed(1)}k`
        ];

        insights.forEach((insight) => {
          page.drawText(insight, {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: rgb(0.57, 0.25, 0.05),
          });
          yPosition -= 12;
        });

        yPosition -= 30;

        // === GESTÃO DE FROTAS ===
        page.drawText('GESTÃO DE FROTAS', {
          x: 40,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0.28, 1),
        });
        yPosition -= 20;

        const frotaItems = [
          `Total de Veículos: ${stats.totalVeiculos}`,
          `Veículos Segurados: ${stats.veiculosSegurados} (${stats.percentualSegurado}%)`,
          `Veículos Sem Seguro: ${stats.veiculosSemSeguro}`
        ];

        frotaItems.forEach((item) => {
          page.drawText(item, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPosition -= 15;
        });

        yPosition -= 20;

        // === APÓLICES E BENEFÍCIOS ===
        page.drawText('APÓLICES E BENEFÍCIOS', {
          x: 40,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0.28, 1),
        });
        yPosition -= 20;

        const apolicesItems = [
          `Total de Apólices: ${stats.totalApolices}`,
          `Apólices Ativas: ${stats.apolicesAtivas}`,
          `Total de Vidas Cobertas: ${stats.totalVidas}`,
          `Valor Total Mensal: R$ ${stats.valorTotalApolices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ];

        apolicesItems.forEach((item) => {
          page.drawText(item, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPosition -= 15;
        });

        yPosition -= 20;

        // === SINISTROS E ASSISTÊNCIAS ===
        page.drawText('SINISTROS E ASSISTÊNCIAS', {
          x: 40,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0.28, 1),
        });
        yPosition -= 20;

        const ticketsItems = [
          `Total de Sinistros: ${stats.totalSinistros}`,
          `Total de Assistências: ${stats.totalAssistencias}`,
          `Tickets em Aberto: ${stats.ticketsAbertos}`
        ];

        ticketsItems.forEach((item) => {
          page.drawText(item, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPosition -= 15;
        });

        // === RODAPÉ ===
        const footerY = 60;
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: footerY,
          color: rgb(0, 0.28, 1),
        });

        page.drawText('Conte com nossa equipe para cuidar das suas apólices.', {
          x: width / 2 - 120,
          y: footerY - 15,
          size: 10,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });

        page.drawText('📧 contato@smartapolice.com.br | 📱 (11) 99999-9999', {
          x: width / 2 - 125,
          y: footerY - 30,
          size: 8,
          font: helveticaFont,
          color: rgb(1, 1, 1),
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