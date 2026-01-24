import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmergencyEmailRequest {
  to_email: string;
  time: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, time }: EmergencyEmailRequest = await req.json();

    console.log(`Sending emergency email to: ${to_email} at ${time}`);

    if (!to_email || !to_email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Emergency Alert <onboarding@resend.dev>",
      to: [to_email],
      subject: "🚨 EMERGENCY ALERT - Eye Blink Control System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; border-radius: 16px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-transform: uppercase; letter-spacing: 2px;">🚨 EMERGENCY ALERT 🚨</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">BlinkControl Safety System</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 16px; margin-top: 20px; border: 3px solid #ef4444;">
            <h2 style="color: #dc2626; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
              ⚠️ IMMEDIATE ATTENTION REQUIRED ⚠️
            </h2>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">📋 Alert Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #7f1d1d; font-weight: bold;">Alert Type:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #dc2626;">Emergency Blink Signal (5 consecutive blinks)</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #7f1d1d; font-weight: bold;">Triggered At:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #dc2626;">${time}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #7f1d1d; font-weight: bold;">User Email:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #fecaca; color: #dc2626;">${to_email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #7f1d1d; font-weight: bold;">System:</td>
                  <td style="padding: 10px; color: #dc2626;">Eye Blink-Based Appliance Control</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef08a; padding: 20px; border-radius: 12px; border: 2px solid #eab308;">
              <h3 style="color: #854d0e; margin: 0 0 10px 0; font-size: 16px;">🆘 What This Means:</h3>
              <p style="color: #713f12; margin: 0; line-height: 1.6;">
                The user has triggered an emergency signal by blinking 5 times in rapid succession. 
                This may indicate they need immediate assistance or are in a distressing situation.
              </p>
            </div>
          </div>
          
          <div style="background: #dcfce7; padding: 25px; border-radius: 16px; margin-top: 20px; border: 2px solid #22c55e;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">✅ Recommended Actions:</h3>
            <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Contact the user immediately via phone or in person</li>
              <li>Check on their physical wellbeing</li>
              <li>If no response, consider contacting emergency services</li>
              <li>Document the incident for future reference</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated emergency alert from BlinkControl Safety System.<br>
              Do not reply to this email. Take immediate action if required.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 10px;">
              © 2026 BlinkControl - Eye Blink-Based Appliance Control System
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending emergency email:", error);
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
