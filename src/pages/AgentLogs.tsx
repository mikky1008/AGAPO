import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Bot, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

const levelColor = (level: string | null) => {
  if (level === "High") return "bg-red-500/15 text-red-400 border border-red-500/30";
  if (level === "Medium") return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  if (level === "Low") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  return "bg-muted text-muted-foreground border border-border";
};

const ChangeIcon = ({ from, to }: { from: string | null; to: string | null }) => {
  const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const a = order[from ?? ""] ?? 0;
  const b = order[to ?? ""] ?? 0;
  if (b > a) return <TrendingUp className="w-3.5 h-3.5 text-destructive" />;
  if (b < a) return <TrendingDown className="w-3.5 h-3.5 text-primary" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

const AgentLogs = () => {
  // ── ALL hooks before any conditional return ───────────────
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["ai_agent_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_logs")
        .select("*, seniors(first_name, last_name)")
        .order("triggered_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  const { data: systemLogs = [], isLoading: sysLoading } = useQuery({
    queryKey: ["system_logs_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  // ── Conditional returns AFTER all hooks ───────────────────
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Checking permissions…</p>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const actionBadge = (action: string) => {
    if (action === "INSERT") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    if (action === "UPDATE") return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    if (action === "DELETE") return "bg-red-500/15 text-red-400 border border-red-500/30";
    return "bg-muted text-muted-foreground border border-border";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="page-title">AI Agent Logs</h1>
          <p className="page-subtitle">Audit trail of AI priority decisions and system activity</p>
        </div>
      </div>

      {/* AI Priority Decisions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider" style={{ fontFamily: "Sora, sans-serif" }}>
          AI Priority Decisions
        </h2>

        {isLoading && <p className="text-sm text-muted-foreground py-4">Loading…</p>}

        {!isLoading && logs.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No AI agent decisions recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Decisions will appear here once N8N triggers a priority assessment.</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="glass-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Senior</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Change</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Score</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Reasoning</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Triggered by</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium text-foreground">
                        {log.seniors?.first_name} {log.seniors?.last_name}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${levelColor(log.old_priority)}`}>
                            {log.old_priority ?? "—"}
                          </span>
                          <ChangeIcon from={log.old_priority} to={log.new_priority} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${levelColor(log.new_priority)}`}>
                            {log.new_priority ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground tabular-nums">{log.score ?? "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate" title={log.reasoning ?? ""}>
                        {log.reasoning ?? "—"}
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {log.triggered_by ?? "ai_agent"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          {new Date(log.triggered_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* System Audit Log */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider" style={{ fontFamily: "Sora, sans-serif" }}>
          System Audit Log
        </h2>

        {sysLoading && <p className="text-sm text-muted-foreground py-4">Loading…</p>}

        {!sysLoading && systemLogs.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No system activity recorded yet.</p>
          </div>
        )}

        {systemLogs.length > 0 && (
          <div className="glass-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Action</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Table</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Record ID</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">When</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground font-mono">{log.table_name}</td>
                      <td className="p-3 text-xs text-muted-foreground font-mono hidden sm:table-cell truncate max-w-[160px]">
                        {log.record_id ?? "—"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          {new Date(log.logged_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLogs;