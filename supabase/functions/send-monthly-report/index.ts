import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@2.0.0/+esm';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    const resend = new Resend(resendApiKey);

    console.log('Starting monthly report generation...');

    // Get all policies that are about to expire (30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringPolicies, error: policiesError } = await supabase
      .from('policies')
      .select(`
        *,
        users!inner(email, name, company)
      `)
      .lte('fim_vigencia', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('fim_vigencia', new Date().toISOString().split('T')[0]);

    if (policiesError) {
      throw policiesError;
    }

    console.log(`Found ${expiringPolicies?.length || 0} expiring policies`);

    if (!expiringPolicies || expiringPolicies.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expiring policies found' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Group policies by company
    const companiesMap = new Map();
    expiringPolicies.forEach((policy: any) => {
      const company = policy.users.company;
      if (!companiesMap.has(company)) {
        companiesMap.set(company, {
          policies: [],
          email: policy.users.email,
          name: policy.users.name
        });
      }
      companiesMap.get(company).policies.push(policy);
    });

    // Send email for each company
    const emailResults = [];
    for (const [companyName, companyData] of companiesMap) {
      try {
        const policiesList = companyData.policies
          .map((policy: any) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${policy.numero_apolice || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${policy.seguradora || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${policy.fim_vigencia || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">R$ ${policy.premio_total || '0,00'}</td>
            </tr>
          `)
          .join('');

        const emailHtml = `
          <h2>Relatório Mensal - Apólices com Vencimento Próximo</h2>
          <p>Olá ${companyData.name},</p>
          <p>Segue o relatório das apólices da empresa <strong>${companyName}</strong> que vencem nos próximos 30 dias:</p>
          
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Número da Apólice</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Seguradora</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Vencimento</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${policiesList}
            </tbody>
          </table>
          
          <p><strong>Total de apólices:</strong> ${companyData.policies.length}</p>
          
          <p>Entre em contato conosco para renovar suas apólices.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este relatório foi gerado automaticamente pelo sistema SmartApólice.
          </p>
        `;

        const emailResult = await resend.emails.send({
          from: 'RCORP Seguros <rcaldas@rcaldas.com.br>',
          to: [companyData.email],
          subject: `Relatório Mensal - ${companyName} - ${companyData.policies.length} apólices vencendo`,
          html: emailHtml,
        });

        emailResults.push({
          company: companyName,
          email: companyData.email,
          policies_count: companyData.policies.length,
          email_sent: true,
          email_id: emailResult.data?.id
        });

        console.log(`Email sent to ${companyName} (${companyData.email})`);

      } catch (emailError) {
        console.error(`Failed to send email to ${companyName}:`, emailError);
        emailResults.push({
          company: companyName,
          email: companyData.email,
          policies_count: companyData.policies.length,
          email_sent: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    console.log('Monthly report generation completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monthly reports sent successfully',
        companies_processed: emailResults.length,
        emails_sent: emailResults.filter(r => r.email_sent).length,
        results: emailResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-monthly-report function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);