import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertTriangle, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computePriority, calculateAge } from "@/lib/priorityScoring";

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

  const downloadCSV = (type: "seniors" | "assistance" | "priority") => {
    let csv = "";
    if (type === "seniors") {
      csv = "Name,Age,Gender,Address,Health Status,Income Level,Living Status,Priority Level\n";
      seniors.forEach((s) => {
        const age = calculateAge(s.birth_date);
        csv += `"${s.first_name} ${s.last_name}",${age},${s.gender},"${s.address}",${s.health_status},${s.income_level || "Low"},${s.living_status || "N/A"},${s.priority_level}\n`;
      });
    } else if (type === "assistance") {
      csv = "Senior,Type,Description,Amount,Date,Status,Given By\n";
      records.forEach((r) => {
        csv += `"${r.seniors?.first_name} ${r.seniors?.last_name}",${r.type},"${r.description}",${r.amount},${r.date_given},${r.status},"${r.given_by}"\n`;
      });
    } else if (type === "priority") {
      csv = "Name,Age,Health Status,Income Level,Living Status,Priority Level,Score\n";
      const sorted = [...seniors]
        .map((s) => ({ ...s, result: computePriority(s), age: calculateAge(s.birth_date) }))
        .sort((a, b) => b.result.score - a.result.score);
      sorted.forEach((s) => {
        csv += `"${s.first_name} ${s.last_name}",${s.age},${s.health_status},${s.income_level || "Low"},${s.living_status || "N/A"},${s.result.level},${s.result.score}\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agapo_${type}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: `${type} report saved as CSV.` });
  };

  const downloadPDF = (type: "seniors" | "assistance" | "priority") => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text("AGAPO - Barangay San Francisco", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${today}`, 14, 22);

    if (type === "seniors") {
      doc.setFontSize(13);
      doc.text("Senior Citizens Report", 14, 32);
      autoTable(doc, {
        startY: 38,
        head: [["Name", "Age", "Gender", "Address", "Health", "Income", "Living", "Priority"]],
        body: seniors.map((s) => [
          `${s.first_name} ${s.last_name}`,
          calculateAge(s.birth_date),
          s.gender,
          s.address,
          s.health_status,
          s.income_level || "Low",
          s.living_status || "N/A",
          s.priority_level || "Low",
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [39, 95, 62] },
      });
    } else if (type === "assistance") {
      doc.setFontSize(13);
      doc.text("Assistance Records Report", 14, 32);
      autoTable(doc, {
        startY: 38,
        head: [["Senior", "Type", "Description", "Amount", "Date", "Status", "Given By"]],
        body: records.map((r) => [
          `${r.seniors?.first_name} ${r.seniors?.last_name}`,
          r.type,
          r.description,
          `₱${Number(r.amount).toLocaleString()}`,
          r.date_given,
          r.status,
          r.given_by,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [39, 95, 62] },
      });
    } else if (type === "priority") {
      doc.setFontSize(13);
      doc.text("Priority Assessment Report", 14, 32);
      const sorted = [...seniors]
        .map((s) => ({ ...s, result: computePriority(s), age: calculateAge(s.birth_date) }))
        .sort((a, b) => b.result.score - a.result.score);
      autoTable(doc, {
        startY: 38,
        head: [["Name", "Age", "Health Status", "Income Level", "Living Status", "Priority", "Score"]],
        body: sorted.map((s) => [
          `${s.first_name} ${s.last_name}`,
          s.age,
          s.health_status,
          s.income_level || "Low",
          s.living_status || "N/A",
          s.result.level,
          `${s.result.score}/14`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 95, 62] },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 5) {
            const val = data.cell.raw;
            if (val === "High") data.cell.styles.textColor = [220, 38, 38];
            else if (val === "Medium") data.cell.styles.textColor = [202, 138, 4];
            else data.cell.styles.textColor = [22, 163, 74];
          }
        },
      });
    }

    doc.save(`agapo_${type}_report.pdf`);
    toast({ title: "Report Downloaded", description: `${type} report saved as PDF.` });
  };

  const totalAid = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const byType = records.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + Number(r.amount);
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = { High: 0, Medium: 0, Low: 0 };
  seniors.forEach((s) => {
    const result = computePriority(s);
    priorityCounts[result.level]++;
  });

  const DownloadDropdown = ({ type, label }: { type: "seniors" | "assistance" | "priority"; label?: string }) => (
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
        <h1 className="text-2xl font-serif text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm">Generate and download reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif text-foreground">Senior Citizens Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Total Registered: <span className="font-semibold text-foreground">{seniors.length}</span></p>
            <p className="text-muted-foreground">Male: <span className="font-semibold text-foreground">{seniors.filter(s => s.gender === "Male").length}</span></p>
            <p className="text-muted-foreground">Female: <span className="font-semibold text-foreground">{seniors.filter(s => s.gender === "Female").length}</span></p>
            <p className="text-muted-foreground">Living Alone: <span className="font-semibold text-foreground">{seniors.filter(s => s.living_status === "Living Alone" || s.living_alone).length}</span></p>
          </div>
          <DownloadDropdown type="seniors" />
        </div>

        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-serif text-foreground">Assistance Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Total Records: <span className="font-semibold text-foreground">{records.length}</span></p>
            <p className="text-muted-foreground">Total Amount: <span className="font-semibold text-foreground">₱{totalAid.toLocaleString()}</span></p>
            {Object.entries(byType).map(([type, amount]) => (
              <p key={type} className="text-muted-foreground">{type}: <span className="font-semibold text-foreground">₱{amount.toLocaleString()}</span></p>
            ))}
          </div>
          <DownloadDropdown type="assistance" />
        </div>

        <div className="stat-card space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-priority-high" />
            <h2 className="text-lg font-serif text-foreground">Priority List Report</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">High Priority: <span className="font-semibold text-foreground">{priorityCounts.High}</span></p>
            <p className="text-muted-foreground">Medium Priority: <span className="font-semibold text-foreground">{priorityCounts.Medium}</span></p>
            <p className="text-muted-foreground">Low Priority: <span className="font-semibold text-foreground">{priorityCounts.Low}</span></p>
          </div>
          <DownloadDropdown type="priority" label="Download Priority List" />
        </div>
      </div>
    </div>
  );
};

export default Reports;
