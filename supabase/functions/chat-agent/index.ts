import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tool definitions — Groq picks which to call based on the user's message ───
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_seniors_by_priority",
      description:
        "Get a list of senior citizens filtered by priority level (High, Medium, Low) or all seniors. Use when the user asks about seniors by priority or wants an overview.",
      parameters: {
        type: "object",
        properties: {
          priority_level: {
            type: "string",
            enum: ["High", "Medium", "Low", "All"],
            description: "Priority level to filter by. Use 'All' to get everyone.",
          },
        },
        required: ["priority_level"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_senior_profile",
      description:
        "Get the full profile of a specific senior citizen by name. Use when the user mentions a specific person's name.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name or partial name of the senior to search for.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_priority",
      description:
        "Update the priority level of a specific senior citizen. Use ONLY when the user explicitly asks to change, set, or update someone's priority level.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Full or partial name of the senior to update.",
          },
          priority_level: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description: "The new priority level to assign.",
          },
          reasoning: {
            type: "string",
            description: "Brief reason for the priority change, stored in the audit log.",
          },
        },
        required: ["name", "priority_level", "reasoning"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_senior_stats",
      description:
        "Get summary statistics — total seniors, priority breakdown, living situation, average age, aid status. Use when the user asks for counts, summaries, or an overview.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_seniors_needing_aid",
      description:
        "Get seniors who have not received assistance recently. Use when the user asks who needs aid or hasn't been helped lately.",
      parameters: {
        type: "object",
        properties: {
          days_without_aid: {
            type: "number",
            description:
              "Number of days threshold. Returns seniors with no aid within this period. Defaults to 30.",
          },
        },
        required: [],
      },
    },
  },
];

