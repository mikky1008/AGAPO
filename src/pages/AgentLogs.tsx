import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Bot, Clock } from "lucide-react";

const AgentLogs = () => {
  // ── ALL hooks before any conditional return ───────────────
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data: systemLogs = [], isLoading: sysLoading } = useQuery({
    queryKey: ["system_logs_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*, profiles!system_logs_performed_by_fkey(full_name, role)")
        .order("logged_at", { ascending: false })
        .limit(100);

      if (!error) return data ?? [];

      // Fallback: if the FK join fails, fetch logs and profiles separately
      // and match performed_by to profiles.user_id manually.
      const { data: rawLogs, error: rawError } = await supabase
        .from("system_logs")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(100);
      if (rawError) throw rawError;

      const performerIds = Array.from(
        new Set((rawLogs ?? []).map((log) => log.performed_by).filter(Boolean))
      ) as string[];

      let profilesById: Record<string, { full_name: string | null; role: string | null }> = {};
      if (performerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, role")
          .in("user_id", performerIds);
        profilesById = Object.fromEntries(
          (profilesData ?? []).map((p) => [p.user_id, { full_name: p.full_name, role: p.role }])
        );
      }

      return (rawLogs ?? []).map((log) => ({
        ...log,
        profiles: log.performed_by ? profilesById[log.performed_by] ?? null : null,
      }));
    },
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
    if (action === "INSERT") return "bg-red-500/15 text-red-400 border border-red-500/30";
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
          <h1 className="page-title">Logs</h1>
          <p className="page-subtitle">Audit trail of system activity</p>
        </div>
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
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Performed By</th>
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
                      <td className="p-3">
                        {log.profiles ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground font-medium leading-tight">
                              {log.profiles.full_name ?? "Unknown"}
                            </span>
                            {log.profiles.role && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full w-fit capitalize
                                bg-primary/10 text-primary border border-primary/20">
                                {log.profiles.role}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {log.performed_by ? "Unknown user" : "System"}
                          </span>
                        )}
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
