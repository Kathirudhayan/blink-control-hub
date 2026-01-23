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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 12px; margin-top: 20px; border: 2px solid #fecaca;">
            <p style="color: #991b1b; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
              An emergency alert has been triggered!
            </p>
            <p style="color: #7f1d1d; margin: 0 0 10px 0;">
              The Eye Blink-Based Appliance Control System detected 5 consecutive blinks, 
              indicating a possible emergency situation.
            </p>
            <p style="color: #7f1d1d; margin: 0;">
              <strong>Time:</strong> ${time}
            </p>
          </div>
          
          <div style="background: #fefce8; padding: 20px; border-radius: 12px; margin-top: 20px; border: 2px solid #fef08a;">
            <p style="color: #854d0e; margin: 0; font-weight: bold;">
              ⚠️ Please respond immediately to check on the user.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
            This is an automated message from BlinkControl Emergency System
          </p>
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
