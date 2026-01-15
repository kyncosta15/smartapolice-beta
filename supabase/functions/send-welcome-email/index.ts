import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  password: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, name }: WelcomeEmailRequest = await req.json();

    console.log(`Enviando email de boas-vindas para: ${email}`);

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à RCORP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a1628;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a1628;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 700px; border-collapse: collapse; background: linear-gradient(135deg, #0a1628 0%, #132743 50%, #0a1628 100%); position: relative;">
          
          <!-- Decorative hexagons background (simulated with borders) -->
          <tr>
            <td style="padding: 30px 40px 20px; position: relative;">
              <!-- Header row -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #8899aa; font-size: 12px; letter-spacing: 2px; font-weight: 400;">
                    SEU PRIMEIRO ACESSO
                  </td>
                  <td style="text-align: right; color: #8899aa; font-size: 12px; letter-spacing: 2px; font-weight: 400;">
                    RCORP
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Title -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #d4a53c; font-size: 48px; font-weight: 700; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                Seja bem vindo (a)
              </h1>
            </td>
          </tr>
          
          <!-- Welcome text -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <p style="margin: 0 0 15px; color: #a8b8c8; font-size: 18px; line-height: 1.6;">
                É muito bom perceber que confiou em nós!
              </p>
              <p style="margin: 0; color: #a8b8c8; font-size: 18px; line-height: 1.6;">
                Com um imenso prazer, estamos a disposição para mudar a forma de<br>
                cuidar melhor das suas apólices.
              </p>
            </td>
          </tr>
          
          <!-- Access instructions -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 18px; line-height: 1.6;">
                Acesse com os <strong>dados abaixo</strong> e altere sua senha no <strong>primeiro login.</strong>
              </p>
            </td>
          </tr>
          
          <!-- URL Link -->
          <tr>
            <td style="padding: 0 40px 25px; text-align: center;">
              <a href="https://rcorp.rcaldas.com.br" style="color: #4a9eff; font-size: 20px; text-decoration: underline; font-weight: 500;">
                https://rcorp.rcaldas.com.br
              </a>
            </td>
          </tr>
          
          <!-- Login Box -->
          <tr>
            <td style="padding: 0 40px 15px; text-align: center;">
              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="background: rgba(255,255,255,0.05); border: 2px solid #8b4513; border-radius: 50px; padding: 15px 40px;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding-right: 15px; letter-spacing: 1px;">
                          LOGIN
                        </td>
                        <td style="padding-right: 15px;">
                          <div style="width: 40px; height: 40px; background: #ffffff; border-radius: 50%; display: inline-block; text-align: center; line-height: 40px;">
                            <span style="color: #0a1628; font-size: 20px;">👤</span>
                          </div>
                        </td>
                        <td style="color: #d4a53c; font-size: 18px; font-weight: 500;">
                          ${email}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Password Box -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="background: rgba(255,255,255,0.05); border: 2px solid #8b4513; border-radius: 50px; padding: 15px 40px;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding-right: 15px; letter-spacing: 1px;">
                          SENHA
                        </td>
                        <td style="padding-right: 15px;">
                          <div style="width: 40px; height: 40px; background: #ffffff; border-radius: 50%; display: inline-block; text-align: center; line-height: 40px;">
                            <span style="color: #0a1628; font-size: 20px;">🔒</span>
                          </div>
                        </td>
                        <td style="color: #d4a53c; font-size: 18px; font-weight: 500; letter-spacing: 3px;">
                          ${password}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer with logo -->
          <tr>
            <td style="padding: 30px 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #ffffff; font-size: 14px; font-weight: 600;">
                    <span style="font-weight: 700;">ℝ</span> RCALDAS <span style="font-weight: 300;">Tech</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Additional info -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a1628;">
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="margin: 0; color: #666666; font-size: 12px;">
          © ${new Date().getFullYear()} RCORP - Todos os direitos reservados
        </p>
        <p style="margin: 10px 0 0; color: #666666; font-size: 11px;">
          Este email foi enviado automaticamente após a criação da sua conta.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "RCORP Seguros <relatorios@rcorp.rcaldas.com.br>",
      to: [email],
      subject: "🎉 Seu Primeiro Acesso - RCORP",
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
