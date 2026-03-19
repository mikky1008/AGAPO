import { useState } from "react";
import { sendNotificationEmail } from "@/lib/notificationEmail";
import { computePriority, calculateAge } from "@/lib/priorityScoring";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SeniorForm from "@/components/SeniorForm";
import SeniorProfile from "@/components/SeniorProfile";
import { useToast } from "@/hooks/use-toast";

const Seniors = () => {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewSeniorId, setViewSeniorId] = useState<string | null>(null);
  const [editSenior, setEditSenior] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadPhoto = async (file: File, seniorId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `photos/${seniorId}.${ext}`;
    const { error } = await supabase.storage.from("senior-photos").upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("senior-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const addMutation = useMutation({
    mutationFn: async ({ payload, photoFile }: { payload: any; photoFile?: File | null }) => {
      const { data, error } = await supabase.from("seniors").insert({ ...payload, created_by: user?.id }).select("id").single();
      if (error) throw error;
      if (photoFile && data) {
        const photoUrl = await uploadPhoto(photoFile, data.id);
        if (photoUrl) {
          await supabase.from("seniors").update({ photo: photoUrl }).eq("id", data.id);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seniors"] });
      setAddOpen(false);
      toast({ title: "Senior Registered", description: "New senior citizen has been added." });
      const name = `${variables.payload.first_name} ${variables.payload.last_name}`;
      sendNotificationEmail("new_senior", `New senior ${name} has been registered.`, "New Senior Registered");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, photoFile }: { id: string; data: any; photoFile?: File | null }) => {
      let photoUrl = data.photo;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, id);
      }
      const { error } = await supabase.from("seniors").update({ ...data, photo: photoUrl || data.photo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seniors"] });
      setEditOpen(false);
      setEditSenior(null);
      toast({ title: "Senior Updated", description: "Record has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seniors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seniors"] });
      setDeleteId(null);
      toast({ title: "Senior Deleted", description: "Record has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = seniors.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const viewSenior = seniors.find((s) => s.id === viewSeniorId);

  const priorityColor = (level: string) => {
    switch (level) {
      case "High": return "bg-destructive/10 text-priority-high border-0";
      case "Medium": return "bg-warning/10 text-warning border-0";
      case "Low": return "bg-primary/10 text-primary border-0";
      default: return "";
    }
  };

  const buildSeniorPayload = (formData: any) => {
    const age = calculateAge(formData.birthDate);
    const seniorData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      age,
      birth_date: formData.birthDate,
      gender: formData.gender,
      address: formData.address,
      contact_number: formData.contactNumber,
      emergency_contact: formData.emergencyContact || null,
      health_status: formData.healthStatus,
      illnesses: formData.illnesses ? formData.illnesses.split(",").map((s: string) => s.trim()) : [],
      living_alone: formData.livingStatus === "Living Alone",
      with_family: formData.livingStatus === "With Family",
      living_status: formData.livingStatus,
      income_level: formData.incomeLevel,
    };
    const priority = computePriority(seniorData as any);
    return { ...seniorData, priority_level: priority.level };
  };

  const handleAddSenior = (formData: any, photoFile?: File | null) => {
    addMutation.mutate({ payload: buildSeniorPayload(formData), photoFile });
  };

  const handleEditSenior = (formData: any, photoFile?: File | null) => {
    if (!editSenior) return;
    updateMutation.mutate({ id: editSenior.id, data: buildSeniorPayload(formData), photoFile });
  };

  const openEdit = (senior: any) => {
    setEditSenior(senior);
    setEditOpen(true);
  };

  const getEditInitialData = () => {
    if (!editSenior) return undefined;
    return {
      firstName: editSenior.first_name,
      lastName: editSenior.last_name,
      birthDate: editSenior.birth_date,
      gender: editSenior.gender,
      address: editSenior.address,
      contactNumber: editSenior.contact_number || "",
      emergencyContact: editSenior.emergency_contact || "",
      healthStatus: editSenior.health_status,
      illnesses: editSenior.illnesses?.join(", ") || "",
      livingStatus: editSenior.living_status || (editSenior.living_alone ? "Living Alone" : "With Family"),
      incomeLevel: editSenior.income_level || "Low",
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Senior Citizens</h1>
          <p className="text-muted-foreground text-sm">{seniors.length} registered seniors</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Senior</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Register New Senior</DialogTitle></DialogHeader>
            <SeniorForm onSubmit={handleAddSenior} submitLabel="Register Senior" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Age</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Address</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Health</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Priority</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((senior) => {
                const currentAge = calculateAge(senior.birth_date);
                return (
                  <tr key={senior.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm font-medium text-foreground">{senior.first_name} {senior.last_name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{currentAge}</td>
                    <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{senior.address}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${senior.health_status === "Good" ? "bg-primary/10 text-primary" : senior.health_status === "Fair" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-priority-high"}`}>
                        {senior.health_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={priorityColor(senior.priority_level || "Low")}>{senior.priority_level || "Low"}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewSeniorId(senior.id)} title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(senior)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(senior.id)} title="Delete" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No seniors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Profile Dialog */}
      <Dialog open={!!viewSeniorId} onOpenChange={() => setViewSeniorId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Senior Profile</DialogTitle></DialogHeader>
          {viewSenior && <SeniorProfile senior={viewSenior} />}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditSenior(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Edit Senior Record</DialogTitle></DialogHeader>
          {editSenior && (
            <SeniorForm
              onSubmit={handleEditSenior}
              initialData={getEditInitialData()}
              initialPhotoUrl={editSenior.photo || null}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this senior citizen record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Seniors;
