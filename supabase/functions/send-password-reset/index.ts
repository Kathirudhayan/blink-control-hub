import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  otpCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otpCode }: PasswordResetRequest = await req.json();

    if (!email || !otpCode) {
      throw new Error("Missing required fields: email and otpCode");
    }

    console.log(`Sending password reset OTP to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "BlinkControl <onboarding@resend.dev>",
      to: [email],
      subject: "Your Password Reset Code - BlinkControl",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0b;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" max-width="480" cellspacing="0" cellpadding="0" style="max-width: 480px;">
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 30px;">
                      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px;">👁️</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0; font-weight: 700;">BlinkControl</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Card -->
                  <tr>
                    <td style="background-color: #1a1a1f; border-radius: 16px; padding: 40px; border: 1px solid #27272a;">
                      <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px 0; text-align: center; font-weight: 600;">
                        Password Reset Code
                      </h2>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                        Use the following 6-digit code to reset your password. This code will expire in 1 hour.
                      </p>
                      
                      <!-- OTP Code Box -->
                      <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">
                          ${otpCode}
                        </span>
                      </div>
                      
                      <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                        If you didn't request this password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 30px; text-align: center;">
                      <p style="color: #52525b; font-size: 12px; margin: 0;">
                        © 2024 BlinkControl. Eye-Based Appliance Control.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
