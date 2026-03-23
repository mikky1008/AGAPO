import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, MessageCircle } from "lucide-react";

interface Message {
  role: "agent" | "user";
  text: string;
  time: string;
}

interface ChatAgentProps {
  context?: string;
}

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const SYSTEM_PROMPT = `You are a helpful AI agent for AGAPO, a Senior Citizen Management System for Barangay San Francisco, Mainit, Surigao del Norte, Philippines.
You assist barangay health workers by:
- Assessing health priority levels based on a senior's conditions
- Recommending government assistance programs (OSCA, PhilHealth, 4Ps, DSWD, etc.)
- Answering questions about senior citizen benefits and services
- Giving advice on care plans for specific illnesses
Keep responses concise and practical. Use Filipino context where relevant.`;

const ChatAgent = ({ context }: ChatAgentProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "Hello! I can help assess health priority, recommend assistance programs, or answer questions about senior care.",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const systemWithContext = context
        ? `${SYSTEM_PROMPT}\n\nCurrent senior context: ${context}`
        : SYSTEM_PROMPT;

      const history = [...messages, userMsg].map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemWithContext,
          messages: history,
        }),
      });

      const data = await res.json();
      const reply =
        data.content?.find((b: any) => b.type === "text")?.text ??
        "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "agent", text: reply, time: getTime() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Connection error. Please try again.", time: getTime() },
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

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-80 bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: "420px" }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary shrink-0">
            <Bot className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground flex-1">AI Agent</span>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    msg.role === "agent"
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border shrink-0">
            <input
              className="flex-1 h-8 rounded-full border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              placeholder="Ask the agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
      >
        {open ? (
          <X className="w-5 h-5 text-primary-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        )}
      </button>
    </div>
  );
};

export default ChatAgent;
