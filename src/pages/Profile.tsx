import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Camera, User, Lock, Bell, Shield, MapPin, Mail, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"account" | "password" | "notifications" | "policies">("account");
  const [settingsName, setSettingsName] = useState("");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const { data: notifPrefs } = useQuery({
    queryKey: ["notification_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code === "PGRST116") {
        const { data: created } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id } as any)
          .select()
          .single();
        return created;
      }
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateNotifPref = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase
      .from("notification_preferences")
      .update({ [field]: value } as any)
      .eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["notification_preferences"] });
  };

  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seniors").select("id");
      if (error) throw error;
      return data;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["assistance_records"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assistance_records").select("id, created_by").eq("created_by", user?.id || "");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (profile && !profileLoaded) {
    setEditName(profile.full_name || "");
    setSettingsName(profile.full_name || "");
    setEditBio((profile as any).bio || "");
    setProfileLoaded(true);
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const displayRole = role === "admin" ? "Administrator" : "Staff";
  const displayBio = (profile as any)?.bio || "";
  const avatarUrl = editAvatarPreview || (profile as any)?.avatar_url || null;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      let avatarPublicUrl = (profile as any)?.avatar_url || null;
      if (editAvatarFile) {
        const ext = editAvatarFile.name.split(".").pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, editAvatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarPublicUrl = urlData.publicUrl;
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName, bio: editBio, avatar_url: avatarPublicUrl } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
      setEditOpen(false);
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Changed", description: "Your password has been updated." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="animate-fade-in space-y-0">
      

        {/* Green gradient cover */}
        <div className="h-36 sm:h-44 w-full" style={{ background: "linear-gradient(135deg, #166534, #15803d, #4ade80)" }} />

        {/* Avatar + Info */}
        <div className="px-6 lg:px-10 pb-10">
          {/* Avatar overlapping cover */}
          <div className="relative -mt-11 mb-4 w-fit">
            <div
              className="w-24 h-24 rounded-full border-4 border-card bg-muted overflow-hidden flex items-center justify-center shadow-lg cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name, role, meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  {displayRole}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mb-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />{displayEmail}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />Brgy. San Francisco, Mainit, Surigao del Norte
                </span>
              </div>
              {displayBio && (
                <p className="text-xs text-muted-foreground italic">{displayBio}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => {
                setEditName(profile?.full_name || "");
                setEditBio((profile as any)?.bio || "");
                setEditAvatarPreview(null);
                setEditAvatarFile(null);
                setEditOpen(true);
              }}>
                Edit Profile
              </Button>
              <Button size="sm" variant="outline" className="w-9 h-9 p-0" title="Settings" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden">
            <div className="py-4 text-center border-r border-border">
              <p className="text-2xl font-bold text-primary">{seniors.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Seniors Managed</p>
            </div>
            <div className="py-4 text-center border-r border-border">
              <p className="text-2xl font-bold text-primary">{records.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Aid Records Added</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-base font-bold text-primary">{memberSince}</p>
              <p className="text-xs text-muted-foreground mt-1">Member Since</p>
            </div>
          </div>
        </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative w-20 h-20 rounded-full border-4 border-muted bg-muted overflow-hidden flex items-center justify-center cursor-pointer group shadow"
                onClick={() => fileInputRef.current?.click()}
              >
                {editAvatarPreview || (profile as any)?.avatar_url ? (
                  <img src={editAvatarPreview || (profile as any)?.avatar_url} alt="avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Click photo to change</p>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Write a short bio..." rows={3} className="resize-none" />
            </div>
            <Button className="w-full" onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Settings</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 border-b border-border pb-2 mt-1">
            {(["account", "password", "notifications", "policies"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize
                  ${settingsTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {tab === "account" && <User className="w-3.5 h-3.5" />}
                {tab === "password" && <Lock className="w-3.5 h-3.5" />}
                {tab === "notifications" && <Bell className="w-3.5 h-3.5" />}
                {tab === "policies" && <Shield className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>

          {settingsTab === "account" && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={displayRole} disabled className="bg-muted" />
              </div>
              <Button className="w-full" onClick={async () => {
                if (!user) return;
                const { error } = await supabase.from("profiles").update({ full_name: settingsName } as any).eq("user_id", user.id);
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["profile"] });
                  toast({ title: "Name Updated", description: "Your name has been saved." });
                }
              }}>
                Save Name
              </Button>
            </div>
          )}

          {settingsTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

          {settingsTab === "notifications" && (
            <div className="space-y-5 pt-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">In-App Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: "new_senior", label: "New senior registered" },
                    { key: "assistance_added", label: "Assistance record added" },
                    { key: "high_priority", label: "Senior flagged High Priority" },
                    { key: "assistance_completed", label: "Assistance marked Completed" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch checked={(notifPrefs as any)?.[item.key] ?? true} onCheckedChange={(val) => updateNotifPref(item.key, val)} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: "email_new_senior", label: "New senior registered" },
                    { key: "email_assistance_added", label: "Assistance record added" },
                    { key: "email_high_priority", label: "Senior flagged High Priority" },
                    { key: "email_assistance_completed", label: "Assistance marked Completed" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch checked={(notifPrefs as any)?.[item.key] ?? true} onCheckedChange={(val) => updateNotifPref(item.key, val)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {settingsTab === "policies" && (
            <div className="space-y-4 pt-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Terms of Use</h3>
                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-2 max-h-36 overflow-y-auto">
                  <p>AGAPO is provided exclusively for authorized personnel of Barangay San Francisco, Mainit, Surigao del Norte.</p>
                  <p>Users must use the system solely for managing senior citizen records and assistance programs. Unauthorized access or data modification is strictly prohibited.</p>
                  <p>All actions are logged and monitored. Misuse may result in revocation of access and appropriate administrative action.</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Privacy Policy</h3>
                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-2 max-h-36 overflow-y-auto">
                  <p>We protect the personal information of registered senior citizens. All data is used exclusively for assistance and services.</p>
                  <p>Health status, income level, and living conditions are kept strictly confidential and accessible only to authorized barangay staff.</p>
                  <p>In compliance with the Data Privacy Act of 2012 (RA 10173), we implement appropriate security measures to protect personal data.</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
