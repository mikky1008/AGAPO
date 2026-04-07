import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users as UsersIcon, ShieldCheck, UserCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Navigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";

const Users = () => {
  // ── ALL hooks must come before any conditional return ──────
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmRole, setConfirmRole] = useState<{ userId: string; name: string; newRole: "admin" | "staff" } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_all_users");
      if (error) throw error;
      return data as { user_id: string; email: string; full_name: string | null; role: string; is_active: boolean; created_at: string }[];
    },
    // Only runs when confirmed admin — no wasted request for staff
    enabled: isAdmin,
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "staff" }) => {
      const { error } = await supabase.rpc("set_user_role", {
        _target_user_id: userId,
        _new_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] });
      toast({ title: "Role Updated", description: "User role has been changed." });
      setConfirmRole(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.rpc("toggle_user_active", {
        _target_user_id: userId,
        _is_active: isActive,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] });
      toast({ title: "Status Updated", description: "User account status changed." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Conditional returns AFTER all hooks ───────────────────
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Checking permissions…</p>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // ── Derived values ────────────────────────────────────────
  const adminCount  = users.filter((u) => u.role === "admin").length;
  const staffCount  = users.filter((u) => u.role === "staff").length;
  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage staff accounts and roles</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-3">
          <UsersIcon className="w-4 h-4 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total users</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <div>
            <p className="text-2xl font-bold text-foreground">{adminCount}</p>
            <p className="text-xs text-muted-foreground">Admins · {staffCount} staff</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <UserCircle className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Name / Email</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Joined</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Loading users…</td></tr>
              )}
              {!isLoading && users.map((u) => {
                const isSelf = u.user_id === currentUser?.id;
                return (
                  <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-amber-500/10 text-amber-700" : "bg-primary/10 text-primary"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {!isSelf && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            disabled={setRoleMutation.isPending}
                            onClick={() => setConfirmRole({
                              userId: u.user_id,
                              name: u.full_name || u.email,
                              newRole: u.role === "admin" ? "staff" : "admin",
                            })}
                          >
                            {u.role === "admin" ? "Make staff" : "Make admin"}
                          </Button>
                        )}
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${u.is_active ? "text-muted-foreground" : "text-primary"}`}
                            title={u.is_active ? "Deactivate" : "Activate"}
                            disabled={toggleActiveMutation.isPending}
                            onClick={() => toggleActiveMutation.mutate({ userId: u.user_id, isActive: !u.is_active })}
                          >
                            {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                        )}
                        {isSelf && <span className="text-xs text-muted-foreground italic">You</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && users.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role change confirmation */}
      <AlertDialog open={!!confirmRole} onOpenChange={(open) => { if (!open) setConfirmRole(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change <strong>{confirmRole?.name}</strong>'s role to <strong>{confirmRole?.newRole}</strong>.
              {confirmRole?.newRole === "admin" && " They will gain full admin access including user management and system logs."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRole && setRoleMutation.mutate({ userId: confirmRole.userId, role: confirmRole.newRole })}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;