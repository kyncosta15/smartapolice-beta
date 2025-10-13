import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";
import "https://esm.sh/jspdf-autotable@3.8.2";

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

        // Gerar relatório PDF
        const pdf = new jsPDF.default();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;

        // Header
        pdf.setFontSize(20);
        pdf.setTextColor(102, 126, 234);
        pdf.text('Relatório Executivo', 20, 30);

        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${schedule.empresas?.nome || "Empresa"}`, 20, 40);
        pdf.text(`Período: ${new Date().toLocaleDateString("pt-BR")}`, 20, 50);

        // Resumo Executivo
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Resumo Executivo', 20, 70);

        const summaryData = [
          ['Total de Veículos', (veiculos?.length || 0).toString()],
          ['Veículos Segurados', (veiculos?.filter(v => v.status_seguro === 'segurado').length || 0).toString()],
          ['Veículos Sem Seguro', (veiculos?.filter(v => v.status_seguro === 'sem_seguro').length || 0).toString()],
          ['Apólices Ativas', (apolices?.length || 0).toString()],
          ['Total de Vidas', (apolices?.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0) || 0).toString()],
          ['Total de Sinistros', (sinistros?.length || 0).toString()],
          ['Total de Assistências', (assistencias?.length || 0).toString()],
          ['Tickets em Aberto', ([...(sinistros || []), ...(assistencias || [])].filter(t => t.status === 'aberto').length).toString()]
        ];

        (pdf as any).autoTable({
          startY: 80,
          head: [['Métrica', 'Valor']],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] },
          styles: { fontSize: 10 }
        });

        // Distribuição de Veículos por Status
        let currentY = (pdf as any).lastAutoTable.finalY + 20;
        
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 30;
        }
        
        pdf.setFontSize(14);
        pdf.text('Distribuição de Veículos por Status', 20, currentY);

        const statusCounts = (veiculos || []).reduce((acc: any, v) => {
          const status = v.status_seguro || 'indefinido';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const statusData = Object.entries(statusCounts).map(([status, count]) => [
          status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          count.toString(),
          `${((count as number / (veiculos?.length || 1)) * 100).toFixed(1)}%`
        ]);

        (pdf as any).autoTable({
          startY: currentY + 10,
          head: [['Status', 'Quantidade', 'Percentual']],
          body: statusData,
          theme: 'grid',
          headStyles: { fillColor: [76, 175, 80] },
          styles: { fontSize: 10 }
        });

        // Distribuição de Apólices por Seguradora
        currentY = (pdf as any).lastAutoTable.finalY + 20;
        
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 30;
        }
        
        pdf.setFontSize(14);
        pdf.text('Distribuição de Apólices por Seguradora', 20, currentY);

        const seguradoraCounts = (apolices || []).reduce((acc: any, a) => {
          const seguradora = a.seguradora || 'Não informada';
          acc[seguradora] = (acc[seguradora] || 0) + 1;
          return acc;
        }, {});

        const seguradoraData = Object.entries(seguradoraCounts).map(([seguradora, count]) => [
          seguradora,
          count.toString(),
          `${((count as number / (apolices?.length || 1)) * 100).toFixed(1)}%`
        ]);

        (pdf as any).autoTable({
          startY: currentY + 10,
          head: [['Seguradora', 'Quantidade', 'Percentual']],
          body: seguradoraData,
          theme: 'grid',
          headStyles: { fillColor: [255, 152, 0] },
          styles: { fontSize: 10 }
        });

        // Footer
        const totalPages = pdf.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            `RCORP Gestão de Seguros © ${new Date().getFullYear()} - Página ${i} de ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }

        // Converter PDF para base64
        const pdfOutput = pdf.output('arraybuffer');
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfOutput)));

        // Montar HTML do relatório
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

              <div class="section">
                <h2>🚗 Gestão de Frotas</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${veiculos?.length || 0}</span>
                    <span class="metric-label">Veículos</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${veiculos?.filter(v => v.status_seguro === 'segurado').length || 0}</span>
                    <span class="metric-label">Segurados</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${veiculos?.filter(v => v.status_seguro === 'sem_seguro').length || 0}</span>
                    <span class="metric-label">Sem Seguro</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2>🏥 Apólices de Benefícios</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${apolices?.length || 0}</span>
                    <span class="metric-label">Apólices Ativas</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${apolices?.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0) || 0}</span>
                    <span class="metric-label">Vidas</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2>🚨 Sinistros e Assistências</h2>
                <div class="metrics">
                  <div class="metric">
                    <span class="metric-value">${sinistros?.length || 0}</span>
                    <span class="metric-label">Sinistros</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${assistencias?.length || 0}</span>
                    <span class="metric-label">Assistências</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">${[...(sinistros || []), ...(assistencias || [])].filter(t => t.status === 'aberto').length}</span>
                    <span class="metric-label">Em Aberto</span>
                  </div>
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

        // Enviar email via Resend com anexo PDF
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "RCORP Relatórios <relatorios@resend.dev>",
          to: [schedule.email],
          subject: `📊 Relatório ${schedule.frequencia_dias} dias - ${schedule.empresas?.nome || "Sua Empresa"}`,
          html: htmlContent,
          attachments: [
            {
              filename: `relatorio-${schedule.empresas?.nome || 'empresa'}-${new Date().toISOString().split('T')[0]}.pdf`,
              content: pdfBase64,
            }
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