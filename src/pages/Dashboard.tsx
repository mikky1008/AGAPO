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
    { label: "Registered Seniors", value: totalSeniors, icon: Users, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-l-primary" },
    { label: "Total Aid Given", value: totalAssistance, icon: HandHeart, color: "text-secondary", bgColor: "bg-secondary/10", borderColor: "border-l-secondary" },
    { label: "High Priority", value: highPriority, icon: AlertTriangle, color: "text-priority-high", bgColor: "bg-destructive/10", borderColor: "border-l-destructive" },
    { label: "Pending Aid", value: pendingAid, icon: TrendingUp, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-l-warning" },
  ];

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of senior citizen records and assistance</p>
      </div>

      {/* Elevated stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-card rounded-xl border-l-4 ${stat.borderColor} p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-sm`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Elevated bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-serif text-foreground mb-4">Recent Assistance</h2>
          <div className="space-y-3">
            {recentRecords.length === 0 && <p className="text-sm text-muted-foreground">No records yet.</p>}
            {recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {record.seniors?.first_name} {record.seniors?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{record.type} - {record.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">₱{Number(record.amount).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${record.status === "Completed" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-serif text-foreground mb-4">Priority Seniors</h2>
          <div className="space-y-3">
            {seniors.filter((s) => s.priority_level === "High").length === 0 && (
              <p className="text-sm text-muted-foreground">No high priority seniors</p>
            )}
            {seniors.filter((s) => s.priority_level === "High").map((senior) => (
              <div key={senior.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{senior.first_name} {senior.last_name}</p>
                  <p className="text-xs text-muted-foreground">Age {senior.age} • {senior.income_level} income</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-priority-high font-medium">High Priority</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
