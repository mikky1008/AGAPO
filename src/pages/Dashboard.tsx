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
      const { data, error } = await supabase.from("assistance_records").select("*, seniors(first_name, last_name)");
      if (error) throw error;
      return data;
    },
  });

  const totalSeniors = seniors.length;
  const totalAssistance = records.length;
  const highPriority = seniors.filter((s) => s.priority_level === "High").length;
  const pendingAid = records.filter((r) => r.status === "Pending").length;

  const stats = [
    { label: "Registered Seniors", value: totalSeniors, icon: Users, gradient: "from-emerald-500 to-teal-600", glow: "hsl(158 64% 38% / 0.30)", bg: "from-emerald-500/12 to-teal-500/12", iconColor: "text-emerald-600" },
    { label: "Total Aid Given", value: totalAssistance, icon: HandHeart, gradient: "from-teal-500 to-cyan-600", glow: "hsl(172 60% 40% / 0.28)", bg: "from-teal-500/12 to-cyan-500/12", iconColor: "text-teal-600" },
    { label: "High Priority", value: highPriority, icon: AlertTriangle, gradient: "from-rose-500 to-red-600", glow: "hsl(0 72% 56% / 0.28)", bg: "from-rose-500/12 to-red-500/12", iconColor: "text-rose-600" },
    { label: "Pending Aid", value: pendingAid, icon: TrendingUp, gradient: "from-amber-400 to-orange-500", glow: "hsl(38 90% 52% / 0.28)", bg: "from-amber-400/12 to-orange-400/12", iconColor: "text-amber-600" },
  ];

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of senior citizen records and assistance programs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card group cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="field-label mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground tabular-nums"
                  style={{ fontFamily: "Sora, sans-serif" }}>{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.bg} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 4px 16px ${stat.glow}` }}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className={`mt-4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-40 group-hover:opacity-70 transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Recent Assistance</h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted/62 px-2.5 py-1 rounded-lg"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Last {recentRecords.length} records</span>
          </div>
          <div className="space-y-1">
            {recentRecords.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>No records yet.</p>}
            {recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/62 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    {record.seniors?.first_name} {record.seniors?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    {record.type} · {record.description}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>₱{Number(record.amount).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${record.status === "Completed" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Priority Seniors</h2>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg uppercase tracking-wider"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>High Priority</span>
          </div>
          <div className="space-y-1">
            {seniors.filter((s) => s.priority_level === "High").length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>No high priority seniors</p>
            )}
            {seniors.filter((s) => s.priority_level === "High").map((senior) => (
              <div key={senior.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/62 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{senior.first_name} {senior.last_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Age {senior.age} · {senior.income_level} income</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shrink-0 ml-4"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Critical</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
