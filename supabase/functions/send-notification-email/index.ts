import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  type: string;
  message: string;
  subject: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { type, message, subject } = (await req.json()) as NotificationPayload;

    // Map notification type to email preference column
    const emailPrefColumn: Record<string, string> = {
      new_senior: "email_new_senior",
      assistance_added: "email_assistance_added",
      high_priority: "email_high_priority",
      assistance_completed: "email_assistance_completed",
    };

    const prefCol = emailPrefColumn[type];
    if (!prefCol) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users with this email preference enabled
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("user_id")
      .eq(prefCol, true);

    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email addresses for those users
    const userIds = prefs.map((p: any) => p.user_id);
    const emails: string[] = [];

    for (const uid of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (userData?.user?.email) {
        emails.push(userData.user.email);
      }
    }

    if (emails.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send emails via Resend
    let sent = 0;
    for (const email of emails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AGAPO <onboarding@resend.dev>",
          to: [email],
          subject: `AGAPO Alert — ${subject}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <div style="background: #166534; padding: 24px 32px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">AGAPO</h1>
                <p style="margin: 4px 0 0; color: #bbf7d0; font-size: 12px;">Barangay San Francisco, Mainit, Surigao del Norte</p>
              </div>
              <div style="padding: 28px 32px;">
                <h2 style="margin: 0 0 12px; color: #111827; font-size: 16px;">${subject}</h2>
                <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.6;">${message}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">This is an automated notification from the AGAPO Senior Citizen Management System. You can manage your notification preferences in your profile settings.</p>
              </div>
            </div>
          `,
        }),
      });
      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error sending email notification:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
