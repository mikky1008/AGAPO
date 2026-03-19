import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { computePriority, calculateAge, PriorityResult } from "@/lib/priorityScoring";
import { Progress } from "@/components/ui/progress";

const Priority = () => {
  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("*");
      if (error) throw error;
      return data;
    },
  });

  const analyses = seniors
    .map((s: any) => ({ ...computePriority(s), senior: s, age: calculateAge(s.birth_date) }))
    .sort((a, b) => b.score - a.score);

  const counts = { High: 0, Medium: 0, Low: 0 };
  analyses.forEach((a) => counts[a.level]++);

  const priorityIcon = (level: string) => {
    switch (level) {
      case "High": return <AlertTriangle className="w-4 h-4 text-priority-high" />;
      case "Medium": return <Clock className="w-4 h-4 text-warning" />;
      default: return <CheckCircle className="w-4 h-4 text-primary" />;
    }
  };

  const priorityBorder = (level: string) => {
    switch (level) {
      case "High": return "border-l-4 border-l-priority-high";
      case "Medium": return "border-l-4 border-l-warning";
      default: return "border-l-4 border-l-primary";
    }
  };

  const badgeStyle = (level: string) => {
    switch (level) {
      case "High": return "bg-destructive/10 text-priority-high";
      case "Medium": return "bg-warning/10 text-warning";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-foreground">Priority Assessment</h1>
          <p className="text-muted-foreground text-sm">
            Automated prioritization based on income, living status, age, and illness history
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["High", "Medium", "Low"] as const).map((level) => (
          <div key={level} className="stat-card flex items-center gap-3">
            {priorityIcon(level)}
            <div>
              <p className="text-2xl font-bold text-foreground">{counts[level]}</p>
              <p className="text-xs text-muted-foreground">{level} Priority</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scoring guide */}
      <div className="bg-card rounded-xl border border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Scoring Criteria</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div><span className="font-medium text-foreground">Income:</span> Above Avg (1) · Avg (2) · Below Avg (3) · Low (4)</div>
          <div><span className="font-medium text-foreground">Living:</span> With Family/Caregiver (1) · Alone (2)</div>
          <div><span className="font-medium text-foreground">Age:</span> 60-69 (1) · 70-79 (2) · 80+ (3)</div>
          <div><span className="font-medium text-foreground">Illnesses:</span> None (0) · 1 (2) · 2 (4) · 3+ (6)</div>
          <div><span className="font-medium text-foreground">Total:</span> ≥10 High · 6-9 Medium · ≤5 Low</div>
          <div><span className="font-medium text-foreground">Health Status:</span> To be assessed by AI Agent</div>
        </div>
      </div>

      {/* Senior list */}
      <div className="space-y-3">
        {analyses.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No seniors registered yet.</p>
        )}
        {analyses.map((a) => (
          <div key={a.senior.id} className={`stat-card ${priorityBorder(a.level)}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {priorityIcon(a.level)}
                <div>
                  <h3 className="font-semibold text-foreground">
                    {a.senior.first_name} {a.senior.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Age {a.age} · {a.senior.illnesses?.length || 0} illness(es) · {a.senior.income_level} income · {a.senior.living_status}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${badgeStyle(a.level)}`}>
                {a.level} Priority — Score: {a.score}/15
              </span>
            </div>

            {/* Factor breakdown */}
            <div className="mt-3 space-y-1.5">
              {a.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-32 shrink-0">{f.label}</span>
                  <Progress value={(f.risk / f.maxRisk) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8 text-right">{f.risk}/{f.maxRisk}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Priority;
