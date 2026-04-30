import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, MessageCircle, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "agent" | "user";
  text: string;
  time: string;
  toolUsed?: string;
}

interface ChatAgentProps {
  context?: string;
}

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TOOL_LABELS: Record<string, string> = {
  get_seniors_by_priority:  "Queried seniors list",
  get_senior_profile:       "Looked up profile",
  update_priority:          "Updated priority in DB",
  get_senior_stats:         "Fetched statistics",
  get_seniors_needing_aid:  "Checked aid records",
};

const QUICK_CHIPS = [
  "Show high priority seniors",
  "Overall statistics",
  "Who needs aid?",
];

const WELCOME =
  `Hello! I'm AGAPO Assistant 🤖\n\n` +
  `I can help you:\n` +
  `• Check senior profiles & priority levels\n` +
  `• Update priorities — e.g. "Set Juan dela Cruz to High priority"\n` +
  `• Get statistics and seniors needing aid\n` +
  `• Recommend government assistance programs\n\n` +
  `What do you need?`;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const ChatAgent = ({ context }: ChatAgentProps) => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: WELCOME, time: getTime() },
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [hasError, setHasError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setHasError(false);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.text !== WELCOME)
        .map((m, idx, arr) => ({
          role: m.role === "agent" ? "assistant" : "user",
          content:
            idx === arr.length - 1 && m.role === "user" && context
              ? `[Currently viewing: ${context}]\n\n${m.text}`
              : m.text,
        }));

      // Get the user's JWT for auth — falls back to publishable key
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? SUPABASE_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Function error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      if (!data?.reply) throw new Error("Empty response from agent.");

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: data.reply,
          time: getTime(),
          toolUsed: data.tool_used,
        },
      ]);
    } catch (err: any) {
      setHasError(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `⚠️ ${err.message ?? "Connection error. Please try again."}`,
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ role: "agent", text: WELCOME, time: getTime() }]);
    setHasError(false);
    setInput("");
  };

  const isFirstMessage = messages.length <= 1;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-primary shrink-0">
            <div className="w-7 h-7 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-foreground leading-none">AGAPO Assistant</p>
              <p className="text-[10px] text-primary-foreground/55 mt-0.5">Groq · Llama 3.3 70B · Tool-enabled</p>
            </div>
            <button onClick={clearChat} className="text-[10px] text-primary-foreground/50 hover:text-primary-foreground transition-colors mr-2 shrink-0">
              Clear
            </button>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors shrink-0">
              <X className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.toolUsed && TOOL_LABELS[msg.toolUsed] && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[9px] text-amber-400/80 font-medium">{TOOL_LABELS[msg.toolUsed]}</span>
                  </div>
                )}
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap break-words ${
                  msg.role === "agent" ? "bg-muted text-foreground rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground px-1">{msg.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error banner */}
          {hasError && (
            <div className="px-3 py-1.5 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2 shrink-0">
              <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
              <p className="text-[10px] text-destructive leading-tight">
                Agent error — check that GROQ_API_KEY secret is set in Supabase.
              </p>
            </div>
          )}

          {/* Quick chips */}
          {isFirstMessage && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_CHIPS.map((chip) => (
                <button key={chip} onClick={() => sendMessage(chip)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border shrink-0">
            <input
              className="flex-1 h-8 rounded-full border border-input bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
              placeholder="Ask or give a command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              autoComplete="off"
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity">
              <Send className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg"
        title="AGAPO Assistant">
        {open ? <X className="w-5 h-5 text-primary-foreground" /> : <MessageCircle className="w-6 h-6 text-primary-foreground" />}
      </button>
    </div>
  );
};

export default ChatAgent;