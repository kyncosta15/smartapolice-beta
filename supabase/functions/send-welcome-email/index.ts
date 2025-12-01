import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name }: WelcomeEmailRequest = await req.json();

    console.log(`Enviando email de boas-vindas para: ${email}`);

    const userName = name || email.split('@')[0];

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à RCORP Seguros</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Bem-vindo à RCORP Seguros!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.6;">
                Olá, <strong>${userName}</strong>!
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Estamos muito felizes em tê-lo conosco! Sua conta foi criada com sucesso e agora você tem acesso completo ao nosso sistema de gestão de seguros.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 15px; color: #1e3a5f; font-size: 18px;">
                  📋 O que você pode fazer no sistema:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 2;">
                  <li><strong>Gestão de Apólices</strong> - Visualize e gerencie todas as suas apólices de seguro</li>
                  <li><strong>Gestão de Frota</strong> - Controle completo dos veículos da sua empresa</li>
                  <li><strong>Sinistros e Assistências</strong> - Abertura e acompanhamento de ocorrências</li>
                  <li><strong>Relatórios Executivos</strong> - Insights e análises do seu portfólio</li>
                  <li><strong>Gestão de Colaboradores</strong> - Administre benefícios da sua equipe</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                Para começar, basta acessar o sistema e explorar as funcionalidades disponíveis. Se precisar de ajuda, nossa equipe está sempre à disposição!
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://rcorp.rcaldas.com.br/dashboard" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);">
                      Acessar o Sistema →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0 0 10px; color: #777777; font-size: 14px;">
                  <strong>Precisa de ajuda?</strong>
                </p>
                <p style="margin: 0; color: #777777; font-size: 14px; line-height: 1.6;">
                  Entre em contato conosco pelo email <a href="mailto:suporte@rcaldas.com.br" style="color: #1e3a5f;">suporte@rcaldas.com.br</a> ou pelo WhatsApp.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px;">
                © ${new Date().getFullYear()} RCORP Seguros - Todos os direitos reservados
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Este email foi enviado automaticamente após a criação da sua conta.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "RCORP Seguros <relatorios@rcorp.rcaldas.com.br>",
      to: [email],
      subject: "🎉 Bem-vindo à RCORP Seguros!",
      html: htmlContent,
    });

    console.log("Email de boas-vindas enviado com sucesso:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar email de boas-vindas:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
