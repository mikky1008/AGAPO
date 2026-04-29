// supabase/functions/n8n-ai-webhook/index.ts
// ============================================================
// AGAPO — N8N AI Agent Webhook Edge Function
// Deploy: supabase functions deploy n8n-ai-webhook
//
// N8N calls this endpoint after AI scoring completes.
// It validates the shared secret, then calls the apply_ai_priority RPC.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("N8N_WEBHOOK_SECRET") ?? "";

interface AIPriorityPayload {
  senior_id: string;
  score: number;
  level: "High" | "Medium" | "Low";
  reasoning: string;
  triggered_by?: string;
}

Deno.serve(async (req: Request) => {
  // ── CORS pre-flight ──────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-webhook-secret",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Authenticate N8N call via shared secret header ───────
  const incomingSecret = req.headers.get("x-webhook-secret") ?? "";
  if (!WEBHOOK_SECRET || incomingSecret !== WEBHOOK_SECRET) {
    console.error("Webhook secret mismatch");
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Parse payload ────────────────────────────────────────
  let payload: AIPriorityPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { senior_id, score, level, reasoning, triggered_by } = payload;

  if (!senior_id || score === undefined || !level || !reasoning) {
    return json({ error: "Missing required fields: senior_id, score, level, reasoning" }, 400);
  }

  if (!["High", "Medium", "Low"].includes(level)) {
    return json({ error: "level must be High, Medium, or Low" }, 400);
  }

  // ── Call Supabase RPC using service role (bypasses RLS) ──
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { error } = await supabase.rpc("apply_ai_priority", {
    _senior_id:    senior_id,
    _score:        score,
    _level:        level,
    _reasoning:    reasoning,
    _triggered_by: triggered_by ?? "n8n_agent",
  });

  if (error) {
    console.error("RPC error:", error);
    return json({ error: error.message }, 500);
  }

  return json({ success: true, senior_id, level, score });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}