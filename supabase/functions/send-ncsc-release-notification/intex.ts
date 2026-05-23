import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReleasePayload {
  releaseDate: string;       // e.g. "Wednesday, May 21, 2026"
  customMessage: string | null;
  totalEligible: number;
  pendingPayouts: number;
  totalDisbursed: number;
}

// ── HTML Email Template ────────────────────────────────────────────────────
function buildEmailHtml(p: ReleasePayload): string {
  const disbursed = `&#8369;${Number(p.totalDisbursed).toLocaleString("en-PH")}`;
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  const customBlock = p.customMessage
    ? `<tr><td style="padding:0 0 20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0 0 5px;color:#3b82f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Message from Administration</p>
            <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${p.customMessage}</p>
          </td>
        </tr></table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>NCSC/ECA Payout Release</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

  <!-- TOP BANNER -->
  <tr><td style="background:#1e3a5f;padding:32px 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0 0 3px;color:#93c5fd;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Office of Senior Citizens Affairs</p>
        <h1 style="margin:0 0 4px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">AGAPO &mdash; OSCA</h1>
        <p style="margin:0;color:#bfdbfe;font-size:11px;">Barangay San Francisco, Mainit, Surigao del Norte</p>
      </td>
      <td align="right" style="vertical-align:middle;">
        <div style="background:rgba(255,255,255,0.13);border-radius:12px;padding:10px 16px;display:inline-block;text-align:center;">
          <span style="font-size:30px;line-height:1;">&#128226;</span>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- AMBER STRIPE -->
  <tr><td style="background:#f59e0b;padding:9px 40px;">
    <p style="margin:0;color:#1c1917;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
      &#128276;&nbsp; Official NCSC/ECA Payout Release Announcement
    </p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:32px 40px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0">

    <!-- Title -->
    <tr><td style="padding:0 0 6px;">
      <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:800;">NCSC / ECA Payout Release</h2>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">This is an official announcement from the OSCA Administration.</p>
    </td></tr>

    <tr><td style="padding:14px 0;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"/></td></tr>

    <!-- Release Date -->
    <tr><td style="padding:0 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:18px 24px;">
          <p style="margin:0 0 5px;color:#3b82f6;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
            &#128197;&nbsp; Scheduled Payout Release Date
          </p>
          <p style="margin:0;color:#1e3a5f;font-size:22px;font-weight:800;">${p.releaseDate}</p>
        </td>
      </tr></table>
    </td></tr>

    <!-- Stats grid -->
    <tr><td style="padding:0 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="padding-right:6px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;">
                <p style="margin:0 0 3px;color:#0f172a;font-size:22px;font-weight:800;">${p.totalEligible}</p>
                <p style="margin:0;color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;">Eligible Seniors</p>
              </td>
            </tr></table>
          </td>
          <td width="33%" style="padding:0 3px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 10px;text-align:center;">
                <p style="margin:0 0 3px;color:#d97706;font-size:22px;font-weight:800;">${p.pendingPayouts}</p>
                <p style="margin:0;color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;">Pending Milestones</p>
              </td>
            </tr></table>
          </td>
          <td width="33%" style="padding-left:6px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 10px;text-align:center;">
                <p style="margin:0 0 3px;color:#16a34a;font-size:17px;font-weight:800;">${disbursed}</p>
                <p style="margin:0;color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;">Total Disbursed</p>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Custom message -->
    ${customBlock}

    <!-- Milestone schedule -->
    <tr><td style="padding:0 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;">
          <p style="margin:0 0 12px;color:#374151;font-size:13px;font-weight:700;">NCSC Progressive Payout Schedule</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:5px 10px 5px 0;font-size:16px;width:28px;">&#127885;</td>
              <td style="color:#374151;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9;">Age 80 &mdash; &#8369;10,000</td>
            </tr>
            <tr>
              <td style="padding:5px 10px 5px 0;font-size:16px;">&#129352;</td>
              <td style="color:#374151;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9;">Age 85 &mdash; &#8369;10,000</td>
            </tr>
            <tr>
              <td style="padding:5px 10px 5px 0;font-size:16px;">&#129351;</td>
              <td style="color:#374151;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9;">Age 90 &mdash; &#8369;10,000</td>
            </tr>
            <tr>
              <td style="padding:5px 10px 5px 0;font-size:16px;">&#128142;</td>
              <td style="color:#374151;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9;">Age 95 &mdash; &#8369;10,000</td>
            </tr>
            <tr>
              <td style="padding:5px 10px 5px 0;font-size:16px;">&#128081;</td>
              <td style="color:#1e3a5f;font-size:13px;font-weight:700;padding:5px 0;">Age 100 (Centenarian) &mdash; &#8369;100,000</td>
            </tr>
          </table>
        </td>
      </tr></table>
    </td></tr>

    <!-- Closing note -->
    <tr><td style="padding:0 0 28px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.7;">
        Please coordinate with the OSCA office and ensure all required documents are prepared well before the release date.
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
        For questions or concerns, contact the OSCA administration directly.
      </p>
    </td></tr>

  </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0 0 2px;color:#374151;font-size:11px;font-weight:700;">AGAPO Senior Citizen Management System</p>
        <p style="margin:0;color:#94a3b8;font-size:10px;">OSCA &middot; Brgy. San Francisco, Mainit, Surigao del Norte</p>
      </td>
      <td align="right" style="vertical-align:top;">
        <p style="margin:0;color:#cbd5e1;font-size:10px;">${today}</p>
      </td>
    </tr></table>
    <p style="margin:10px 0 0;color:#cbd5e1;font-size:10px;line-height:1.5;">
      This is an automated official notification sent by an AGAPO administrator.
      Only admins can trigger this announcement. Please do not reply to this email.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Raw Gmail SMTP over TLS (port 465) — zero external imports ─────────────
async function sendGmail(
  to: string,
  subject: string,
  html: string,
  gmailUser: string,
  appPassword: string,
): Promise<void> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });

  const read = async (): Promise<string> => {
    const buf = new Uint8Array(8192);
    const n = await conn.read(buf);
    const line = dec.decode(buf.subarray(0, n ?? 0));
    console.log("S:", line.trim());
    return line;
  };

  const write = async (cmd: string) => {
    console.log("C:", cmd.startsWith("AUTH") ? "AUTH LOGIN" : cmd.trim());
    await conn.write(enc.encode(cmd + "\r\n"));
  };

  // Build a minimal RFC 2822 message with base64-encoded HTML body
  const boundary = `----=_AGAPO_${Date.now()}`;
  const b64Html = btoa(unescape(encodeURIComponent(html)));
  const message = [
    `From: "AGAPO OSCA" <${gmailUser}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    // Split base64 into 76-char lines (RFC 2045)
    b64Html.match(/.{1,76}/g)!.join("\r\n"),
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  try {
    await read(); // 220 greeting

    await write(`EHLO agapo.osca`);
    let ehlo = "";
    // Read multi-line EHLO response
    while (true) {
      const line = await read();
      ehlo += line;
      if (/^250 /m.test(line) || line.startsWith("250 ")) break;
    }

    await write(`AUTH LOGIN`);
    await read(); // 334 Username:
    await write(btoa(gmailUser));
    await read(); // 334 Password:
    await write(btoa(appPassword));
    const authResp = await read(); // 235 or error
    if (!authResp.includes("235")) throw new Error("Gmail AUTH failed: " + authResp.trim());

    await write(`MAIL FROM:<${gmailUser}>`);
    await read(); // 250

    await write(`RCPT TO:<${to}>`);
    await read(); // 250

    await write(`DATA`);
    await read(); // 354 start input

    await write(message + "\r\n.");
    const dataResp = await read(); // 250 OK
    if (!dataResp.includes("250")) throw new Error("DATA rejected: " + dataResp.trim());

    await write(`QUIT`);
    await read(); // 221 bye
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

// ── Edge Function entry point ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GMAIL_USER              = "autobitofficial.ph@gmail.com";
    const GMAIL_APP_PASSWORD      = "gejzqdgjqpnrlzzy";

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload = (await req.json()) as ReleasePayload;

    // Fetch all active staff & admin profiles
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, role")
      .eq("is_active", true);

    if (profError) throw new Error("Could not fetch profiles: " + profError.message);

    // Resolve auth emails for each profile
    const emails: string[] = [];
    for (const profile of profiles ?? []) {
      try {
        const { data: ud } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
        if (ud?.user?.email) emails.push(ud.user.email);
      } catch { /* skip */ }
    }

    if (emails.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No active users found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `[AGAPO] NCSC/ECA Payout Release - ${payload.releaseDate}`;
    const html    = buildEmailHtml(payload);

    let sent = 0;
    const failed: string[] = [];

    for (const email of emails) {
      try {
        await sendGmail(email, subject, html, GMAIL_USER, GMAIL_APP_PASSWORD);
        sent++;
      } catch (e) {
        console.error(`Failed → ${email}:`, e);
        failed.push(email);
      }
    }

    // ── Insert in-app notifications for all active staff & admins ──
    const notifMessage = payload.customMessage
      ? `📢 NCSC/ECA payout scheduled for ${payload.releaseDate}. ${payload.customMessage}`
      : `📢 NCSC/ECA payout scheduled for ${payload.releaseDate}.`;

    const notifRows = (profiles ?? []).map((p: any) => ({
      user_id: p.user_id,
      type: "info",
      message: notifMessage,
      read: false,
    }));

    if (notifRows.length > 0) {
      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(notifRows);
      if (notifError) {
        console.error("Failed to insert in-app notifications:", notifError.message);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: emails.length, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("send-ncsc-release-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
