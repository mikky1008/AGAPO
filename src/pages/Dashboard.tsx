import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, HandHeart, Trophy, TrendingUp } from "lucide-react";
import { calculateAge } from "@/lib/priorityScoring";

const NCSC_MILESTONES = [80, 85, 90, 95, 100];

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
  const { data: payouts = [] } = useQuery({
    queryKey: ["ncsc_payouts"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("ncsc_payouts").select("*");
      if (error) throw error;
      return (data ?? []) as { senior_id: string; milestone_age: number; amount: number }[];
    },
  });

  const totalSeniors = seniors.length;
  const totalAssistance = records.length;

  // NCSC eligible (age 80+) with pending milestones
  const ncscEligible = seniors
    .map((s: any) => ({ ...s, currentAge: calculateAge(s.birth_date) }))
    .filter((s: any) => s.currentAge >= 80);

  const pendingNcscPayouts = ncscEligible.reduce((count, senior: any) => {
    NCSC_MILESTONES.forEach((m) => {
      if (senior.currentAge >= m) {
        const paid = payouts.some((p) => p.senior_id === senior.id && p.milestone_age === m);
        if (!paid) count++;
      }
    });
    return count;
  }, 0);

  const pendingAid = records.filter((r: any) => r.status === "Pending").length;

  const stats = [
    { label: "Registered Seniors", value: totalSeniors, icon: Users, gradient: "from-red-500 to-rose-600", glow: "hsl(6 65% 42% / 0.30)", bg: "from-red-500/12 to-rose-500/12", iconColor: "text-red-600" },
    { label: "Total Aid Given", value: totalAssistance, icon: HandHeart, gradient: "from-rose-500 to-red-700", glow: "hsl(6 65% 42% / 0.28)", bg: "from-rose-500/12 to-red-600/12", iconColor: "text-rose-600" },
    { label: "NCSC Eligible (80+)", value: ncscEligible.length, icon: Trophy, gradient: "from-amber-400 to-yellow-500", glow: "hsl(38 90% 52% / 0.28)", bg: "from-amber-400/12 to-yellow-400/12", iconColor: "text-amber-500" },
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
        {/* Recent Assistance */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Recent Assistance</h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted/62 px-2.5 py-1 rounded-lg"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Last {recentRecords.length} records</span>
          </div>
          <div className="space-y-1">
            {recentRecords.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>No records yet.</p>}
            {recentRecords.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/60 transition-colors">
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${record.status === "Completed" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NCSC Pending Payouts panel */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>NCSC Pending Payouts</h2>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg uppercase tracking-wider"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{pendingNcscPayouts} Pending</span>
          </div>
          <div className="space-y-1">
            {ncscEligible.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>No eligible seniors (80+) registered.</p>
            )}
            {ncscEligible.slice(0, 5).map((senior: any) => {
              const seniorPending = [80, 85, 90, 95, 100].filter(
                (m) => senior.currentAge >= m && !payouts.some((p) => p.senior_id === senior.id && p.milestone_age === m)
              );
              if (seniorPending.length === 0) return null;
              return (
                <div key={senior.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/60 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{senior.first_name} {senior.last_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      Age {senior.currentAge} · {senior.currentAge >= 100 ? "👑 Centenarian" : "NCSC eligible"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-4 flex-wrap justify-end">
                    {seniorPending.map((m) => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;