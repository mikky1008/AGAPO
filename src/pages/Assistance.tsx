import { useState } from "react";
import { sendNotificationEmail } from "@/lib/notificationEmail";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, RotateCcw, CalendarIcon, Bell, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const todayStr = () => new Date().toISOString().split("T")[0];
const emptyForm = { seniorId: "", type: "Financial", description: "", amount: "", givenBy: "", dateGiven: todayStr() };

const Assistance = () => {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  // Notify Staff panel state
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifReleaseDate, setNotifReleaseDate] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifSending, setNotifSending] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ["assistance_records", showDeleted],
    queryFn: async () => {
      let q = supabase.from("assistance_records").select("*, seniors(first_name, last_name)").order("created_at", { ascending: false });
      if (isAdmin && showDeleted) {
        q = supabase.from("assistance_records").select("*, seniors(first_name, last_name)").not("deleted_at", "is", null).order("created_at", { ascending: false });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("id, first_name, last_name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assistance_records").insert({
        senior_id: form.seniorId,
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        given_by: form.givenBy,
        date_given: form.dateGiven,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance_records"] });
      setAddOpen(false);
      const senior = seniors.find((s: any) => s.id === form.seniorId);
      const seniorName = senior ? `${senior.first_name} ${senior.last_name}` : "Unknown";
      sendNotificationEmail("assistance_added", `Assistance added for ${seniorName} — ${form.type}.`, "Assistance Record Added");
      setForm(emptyForm);
      toast({ title: "Record Added", description: "Assistance record saved." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editRecord) return;
      const { error } = await supabase.from("assistance_records").update({
        senior_id: form.seniorId,
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        given_by: form.givenBy,
        date_given: form.dateGiven,
      }).eq("id", editRecord.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance_records"] });
      setEditOpen(false);
      setEditRecord(null);
      setForm(emptyForm);
      toast({ title: "Record Updated", description: "Assistance record updated successfully." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  // Soft delete via RPC
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("soft_delete_assistance", { _record_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance_records"] });
      setDeleteId(null);
      toast({ title: "Record Archived", description: "Assistance record archived and can be restored by an admin." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const openEdit = (record: any) => {
    setEditRecord(record);
    setForm({
      seniorId: record.senior_id,
      type: record.type,
      description: record.description,
      amount: String(record.amount),
      givenBy: record.given_by,
      dateGiven: record.date_given,
    });
    setEditOpen(true);
  };

  const filtered = records.filter((r) => {
    const name = `${r.seniors?.first_name || ""} ${r.seniors?.last_name || ""}`;
    return name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase());
  });

  const handleFormChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const renderFormFields = () => (
    <>
      <div className="space-y-1.5">
        <Label>Senior Citizen</Label>
        <Select value={form.seniorId} onValueChange={(v) => handleFormChange("seniorId", v)}>
          <SelectTrigger><SelectValue placeholder="Select senior" /></SelectTrigger>
          <SelectContent>
            {seniors.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => handleFormChange("type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Financial">Financial</SelectItem>
            <SelectItem value="Medical">Medical</SelectItem>
            <SelectItem value="Food">Food</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input required value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Amount (₱)</Label>
        <Input type="number" required value={form.amount} onChange={(e) => handleFormChange("amount", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Given By</Label>
        <Input required value={form.givenBy} onChange={(e) => handleFormChange("givenBy", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Date Given</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.dateGiven && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.dateGiven ? format(new Date(form.dateGiven + "T00:00:00"), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.dateGiven ? new Date(form.dateGiven + "T00:00:00") : undefined}
              onSelect={(date) => handleFormChange("dateGiven", date ? format(date, "yyyy-MM-dd") : todayStr())}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );

  // ── Send Notification via Gmail SMTP ──────────────────────────
  const handleSendNotification = async () => {
    if (!notifReleaseDate) {
      toast({ title: "Missing date", description: "Please select a release date.", variant: "destructive" });
      return;
    }
    setNotifSending(true);
    try {
      const releaseFormatted = new Date(notifReleaseDate).toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).functions.invoke("send-ncsc-release-notification", {
        body: {
          releaseDate: releaseFormatted,
          rawDate: notifReleaseDate,
          customMessage: notifMessage.trim() || null,
          totalEligible: 0,
          pendingPayouts: 0,
          totalDisbursed: 0,
        },
      });
      if (error) throw new Error(error.message);
      toast({ title: "Notification sent!", description: `All staff & admins have been notified of the ${releaseFormatted} payout release.` });
      setShowNotifPanel(false);
      setNotifReleaseDate("");
      setNotifMessage("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message || "Could not reach notification service.", variant: "destructive" });
    } finally {
      setNotifSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Assistance Records</h1>
          <p className="page-subtitle">{records.length} {showDeleted ? "archived" : "total"} records</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowNotifPanel(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(220,75%,52%), hsl(250,65%,55%))", color: "#fff" }}
            >
              <Bell className="w-4 h-4" /> Notify Staff
            </button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
              className={showDeleted ? "border-destructive text-destructive" : ""}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {showDeleted ? "View Active" : "View Archived"}
            </Button>
          )}
          {!showDeleted && (
            <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setForm(emptyForm); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Record</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>New Assistance Record</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
                  {renderFormFields()}
                  <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                    {addMutation.isPending ? "Saving..." : "Save Record"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {showDeleted && isAdmin && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          Showing archived records. These are hidden from staff.
        </div>
      )}

      <div className="glass-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Senior</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Description</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Date</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={`border-b border-border last:border-0 transition-colors ${r.deleted_at ? "opacity-60" : "hover:bg-muted/30"}`}>
                  <td className="p-3 text-sm font-medium text-foreground">{r.seniors?.first_name} {r.seniors?.last_name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{r.type}</td>
                  <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{r.description}</td>
                  <td className="p-3 text-sm font-medium text-foreground">₱{Number(r.amount).toLocaleString()}</td>
                  <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{r.date_given}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${r.status === "Completed" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {!r.deleted_at && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {isAdmin && !r.deleted_at && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} title="Archive" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditRecord(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>Edit Assistance Record</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            {renderFormFields()}
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this record?</AlertDialogTitle>
            <AlertDialogDescription>This record will be archived and hidden from staff. Admins can view archived records using the &quot;View Archived&quot; button.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Notify Staff Panel (Admin Only) ── */}
      <Dialog open={showNotifPanel && isAdmin} onOpenChange={(open) => { if (!open) setShowNotifPanel(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(220,75%,52%), hsl(250,65%,55%))" }}>
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>Notify All Staff & Admins</DialogTitle>
                  <p className="text-xs text-muted-foreground">Send NCSC payout release announcement via email</p>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-blue-500/15 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Email Template Preview</p>
              </div>
              <div className="p-4 space-y-2 text-xs text-muted-foreground font-mono">
                <p><span className="text-blue-400">From:</span> AGAPO OSCA &lt;autobitofficial.ph@gmail.com&gt;</p>
                <p><span className="text-blue-400">To:</span> All registered staff &amp; admins</p>
                <p><span className="text-blue-400">Subject:</span> 📢 NCSC/ECA Payout Release — [Selected Date]</p>
                <hr className="border-border/50 my-2" />
                <p className="text-foreground/80">Body includes: release date and your custom message.</p>
              </div>
            </div>

            <div>
              <label className="field-label block text-xs mb-1">Payout Release Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={notifReleaseDate}
                onChange={(e) => setNotifReleaseDate(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label block text-xs mb-1">Additional Message (optional)</label>
              <textarea
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="e.g. Please prepare the necessary documents. Report to the OSCA office by 8AM."
                rows={3}
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setShowNotifPanel(false)}>Cancel</button>
              <button
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, hsl(220,75%,52%), hsl(250,65%,55%))" }}
                disabled={!notifReleaseDate || notifSending}
                onClick={handleSendNotification}
              >
                {notifSending ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Notification</>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assistance;
