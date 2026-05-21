import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge } from "@/lib/priorityScoring";
import { CheckCircle2, Clock, Download, FileText, Gift, Star, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MILESTONES = [
  { age: 80,  label: "80th Birthday",     amount: 10000,  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",   icon: "🏅" },
  { age: 85,  label: "85th Birthday",     amount: 10000,  badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "🥈" },
  { age: 90,  label: "90th Birthday",     amount: 10000,  badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",       icon: "🥇" },
  { age: 95,  label: "95th Birthday",     amount: 10000,  badge: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "💎" },
  { age: 100, label: "Centenarian (ECA)", amount: 100000, badge: "bg-red-500/15 text-red-400 border-red-500/30",           icon: "👑" },
];

type Payout = {
  id: string; senior_id: string; milestone_age: number; amount: number;
  date_given: string; given_by: string; remarks: string | null; created_at: string;
};

type SignatoryInfo = { preparedBy: string; preparedByPosition: string; signedBy: string; signedByPosition: string };

const NCSC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSenior, setSelectedSenior] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState<{ milestoneAge: number; givenBy: string; remarks: string } | null>(null);
  const [exportModal, setExportModal] = useState<"csv" | "pdf" | null>(null);
  const [signatory, setSignatory] = useState<SignatoryInfo>({
    preparedBy: "", preparedByPosition: "",
    signedBy: "", signedByPosition: "",
  });

  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("*");
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
      return (data ?? []) as Payout[];
    },
  });

  const addPayout = useMutation({
    mutationFn: async (p: { senior_id: string; milestone_age: number; amount: number; given_by: string; remarks: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("ncsc_payouts").insert([{
        senior_id: p.senior_id, milestone_age: p.milestone_age, amount: p.amount,
        date_given: new Date().toISOString().split("T")[0], given_by: p.given_by, remarks: p.remarks || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ncsc_payouts"] });
      setPayoutForm(null); setSelectedSenior(null);
      toast({ title: "Payout recorded successfully!", description: "NCSC payout has been saved." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const eligibleSeniors = seniors
    .map((s: any) => ({ ...s, currentAge: calculateAge(s.birth_date) }))
    .filter((s: any) => s.currentAge >= 80)
    .sort((a: any, b: any) => b.currentAge - a.currentAge);

  const totalEligible = eligibleSeniors.length;
  const centenarians = eligibleSeniors.filter((s: any) => s.currentAge >= 100).length;
  const totalDisbursed = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayouts = eligibleSeniors.reduce((count, senior: any) => {
    MILESTONES.forEach((m) => {
      if (senior.currentAge >= m.age && !payouts.some((p) => p.senior_id === senior.id && p.milestone_age === m.age)) count++;
    });
    return count;
  }, 0);

  const getSeniorPayouts = (id: string) => payouts.filter((p) => p.senior_id === id);
  const isPaid = (id: string, age: number) => payouts.some((p) => p.senior_id === id && p.milestone_age === age);
  const getMilestone = (age: number) => MILESTONES.find((m) => m.age === age);

  // ── Export helpers ──────────────────────────────────────────────
  const buildRows = () => {
    const rows: any[] = [];
    eligibleSeniors.forEach((s: any) => {
      MILESTONES.filter((m) => s.currentAge >= m.age).forEach((m) => {
        const payout = payouts.find((p) => p.senior_id === s.id && p.milestone_age === m.age);
        rows.push({
          name: `${s.first_name} ${s.last_name}`,
          age: s.currentAge,
          milestone: m.age === 100 ? "100 – Centenarian" : `${m.age}`,
          amount: m.amount,
          dateGiven: payout?.date_given || "",
          givenBy: payout?.given_by || "",
          remarks: payout?.remarks || "",
          status: payout ? "Paid" : "Pending",
        });
      });
    });
    return rows;
  };

  const handleCSV = () => {
    const rows = buildRows();
    let csv = "Name,Age,Milestone Age,Amount (PHP),Date Given,Given By,Remarks,Status\n";
    rows.forEach((r) => {
      csv += `"${r.name}",${r.age},"${r.milestone}",${r.amount},"${r.dateGiven}","${r.givenBy}","${r.remarks}","${r.status}"\n`;
    });
    // Signatory footer
    csv += `\n`;
    csv += `"Prepared by:","${signatory.preparedBy}"\n`;
    csv += `"Position:","${signatory.preparedByPosition}"\n`;
    csv += `\n`;
    csv += `"Signed/Approved by:","${signatory.signedBy}"\n`;
    csv += `"Position:","${signatory.signedByPosition}"\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NCSC_ECA_Payout_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModal(null);
    toast({ title: "CSV Downloaded", description: "NCSC/ECA report saved." });
  };

  const handlePDF = () => {
    const rows = buildRows();
    const doc = new jsPDF({ orientation: "landscape" });
    const today = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

    // Header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("REPUBLIC OF THE PHILIPPINES", 148, 14, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Municipality of Mainit", 148, 20, { align: "center" });
    doc.text("Office of Senior Citizens Affairs (OSCA)", 148, 26, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NCSC / ECA PROGRESSIVE PAYOUT REPORT", 148, 35, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Date Generated: ${today}`, 14, 43);
    doc.text(`Total Eligible Seniors (80+): ${totalEligible}     Total Disbursed: PHP ${totalDisbursed.toLocaleString()}     Pending Milestones: ${pendingPayouts}`, 14, 49);

    // Table
    autoTable(doc, {
      startY: 54,
      head: [["Name", "Age", "Milestone", "Amount (PHP)", "Date Given", "Given By", "Remarks", "Status"]],
      body: rows.map((r) => [
        r.name, r.age, r.milestone,
        `₱${Number(r.amount).toLocaleString()}`,
        r.dateGiven || "—", r.givenBy || "—", r.remarks || "—", r.status,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [139, 26, 16], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      columnStyles: { 7: { fontStyle: "bold" } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 7) {
          data.cell.styles.textColor = data.cell.raw === "Paid" ? [22, 163, 74] : [180, 100, 0];
        }
      },
    });

    // Signatory section
    const finalY = (doc as any).lastAutoTable.finalY + 16;
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Prepared by (left)
    doc.text("Prepared by:", 30, finalY);
    doc.setFont("helvetica", "bold");
    doc.text(signatory.preparedBy || "___________________________", 30, finalY + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(signatory.preparedByPosition || "Position / Designation", 30, finalY + 17);
    doc.line(30, finalY + 13, 100, finalY + 13);

    // Signed / Approved by (right)
    doc.setFontSize(9);
    doc.text("Signed / Approved by:", pageW - 100, finalY);
    doc.setFont("helvetica", "bold");
    doc.text(signatory.signedBy || "___________________________", pageW - 100, finalY + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(signatory.signedByPosition || "Position / Designation", pageW - 100, finalY + 17);
    doc.line(pageW - 100, finalY + 13, pageW - 30, finalY + 13);

    doc.save(`NCSC_ECA_Payout_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    setExportModal(null);
    toast({ title: "PDF Downloaded", description: "NCSC/ECA report saved." });
  };

  const signatoryValid = signatory.preparedBy.trim() && signatory.signedBy.trim();

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">NCSC / ECA</h1>
            <p className="text-muted-foreground text-sm">
              National Commission of Senior Citizens — Progressive Payout Tracker (₱10K at 80, 85, 90, 95 · ₱100K Centenarian)
            </p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExportModal("csv")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
          >
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => setExportModal("pdf")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}
          >
            <Download className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Eligible Seniors", value: totalEligible, icon: Users, color: "text-amber-400", bg: "from-amber-400/12 to-yellow-400/12", glow: "hsl(38 85% 52% / 0.25)" },
          { label: "Centenarians", value: centenarians, icon: Trophy, color: "text-red-400", bg: "from-red-500/12 to-rose-500/12", glow: "hsl(6 65% 42% / 0.25)" },
          { label: "Total Disbursed", value: `₱${totalDisbursed.toLocaleString()}`, icon: Gift, color: "text-emerald-400", bg: "from-emerald-500/12 to-green-500/12", glow: "hsl(142 70% 42% / 0.20)" },
          { label: "Pending Payouts", value: pendingPayouts, icon: Clock, color: "text-orange-400", bg: "from-orange-400/12 to-amber-500/12", glow: "hsl(25 85% 52% / 0.20)" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card group cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="field-label mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: "Sora, sans-serif" }}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 4px 14px ${stat.glow}` }}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestone Legend */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "Sora, sans-serif" }}>
          NCSC Progressive Payout Schedule
        </p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <div key={m.age} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${m.badge}`}>
              <span>{m.icon}</span><span>Age {m.age}</span><span>—</span><span>₱{m.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          Under Republic Act 9994 (Expanded Senior Citizens Act) and NCSC guidelines. Each milestone is a one-time payout.
        </p>
      </div>

      {/* Senior List */}
      {eligibleSeniors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No seniors aged 80 or above registered yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {eligibleSeniors.map((senior: any) => {
          const seniorPayouts = getSeniorPayouts(senior.id);
          const applicableMilestones = MILESTONES.filter((m) => senior.currentAge >= m.age);
          const paidCount = applicableMilestones.filter((m) => isPaid(senior.id, m.age)).length;
          const allPaid = paidCount === applicableMilestones.length;
          const isCentenarian = senior.currentAge >= 100;

          return (
            <div key={senior.id}
              className={`glass-card border ${isCentenarian ? "border-red-500/30" : "border-border"} overflow-hidden`}
              style={isCentenarian ? { boxShadow: "0 0 20px hsl(6 65% 42% / 0.15)" } : {}}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: isCentenarian ? "linear-gradient(135deg, #8B1A10, #C9933A)" : "linear-gradient(135deg, hsl(38,65%,35%), hsl(38,50%,28%))" }}>
                    {isCentenarian ? "👑" : <Star className="w-4 h-4 text-amber-300" fill="currentColor" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                        {senior.first_name} {senior.last_name}
                      </h3>
                      {isCentenarian && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">Centenarian</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      Age {senior.currentAge} · Born {new Date(senior.birth_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · {senior.address}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${allPaid ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                  {paidCount}/{applicableMilestones.length} Milestones Paid
                </span>
              </div>

              <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {applicableMilestones.map((m) => {
                  const paid = isPaid(senior.id, m.age);
                  const payoutRecord = seniorPayouts.find((p) => p.milestone_age === m.age);
                  return (
                    <div key={m.age}
                      className={`rounded-xl border p-3 text-center transition-all ${paid
                        ? "bg-emerald-500/10 border-emerald-500/25"
                        : "bg-amber-500/8 border-amber-500/20 cursor-pointer hover:bg-amber-500/15"}`}
                      onClick={() => { if (!paid) { setSelectedSenior(senior); setPayoutForm({ milestoneAge: m.age, givenBy: "", remarks: "" }); } }}
                    >
                      <div className="text-lg mb-1">{m.icon}</div>
                      <p className="text-xs font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Age {m.age}</p>
                      <p className="text-[10px] text-muted-foreground mb-1">₱{m.amount.toLocaleString()}</p>
                      {paid ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /><span className="text-[10px] font-medium">Given</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium">Tap to Record</span>
                      )}
                      {paid && payoutRecord && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(payoutRecord.date_given).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Payout Modal ── */}
      {payoutForm && selectedSenior && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}>
                {getMilestone(payoutForm.milestoneAge)?.icon}
              </div>
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>Record NCSC Payout</h2>
                <p className="text-xs text-muted-foreground">{selectedSenior.first_name} {selectedSenior.last_name} · Age {payoutForm.milestoneAge} milestone</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Milestone</span><span className="font-semibold text-foreground">{getMilestone(payoutForm.milestoneAge)?.label}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Amount</span><span className="font-bold text-amber-400">₱{getMilestone(payoutForm.milestoneAge)?.amount.toLocaleString()}</span></div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="field-label block mb-1">Given By <span className="text-red-400">*</span></label>
                <input className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Name of officer / staff" value={payoutForm.givenBy}
                  onChange={(e) => setPayoutForm({ ...payoutForm, givenBy: e.target.value })} />
              </div>
              <div>
                <label className="field-label block mb-1">Remarks (optional)</label>
                <textarea className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  placeholder="Additional notes..." rows={2} value={payoutForm.remarks}
                  onChange={(e) => setPayoutForm({ ...payoutForm, remarks: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => { setPayoutForm(null); setSelectedSenior(null); }}>Cancel</button>
              <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}
                disabled={!payoutForm.givenBy.trim() || addPayout.isPending}
                onClick={() => {
                  if (!payoutForm.givenBy.trim()) return;
                  addPayout.mutate({ senior_id: selectedSenior.id, milestone_age: payoutForm.milestoneAge, amount: getMilestone(payoutForm.milestoneAge)!.amount, given_by: payoutForm.givenBy, remarks: payoutForm.remarks });
                }}>
                {addPayout.isPending ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal (Signatory) ── */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}>
                {exportModal === "pdf" ? <Download className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                  Export {exportModal === "pdf" ? "PDF" : "CSV"} Report
                </h2>
                <p className="text-xs text-muted-foreground">Fill in signatory details to include at the end of the document.</p>
              </div>
            </div>

            {/* Prepared by */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Prepared By</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label block mb-1 text-xs">Full Name <span className="text-red-400">*</span></label>
                  <input className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Juan Dela Cruz" value={signatory.preparedBy}
                    onChange={(e) => setSignatory({ ...signatory, preparedBy: e.target.value })} />
                </div>
                <div>
                  <label className="field-label block mb-1 text-xs">Position / Designation</label>
                  <input className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. OSCA Officer" value={signatory.preparedByPosition}
                    onChange={(e) => setSignatory({ ...signatory, preparedByPosition: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Signed by */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Signed / Approved By</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label block mb-1 text-xs">Full Name <span className="text-red-400">*</span></label>
                  <input className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Maria Santos" value={signatory.signedBy}
                    onChange={(e) => setSignatory({ ...signatory, signedBy: e.target.value })} />
                </div>
                <div>
                  <label className="field-label block mb-1 text-xs">Position / Designation</label>
                  <input className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Municipal Mayor" value={signatory.signedByPosition}
                    onChange={(e) => setSignatory({ ...signatory, signedByPosition: e.target.value })} />
                </div>
              </div>
            </div>

            {!signatoryValid && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <span>⚠</span> Both "Prepared by" and "Signed by" full names are required.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setExportModal(null)}>Cancel</button>
              <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, hsl(38,85%,48%), hsl(6,65%,42%))" }}
                disabled={!signatoryValid}
                onClick={exportModal === "pdf" ? handlePDF : handleCSV}>
                Download {exportModal === "pdf" ? "PDF" : "CSV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NCSC;