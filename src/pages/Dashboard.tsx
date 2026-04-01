import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, HandHeart, AlertTriangle, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["assistance_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistance_records")
        .select("*, seniors(first_name, last_name)");
      if (error) throw error;
      return data;
    },
  });

  const totalSeniors = seniors.length;
  const totalAssistance = records.length;
  const highPriority = seniors.filter((s) => s.priority_level === "High").length;
  const pendingAid = records.filter((r) => r.status === "Pending").length;

  const stats = [
    {
      label: "Registered Seniors",
      value: totalSeniors,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      glow: "hsl(231 70% 55% / 0.30)",
      bg: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-indigo-600",
    },
    {
      label: "Total Aid Given",
      value: totalAssistance,
      icon: HandHeart,
      gradient: "from-violet-500 to-purple-600",
      glow: "hsl(262 60% 62% / 0.30)",
      bg: "from-violet-500/10 to-purple-500/10",
      iconColor: "text-violet-600",
    },
    {
      label: "High Priority",
      value: highPriority,
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
      glow: "hsl(0 72% 56% / 0.30)",
      bg: "from-rose-500/10 to-red-500/10",
      iconColor: "text-rose-600",
    },
    {
      label: "Pending Aid",
      value: pendingAid,
      icon: TrendingUp,
      gradient: "from-amber-400 to-orange-500",
      glow: "hsl(38 90% 52% / 0.30)",
      bg: "from-amber-400/10 to-orange-400/10",
      iconColor: "text-amber-600",
    },
  ];

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of senior citizen records and assistance programs
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card group cursor-default"
            style={{ "--card-glow": stat.glow } as React.CSSProperties}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                  {stat.label}
                </p>
                <p
                  className="text-3xl font-bold text-foreground tabular-nums"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.bg} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 4px 16px ${stat.glow}` }}
              >
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            {/* Gradient accent bar */}
            <div className={`mt-4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-40 group-hover:opacity-70 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assistance */}
        <div className="glass-card p-6 hover:shadow-[0_12px_36px_-6px_hsl(231_70%_55%/0.20)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
              Recent Assistance
            </h2>
            <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
              Last {recentRecords.length} records
            </span>
          </div>
          <div className="space-y-1">
            {recentRecords.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No records yet.</p>
            )}
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {record.seniors?.first_name} {record.seniors?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {record.type} · {record.description}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-foreground">₱{Number(record.amount).toLocaleString()}</p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      record.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Seniors */}
        <div className="glass-card p-6 hover:shadow-[0_12px_36px_-6px_hsl(231_70%_55%/0.20)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
              Priority Seniors
            </h2>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              High Priority
            </span>
          </div>
          <div className="space-y-1">
            {seniors.filter((s) => s.priority_level === "High").length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No high priority seniors</p>
            )}
            {seniors
              .filter((s) => s.priority_level === "High")
              .map((senior) => (
                <div
                  key={senior.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/60 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {senior.first_name} {senior.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Age {senior.age} · {senior.income_level} income
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shrink-0 ml-4">
                    Critical
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