// ── Tool execution — runs the real Supabase queries ────────────────────────────
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  callerUserId: string
): Promise<string> {
  try {
    switch (toolName) {

      // 1. Get seniors by priority
      case "get_seniors_by_priority": {
        let query = supabase
          .from("seniors")
          .select("first_name, last_name, age, priority_level, illnesses, living_status, income_level, last_aid_date")
          .is("deleted_at", null)
          .order("priority_level", { ascending: true })
          .limit(30);

        if (args.priority_level !== "All") {
          query = query.eq("priority_level", args.priority_level);
        }

        const { data, error } = await query;
        if (error) return `Error fetching seniors: ${error.message}`;
        if (!data?.length) return `No seniors found with priority: ${args.priority_level}.`;

        const list = data
          .map(
            (s: any) =>
              `• ${s.first_name} ${s.last_name} (Age ${s.age ?? "?"}) | ` +
              `Priority: ${s.priority_level ?? "Unset"} | ` +
              `Living: ${s.living_status} | Income: ${s.income_level} | ` +
              `Illnesses: ${s.illnesses?.join(", ") || "None"} | ` +
              `Last Aid: ${s.last_aid_date ?? "Never"}`
          )
          .join("\n");

        return `Found ${data.length} senior(s) — ${args.priority_level} priority:\n${list}`;
      }

      // 2. Get senior profile
      case "get_senior_profile": {
        const parts = args.name.trim().split(" ");
        let query = supabase.from("seniors").select("*").is("deleted_at", null);

        if (parts.length >= 2) {
          query = query.or(
            `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`
          );
        } else {
          query = query.or(
            `first_name.ilike.%${args.name}%,last_name.ilike.%${args.name}%`
          );
        }

        const { data, error } = await query.limit(3);
        if (error) return `Error searching: ${error.message}`;
        if (!data?.length) return `No senior found matching "${args.name}".`;

        return data
          .map(
            (s: any) =>
              `Name: ${s.first_name} ${s.last_name}\n` +
              `Age: ${s.age} | Gender: ${s.gender} | Birth: ${s.birth_date}\n` +
              `Address: ${s.address}\n` +
              `Contact: ${s.contact_number ?? "None"} | Emergency: ${s.emergency_contact ?? "None"}\n` +
              `Priority: ${s.priority_level ?? "Unset"} | Score: ${s.priority_score ?? "N/A"}\n` +
              `Health Status: ${s.health_status}\n` +
              `Illnesses: ${s.illnesses?.join(", ") || "None"} | Severity: ${s.illness_severity ?? "None"}\n` +
              `Living: ${s.living_status} | Income: ${s.income_level}\n` +
              `Last Aid: ${s.last_aid_date ?? "Never"}\n` +
              `Agent Reasoning: ${s.agent_reasoning ?? "None"}`
          )
          .join("\n---\n");
      }

      // 3. Update priority
      case "update_priority": {
        const parts = args.name.trim().split(" ");
        let searchQ = supabase
          .from("seniors")
          .select("id, first_name, last_name, priority_level")
          .is("deleted_at", null);

        if (parts.length >= 2) {
          searchQ = searchQ.or(
            `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`
          );
        } else {
          searchQ = searchQ.or(
            `first_name.ilike.%${args.name}%,last_name.ilike.%${args.name}%`
          );
        }

        const { data: seniors, error: se } = await searchQ.limit(2);
        if (se) return `Error finding senior: ${se.message}`;
        if (!seniors?.length)
          return `No senior found matching "${args.name}". Please check the name and try again.`;
        if (seniors.length > 1)
          return (
            `Multiple seniors match "${args.name}": ` +
            seniors.map((s: any) => `${s.first_name} ${s.last_name}`).join(", ") +
            ". Please be more specific."
          );

        const senior = seniors[0];
        const oldPriority = senior.priority_level ?? "Unset";
        const score =
          args.priority_level === "High" ? 12 :
          args.priority_level === "Medium" ? 7 : 3;

        // Update the senior record directly
        const { error: ue } = await supabase
          .from("seniors")
          .update({
            priority_level: args.priority_level,
            priority_score: score,
            agent_reasoning: args.reasoning,
            priority_updated_at: new Date().toISOString(),
          })
          .eq("id", senior.id);

        if (ue) return `Error updating priority: ${ue.message}`;

        // Log to ai_agent_logs — using exact column names from migration
        const { error: le } = await supabase.from("ai_agent_logs").insert({
          senior_id: senior.id,
          action: "UPDATE_PRIORITY",
          old_priority: oldPriority,
          new_priority: args.priority_level,
          score,
          reasoning: args.reasoning,
          triggered_by: `ai_agent:${callerUserId}`,
        });

        if (le) console.error("Log insert error:", le.message);

        return (
          `✅ Updated ${senior.first_name} ${senior.last_name}'s priority ` +
          `from ${oldPriority} → ${args.priority_level}.\n` +
          `Reason logged: ${args.reasoning}`
        );
      }

      // 4. Get stats
      case "get_senior_stats": {
        const { data, error } = await supabase
          .from("seniors")
          .select("priority_level, income_level, living_status, last_aid_date, gender, age")
          .is("deleted_at", null);

        if (error) return `Error fetching stats: ${error.message}`;
        if (!data) return "No data available.";

        const total = data.length;
        const high   = data.filter((s: any) => s.priority_level === "High").length;
        const medium = data.filter((s: any) => s.priority_level === "Medium").length;
        const low    = data.filter((s: any) => s.priority_level === "Low").length;
        const unset  = total - high - medium - low;
        const neverAid    = data.filter((s: any) => !s.last_aid_date).length;
        const livingAlone = data.filter((s: any) => s.living_status === "Living Alone").length;
        const avgAge = total > 0
          ? Math.round(data.reduce((sum: number, s: any) => sum + (s.age ?? 0), 0) / total)
          : 0;
        const above80 = data.filter((s: any) => (s.age ?? 0) >= 80).length;
        const female  = data.filter((s: any) => s.gender === "Female").length;
        const male    = data.filter((s: any) => s.gender === "Male").length;

        return (
          `📊 Barangay San Francisco — Senior Citizen Stats\n` +
          `Total Seniors: ${total}\n` +
          `Priority: High=${high}, Medium=${medium}, Low=${low}, Unset=${unset}\n` +
          `Never Received Aid: ${neverAid}\n` +
          `Living Alone: ${livingAlone}\n` +
          `Gender: Male=${male}, Female=${female}\n` +
          `Average Age: ${avgAge} yrs | Age 80+: ${above80}`
        );
      }

      // 5. Get seniors needing aid
      case "get_seniors_needing_aid": {
        const days = args.days_without_aid ?? 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("seniors")
          .select("first_name, last_name, age, priority_level, last_aid_date, living_status")
          .is("deleted_at", null)
          .or(`last_aid_date.is.null,last_aid_date.lte.${cutoffStr}`)
          .order("priority_level", { ascending: true })
          .limit(25);

        if (error) return `Error: ${error.message}`;
        if (!data?.length)
          return `All seniors have received aid within the last ${days} days. ✅`;

        const list = data
          .map(
            (s: any) =>
              `• ${s.first_name} ${s.last_name} (Age ${s.age ?? "?"}, ${s.priority_level ?? "Unset"} priority) — ` +
              `Last Aid: ${s.last_aid_date ?? "Never"}`
          )
          .join("\n");

        return `${data.length} senior(s) with no aid in ${days}+ days:\n${list}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (err: any) {
    return `Tool execution error: ${err.message}`;
  }
}

// ── Main request handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role so we can read/write any row
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Identify the calling user from their JWT
    const authHeader = req.headers.get("Authorization");
    let callerUserId = "unknown";
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) callerUserId = user.id;
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY secret is not configured in Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SYSTEM_PROMPT = `You are AGAPO Assistant, the AI agent for the Senior Citizen Management System of Barangay San Francisco, Mainit, Surigao del Norte, Philippines.

You help barangay health workers and administrators by:
- Fetching real-time senior citizen data from the system
- Updating priority levels when explicitly instructed by staff
- Recommending government assistance programs (OSCA, PhilHealth, 4Ps, DSWD, PCSO, Social Pension for Indigent Senior Citizens)
- Advising on care plans for common illnesses: hypertension, diabetes, arthritis, COPD, dementia, osteoporosis
- Identifying seniors who urgently need attention or aid

Rules:
- Always use the available tools to answer data-related questions — never guess or fabricate data
- Only call update_priority when the user explicitly asks to change a priority level
- When updating priority, always provide a meaningful reasoning for the audit log
- Keep responses concise and actionable — bullet points are fine
- Use respectful Filipino context where relevant
- If you cannot find a senior by name, say so clearly and ask for clarification
- All your actions are logged and visible to the admin in the AI Agent Logs page`;

    // ── Round 1: Send to Groq with tool definitions ────────────────────────────
    const r1 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools: TOOLS,
        tool_choice: "auto",
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!r1.ok) {
      const errText = await r1.text();
      return new Response(
        JSON.stringify({ error: `Groq API error: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const d1 = await r1.json();
    const assistantMsg = d1.choices?.[0]?.message;

    if (!assistantMsg) {
      return new Response(
        JSON.stringify({ error: "No response received from Groq." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Tool calls detected — execute them then get final reply ───────────────
    if (assistantMsg.tool_calls?.length > 0) {
      const toolResults = [];
      const toolsUsed: string[] = [];

      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(tc.function.name, args, supabase, callerUserId);
        toolsUsed.push(tc.function.name);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: result });
      }

      // ── Round 2: Send tool results back for the final human-readable reply ──
      const r2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
            assistantMsg,
            ...toolResults,
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      const d2 = await r2.json();
      const finalReply =
        d2.choices?.[0]?.message?.content ?? "Sorry, I could not complete that request.";

      return new Response(
        JSON.stringify({ reply: finalReply, tool_used: toolsUsed[0] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── No tool call — plain text response ────────────────────────────────────
    return new Response(
      JSON.stringify({ reply: assistantMsg.content ?? "Sorry, no response received." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});