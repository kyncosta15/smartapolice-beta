import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, startDate, endDate, userId } = await req.json();

    if (!email || !startDate || !endDate || !userId) {
      throw new Error("Parâmetros obrigatórios: email, startDate, endDate, userId");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Buscar empresa do usuário
    const { data: membership } = await supabaseAdmin
      .from("user_memberships")
      .select("empresa_id, empresas:empresa_id(id, nome, cnpj)")
      .eq("user_id", userId)
      .single();

    const empresaId = membership?.empresa_id;
    const empresaNome = membership?.empresas?.nome || "Sua Empresa";

    // Buscar dados do período
    const [ticketsRes, veiculosRes, apolicesBeneficiosRes, apolicesSegurosRes] = await Promise.all([
      supabaseAdmin
        .from("tickets")
        .select("*")
        .eq("empresa_id", empresaId)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59"),
      
      supabaseAdmin
        .from("frota_veiculos")
        .select("*")
        .eq("empresa_id", empresaId),
      
      supabaseAdmin
        .from("apolices_beneficios")
        .select("*")
        .eq("empresa_id", empresaId),

      supabaseAdmin
        .from("policies")
        .select("*")
        .eq("user_id", userId)
    ]);

    const tickets = ticketsRes.data || [];
    const veiculos = veiculosRes.data || [];
    const apolicesBeneficios = apolicesBeneficiosRes.data || [];
    const apolicesSeguros = apolicesSegurosRes.data || [];

    // Calcular estatísticas
    const sinistros = tickets.filter(t => t.tipo === 'sinistro');
    const assistencias = tickets.filter(t => t.tipo === 'assistencia');
    const veiculosSegurados = veiculos.filter(v => v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro');
    const veiculosSemSeguro = veiculos.filter(v => v.status_seguro === 'sem_seguro');

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

    // Gerar PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let yPosition = height - 40;

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width: width,
      height: 70,
      color: rgb(0, 0.28, 1),
    });

    page.drawText('Relatorio Executivo', {
      x: width / 2 - 80,
      y: height - 35,
      size: 24,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    const periodoFormatado = `Periodo: ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`;
    page.drawText(periodoFormatado, {
      x: width / 2 - (periodoFormatado.length * 3),
      y: height - 55,
      size: 12,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    yPosition = height - 90;

    // Empresa
    page.drawText(empresaNome, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 25;

    const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    page.drawText(`Gerado em: ${dataGeracao}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 35;

    // KPIs
    page.drawRectangle({
      x: 30,
      y: yPosition - 60,
      width: width - 60,
      height: 65,
      color: rgb(0.96, 0.96, 0.97),
    });

    page.drawText('INDICADORES DO PERIODO', {
      x: 40,
      y: yPosition - 5,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 20;

    const kpis = [
      { label: 'Veiculos', value: stats.totalVeiculos.toString(), color: rgb(0, 0.28, 1) },
      { label: 'Segurados', value: stats.veiculosSegurados.toString(), color: rgb(0.13, 0.77, 0.37) },
      { label: 'Sinistros', value: stats.totalSinistros.toString(), color: rgb(0.94, 0.27, 0.27) },
      { label: 'Assistencias', value: stats.totalAssistencias.toString(), color: rgb(0.98, 0.45, 0.09) }
    ];

    let kpiX = 40;
    const kpiWidth = 120;

    kpis.forEach((kpi) => {
      page.drawRectangle({
        x: kpiX,
        y: yPosition - 38,
        width: kpiWidth,
        height: 42,
        color: kpi.color,
      });

      page.drawText(kpi.value, {
        x: kpiX + kpiWidth / 2 - (kpi.value.length * 6),
        y: yPosition - 18,
        size: 20,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(kpi.label, {
        x: kpiX + kpiWidth / 2 - (kpi.label.length * 2.5),
        y: yPosition - 32,
        size: 9,
        font: helveticaFont,
        color: rgb(1, 1, 1),
      });

      kpiX += kpiWidth + 10;
    });

    yPosition -= 75;

    // Insights
    page.drawRectangle({
      x: 30,
      y: yPosition - 70,
      width: width - 60,
      height: 75,
      color: rgb(1, 0.95, 0.8),
    });

    page.drawText('INSIGHTS DO PERIODO', {
      x: 40,
      y: yPosition - 5,
      size: 10,
      font: helveticaBold,
      color: rgb(0.57, 0.25, 0.05),
    });
    yPosition -= 20;

    const insights = [
      `• ${stats.percentualSegurado}% da frota coberta por seguro`,
      `• ${stats.apolicesAtivas} apolices ativas no sistema`,
      `• ${stats.ticketsAbertos} tickets aguardando atendimento`,
      `• ${stats.totalSinistros + stats.totalAssistencias} ocorrencias no periodo`
    ];

    insights.forEach((insight) => {
      page.drawText(insight, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.57, 0.25, 0.05),
      });
      yPosition -= 14;
    });

    yPosition -= 30;

    // Seções detalhadas
    const sections = [
      {
        title: 'GESTAO DE FROTAS',
        items: [
          `Total de Veiculos: ${stats.totalVeiculos}`,
          `Veiculos Segurados: ${stats.veiculosSegurados} (${stats.percentualSegurado}%)`,
          `Veiculos Sem Seguro: ${stats.veiculosSemSeguro}`
        ]
      },
      {
        title: 'APOLICES E BENEFICIOS',
        items: [
          `Total de Apolices: ${stats.totalApolices}`,
          `Apolices Ativas: ${stats.apolicesAtivas}`,
          `Vidas Cobertas: ${stats.totalVidas}`,
          `Valor Total: R$ ${stats.valorTotalApolices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]
      },
      {
        title: 'SINISTROS E ASSISTENCIAS',
        items: [
          `Sinistros no Periodo: ${stats.totalSinistros}`,
          `Assistencias no Periodo: ${stats.totalAssistencias}`,
          `Tickets em Aberto: ${stats.ticketsAbertos}`
        ]
      }
    ];

    sections.forEach((section) => {
      page.drawText(section.title, {
        x: 40,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0.28, 1),
      });
      yPosition -= 18;

      section.items.forEach((item) => {
        page.drawText(item, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 14;
      });
      yPosition -= 15;
    });

    // Footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 50,
      color: rgb(0, 0.28, 1),
    });

    page.drawText('SmartApolice - Gestao Inteligente de Seguros', {
      x: width / 2 - 110,
      y: 30,
      size: 10,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    page.drawText('Relatorio gerado automaticamente', {
      x: width / 2 - 75,
      y: 15,
      size: 8,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 1),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    // Enviar email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .metric { background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .metric-label { font-size: 12px; color: #6b7280; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Relatorio Executivo</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">${empresaNome}</p>
            <p style="margin: 5px 0 0; font-size: 14px;">${periodoFormatado}</p>
          </div>
          <div class="content">
            <h3>Resumo do Periodo</h3>
            <div class="metric-grid">
              <div class="metric">
                <div class="metric-value">${stats.totalVeiculos}</div>
                <div class="metric-label">Veiculos na Frota</div>
              </div>
              <div class="metric">
                <div class="metric-value">${stats.veiculosSegurados}</div>
                <div class="metric-label">Veiculos Segurados</div>
              </div>
              <div class="metric">
                <div class="metric-value">${stats.totalSinistros}</div>
                <div class="metric-label">Sinistros</div>
              </div>
              <div class="metric">
                <div class="metric-value">${stats.totalAssistencias}</div>
                <div class="metric-label">Assistencias</div>
              </div>
            </div>
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>Destaque:</strong> ${stats.percentualSegurado}% da frota esta coberta por seguro. 
              ${stats.ticketsAbertos > 0 ? `Existem ${stats.ticketsAbertos} tickets aguardando atendimento.` : 'Nenhum ticket pendente no momento.'}
            </p>
            <p style="text-align: center; margin-top: 20px;">
              <strong>Relatorio PDF em anexo</strong><br>
              <span style="font-size: 12px; color: #6b7280;">O documento completo esta anexado a este email.</span>
            </p>
          </div>
          <div class="footer">
            <p>SmartApolice - Gestao Inteligente de Seguros</p>
            <p>Este email foi enviado automaticamente.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await resend.emails.send({
      from: "RCORP Seguros <relatorios@rcorp.rcaldas.com.br>",
      to: [email],
      subject: `Relatorio Executivo - ${empresaNome} - ${periodoFormatado}`,
      html: htmlContent,
      attachments: [
        {
          filename: `relatorio_executivo_${startDate}_${endDate}.pdf`,
          content: pdfBase64,
          contentType: "application/pdf"
        }
      ]
    });

    console.log("Email enviado com sucesso:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.data?.id }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Erro ao enviar relatorio:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
