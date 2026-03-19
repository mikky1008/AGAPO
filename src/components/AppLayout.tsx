import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, HandHeart, ShieldAlert, FileText, LogOut, Heart, Menu, PanelLeftClose, PanelLeft, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import NotificationBell from "@/components/NotificationBell";

const allNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", adminOnly: false },
  { to: "/seniors", icon: Users, label: "Senior Citizens", adminOnly: false },
  { to: "/assistance", icon: HandHeart, label: "Assistance Records", adminOnly: false },
  { to: "/priority", icon: ShieldAlert, label: "Priority Assessment", adminOnly: false },
  { to: "/reports", icon: FileText, label: "Reports", adminOnly: false },
  { to: "/profile", icon: User, label: "Profile", adminOnly: false },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-sidebar flex flex-col transition-all duration-200
        ${collapsed ? "w-16" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Header */}
        <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "gap-3 px-6"}`}>
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-serif text-sidebar-foreground">AGAPO</h1>
              <p className="text-xs text-sidebar-foreground/60">Brgy. San Francisco</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1">
          {allNavItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const isActive = location.pathname === item.to;
            const link = (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${collapsed ? "justify-center" : ""}
                  ${isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 space-y-1">
          {!collapsed && (
            <div className="px-3">
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-primary capitalize">{role}</p>
            </div>
          )}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={handleLogout}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors ${collapsed ? "justify-center" : ""}`}>
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>

          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors justify-center">
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-card">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-sm text-muted-foreground capitalize ml-2">{isAdmin ? "Administrator" : "Barangay Staff"}</span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
