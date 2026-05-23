import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trophy, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateAge } from "@/lib/priorityScoring";

const NCSC_MILESTONES = [80, 85, 90, 95, 100];
const MILESTONE_AMOUNTS: Record<number, number> = { 80: 10000, 85: 10000, 90: 10000, 95: 10000, 100: 100000 };

const Reports = () => {
  const { toast } = useToast();

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
      return (data ?? []) as { senior_id: string; milestone_age: number; amount: number; date_given: string; given_by: string }[];
    },
  });

  const downloadCSV = (type: "seniors" | "assistance" | "ncsc") => {
    let csv = "";
    if (type === "seniors") {
      csv = "Name,Age,Gender,Address,Income Level,Living Status\n";
      seniors.forEach((s: any) => {
        const age = calculateAge(s.birth_date);
        csv += `"${s.first_name} ${s.last_name}",${age},${s.gender},"${s.address}",${s.income_level || "Low"},${s.living_status || "N/A"}\n`;
      });
    } else if (type === "assistance") {
      csv = "Senior,Type,Description,Amount,Date,Status,Given By\n";
      records.forEach((r: any) => {
        csv += `"${r.seniors?.first_name} ${r.seniors?.last_name}",${r.type},"${r.description}",${r.amount},${r.date_given},${r.status},"${r.given_by}"\n`;
      });
    } else if (type === "ncsc") {
      csv = "Name,Age,Milestone Age,Amount,Date Given,Given By,Status\n";
      const eligible = seniors
        .map((s: any) => ({ ...s, currentAge: calculateAge(s.birth_date) }))
        .filter((s: any) => s.currentAge >= 80);
      eligible.forEach((s: any) => {
        NCSC_MILESTONES.filter((m) => s.currentAge >= m).forEach((m) => {
          const payout = payouts.find((p) => p.senior_id === s.id && p.milestone_age === m);
          csv += `"${s.first_name} ${s.last_name}",${s.currentAge},${m},${MILESTONE_AMOUNTS[m]},${payout?.date_given || ""},${payout?.given_by || ""},${payout ? "Paid" : "Pending"}\n`;
        });
      });
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldenreg_${type}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: `${type} report saved as CSV.` });
  };

  const downloadPDF = (type: "seniors" | "assistance" | "ncsc") => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    doc.setFontSize(16);
    doc.text("GoldenReg - Municipality of Mainit", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${today}`, 14, 22);

    if (type === "seniors") {
      doc.setFontSize(13);
      doc.text("Senior Citizens Report", 14, 32);
      autoTable(doc, {
        startY: 38,
        head: [["Name", "Age", "Gender", "Address", "Income", "Living"]],
        body: seniors.map((s: any) => [
          `${s.first_name} ${s.last_name}`,
          calculateAge(s.birth_date),
          s.gender,
          s.address,
          s.income_level || "Low",
          s.living_status || "N/A",
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [139, 26, 16] },
      });
    } else if (type === "assistance") {
      doc.setFontSize(13);
      doc.text("Assistance Records Report", 14, 32);
      autoTable(doc, {
        startY: 38,
        head: [["Senior", "Type", "Description", "Amount", "Date", "Status", "Given By"]],
        body: records.map((r: any) => [
          `${r.seniors?.first_name} ${r.seniors?.last_name}`,
          r.type, r.description,
          `₱${Number(r.amount).toLocaleString()}`,
          r.date_given, r.status, r.given_by,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [139, 26, 16] },
      });
    } else if (type === "ncsc") {
      doc.setFontSize(13);
      doc.text("NCSC / ECA Progressive Payout Report", 14, 32);
      const eligible = seniors
        .map((s: any) => ({ ...s, currentAge: calculateAge(s.birth_date) }))
        .filter((s: any) => s.currentAge >= 80);
      const rows: any[] = [];
      eligible.forEach((s: any) => {
        NCSC_MILESTONES.filter((m) => s.currentAge >= m).forEach((m) => {
          const payout = payouts.find((p) => p.senior_id === s.id && p.milestone_age === m);
          rows.push([
            `${s.first_name} ${s.last_name}`,
            s.currentAge,
            m === 100 ? "100 (Centenarian)" : `${m}`,
            `₱${MILESTONE_AMOUNTS[m].toLocaleString()}`,
            payout?.date_given || "—",
            payout?.given_by || "—",
            payout ? "Paid" : "Pending",
          ]);
        });
      });
      autoTable(doc, {
        startY: 38,
        head: [["Name", "Age", "Milestone", "Amount", "Date Given", "Given By", "Status"]],
        body: rows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [139, 26, 16] },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 6) {
            data.cell.styles.textColor = data.cell.raw === "Paid" ? [22, 163, 74] : [202, 138, 4];
          }
        },
      });
    }

    doc.save(`goldenreg_${type}_report.pdf`);
    toast({ title: "Report Downloaded", description: `${type} report saved as PDF.` });
  };

  const totalAid = records.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
  const byType = records.reduce((acc: Record<string, number>, r: any) => {
    acc[r.type] = (acc[r.type] || 0) + Number(r.amount);
    return acc;
  }, {} as Record<string, number>);

  const ncscEligible = seniors
    .map((s: any) => ({ ...s, currentAge: calculateAge(s.birth_date) }))
    .filter((s: any) => s.currentAge >= 80);
  const totalNcscPaid = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalNcscPending = ncscEligible.reduce((count, s: any) => {
    NCSC_MILESTONES.forEach((m) => {
      if (s.currentAge >= m && !payouts.some((p) => p.senior_id === s.id && p.milestone_age === m)) count++;
    });
    return count;
  }, 0);

  const DownloadDropdown = ({ type, label }: { type: "seniors" | "assistance" | "ncsc"; label?: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" /> {label || "Download Report"} <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => downloadCSV(type)}>
          <FileText className="w-4 h-4 mr-2" /> Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadPDF(type)}>
          <FileText className="w-4 h-4 mr-2" /> Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and download reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Senior Citizens Report */}
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Senior Citizens Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Total Registered: <span className="font-semibold text-foreground">{seniors.length}</span></p>
            <p className="text-muted-foreground">Male: <span className="font-semibold text-foreground">{seniors.filter((s: any) => s.gender === "Male").length}</span></p>
            <p className="text-muted-foreground">Female: <span className="font-semibold text-foreground">{seniors.filter((s: any) => s.gender === "Female").length}</span></p>
            <p className="text-muted-foreground">Living Alone: <span className="font-semibold text-foreground">{seniors.filter((s: any) => s.living_status === "Living Alone" || s.living_alone).length}</span></p>
          </div>
          <DownloadDropdown type="seniors" />
        </div>

        {/* Assistance Report */}
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-secondary" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Assistance Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Total Records: <span className="font-semibold text-foreground">{records.length}</span></p>
            <p className="text-muted-foreground">Total Amount: <span className="font-semibold text-foreground">₱{totalAid.toLocaleString()}</span></p>
            {Object.entries(byType).map(([type, amount]) => (
              <p key={type} className="text-muted-foreground">{type}: <span className="font-semibold text-foreground">₱{(amount as number).toLocaleString()}</span></p>
            ))}
          </div>
          <DownloadDropdown type="assistance" />
        </div>

        {/* NCSC / ECA Report */}
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>NCSC / ECA Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Eligible (80+): <span className="font-semibold text-foreground">{ncscEligible.length}</span></p>
            <p className="text-muted-foreground">Centenarians (100): <span className="font-semibold text-foreground">{ncscEligible.filter((s: any) => s.currentAge >= 100).length}</span></p>
            <p className="text-muted-foreground">Total Disbursed: <span className="font-semibold text-foreground">₱{totalNcscPaid.toLocaleString()}</span></p>
            <p className="text-muted-foreground">Pending Milestones: <span className="font-semibold text-amber-400">{totalNcscPending}</span></p>
          </div>
          <DownloadDropdown type="ncsc" label="Download NCSC Report" />
        </div>
      </div>
    </div>
  );
};

export default Reports;
