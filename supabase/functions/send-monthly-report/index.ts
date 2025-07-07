import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";
import jsPDF from 'npm:jspdf@2.5.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PolicyData {
  id: string;
  seguradora: string;
  tipo_seguro: string;
  valor_premio: number;
  custo_mensal: number;
  extraido_em: string;
  user_id: string;
  segurado: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly report generation...");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se é chamada manual (com email específico) ou automática
    const requestBody = await req.json().catch(() => ({}));
    const isManualCall = requestBody.userEmail && requestBody.userName;

    console.log("Request type:", isManualCall ? "Manual" : "Automatic");

    if (isManualCall) {
      // Para chamadas manuais, enviar apenas para o usuário específico
      console.log(`Manual call for user: ${requestBody.userEmail}`);
      
      // Para chamadas manuais, buscar policies do usuário usando o header de autorização
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Criar cliente com o token do usuário para respeitar RLS
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: {
              authorization: authHeader
            }
          }
        }
      );

      const { data: userPolicies, error: userPoliciesError } = await userSupabase
        .from('policies')
        .select('*');

      if (userPoliciesError) {
        console.error('Error fetching user policies:', userPoliciesError);
        throw new Error(`Failed to fetch user policies: ${userPoliciesError.message}`);
      }

      console.log(`Found ${userPolicies?.length || 0} policies for user`);

      // Gerar PDF
      const pdfBuffer = await generatePDFReport(userPolicies || []);

      // Enviar email para o usuário
      await sendReportEmail(requestBody.userEmail, requestBody.userName, pdfBuffer);

      return new Response(JSON.stringify({ 
        message: 'Report sent successfully',
        recipientCount: 1,
        policyCount: userPolicies?.length || 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else {
      // Para chamadas automáticas, buscar todas as policies e enviar para admins
      console.log("Automatic monthly report call");

      // Buscar todas as apólices usando service role key para ignorar RLS
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('*');

      if (policiesError) {
        console.error('Error fetching policies:', policiesError);
        throw new Error(`Failed to fetch policies: ${policiesError.message}`);
      }

      console.log(`Found ${policies?.length || 0} policies`);

      // Buscar usuários administradores
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('email, name')
        .eq('role', 'administrador');

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
        throw new Error(`Failed to fetch administrators: ${adminsError.message}`);
      }

      console.log(`Found ${admins?.length || 0} administrators`);

      if (!admins || admins.length === 0) {
        console.log('No administrators found, skipping email');
        return new Response(JSON.stringify({ message: 'No administrators found' }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Gerar PDF
      const pdfBuffer = await generatePDFReport(policies || []);

      // Enviar email para cada administrador
      const emailPromises = admins.map(admin => sendReportEmail(admin.email, admin.name, pdfBuffer));
      await Promise.all(emailPromises);

      console.log('Monthly reports sent successfully');

      return new Response(JSON.stringify({ 
        message: 'Monthly reports sent successfully',
        recipientCount: admins.length,
        policyCount: policies?.length || 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in send-monthly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function generatePDFReport(policies: any[]): Promise<Uint8Array> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Calcular métricas
  const totalPolicies = policies.length;
  const totalMonthlyCost = policies.reduce((sum, p) => sum + (p.custo_mensal || 0), 0);
  const totalInsuredValue = policies.reduce((sum, p) => sum + (p.valor_premio || 0), 0);

  // Distribuição por seguradora
  const insurerDistribution = policies.reduce((acc, policy) => {
    const insurer = policy.seguradora || 'Não informado';
    acc[insurer] = (acc[insurer] || 0) + 1;
    return acc;
  }, {});

  // Distribuição por tipo
  const typeDistribution = policies.reduce((acc, policy) => {
    const type = policy.tipo_seguro || 'Não informado';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // CABEÇALHO
  pdf.setFontSize(24);
  pdf.setTextColor(51, 51, 51);
  pdf.text('Relatório Mensal de Apólices - SmartApólice', 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.setTextColor(102, 102, 102);
  pdf.text(`Gerado automaticamente em: ${new Date().toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 20, yPosition);
  yPosition += 20;

  // RESUMO EXECUTIVO
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text('RESUMO EXECUTIVO', 20, yPosition);
  yPosition += 15;

  const kpis = [
    ['Total de Apólices', `${totalPolicies} apólices`],
    ['Custo Mensal Total', `R$ ${totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Valor Segurado Total', `R$ ${totalInsuredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Período do Relatório', new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })]
  ];

  pdf.setFontSize(12);
  kpis.forEach(([label, value]) => {
    pdf.setTextColor(102, 102, 102);
    pdf.text(label + ':', 25, yPosition);
    pdf.setTextColor(51, 51, 51);
    pdf.text(value, 90, yPosition);
    yPosition += 8;
  });

  yPosition += 15;

  // DISTRIBUIÇÃO POR SEGURADORA
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text('DISTRIBUIÇÃO POR SEGURADORA', 20, yPosition);
  yPosition += 15;

  Object.entries(insurerDistribution).slice(0, 10).forEach(([insurer, count], index) => {
    const percentage = ((count as number / totalPolicies) * 100).toFixed(1);
    
    pdf.setFontSize(10);
    pdf.setTextColor(51, 51, 51);
    pdf.text(insurer, 25, yPosition);
    
    pdf.setTextColor(102, 102, 102);
    pdf.text(`${count} apólices (${percentage}%)`, 120, yPosition);
    
    yPosition += 10;
  });

  yPosition += 15;

  // DISTRIBUIÇÃO POR TIPO
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text('DISTRIBUIÇÃO POR TIPO DE SEGURO', 20, yPosition);
  yPosition += 15;

  Object.entries(typeDistribution).forEach(([type, count]) => {
    const percentage = ((count as number / totalPolicies) * 100).toFixed(1);
    
    pdf.setFontSize(10);
    pdf.setTextColor(51, 51, 51);
    pdf.text(type, 25, yPosition);
    
    pdf.setTextColor(102, 102, 102);
    pdf.text(`${count} apólices (${percentage}%)`, 120, yPosition);
    
    yPosition += 10;
  });

  // RODAPÉ
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('SmartApólice - Sistema de Gestão de Apólices', 20, pdf.internal.pageSize.getHeight() - 10);

  // Converter para Uint8Array
  const pdfArrayBuffer = pdf.output('arraybuffer');
  return new Uint8Array(pdfArrayBuffer);
}

async function sendReportEmail(email: string, name: string, pdfBuffer: Uint8Array): Promise<void> {
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  await resend.emails.send({
    from: "SmartApólice <onboarding@resend.dev>", // Domínio de teste do Resend
    to: [email],
    subject: `Relatório Mensal de Apólices - ${currentMonth}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
          Relatório Mensal - SmartApólice
        </h1>
        
        <p>Olá ${name},</p>
        
        <p>Segue anexo o relatório mensal de apólices referente ao mês de <strong>${currentMonth}</strong>.</p>
        
        <p>Este relatório contém:</p>
        <ul>
          <li>Resumo executivo com métricas principais</li>
          <li>Distribuição de apólices por seguradora</li>
          <li>Distribuição por tipo de seguro</li>
          <li>Análise financeira do período</li>
        </ul>
        
        <p>O relatório é gerado automaticamente todo dia 1º do mês às 9:00.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          Este é um email automático do sistema SmartApólice.<br>
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `relatorio-mensal-${new Date().toISOString().slice(0, 7)}.pdf`,
        content: Array.from(pdfBuffer),
      }
    ],
  });
}

serve(handler);