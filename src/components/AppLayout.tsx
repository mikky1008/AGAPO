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
import ChatAgent from "@/components/ChatAgent";

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
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 sidebar-glass flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo header */}
        <div className={`p-4 flex items-center border-b border-white/10 ${collapsed ? "justify-center py-5" : "gap-3 px-5 py-5"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(200_85%_62%)] to-[hsl(231_70%_58%)] flex items-center justify-center shrink-0 shadow-[0_4px_12px_hsl(200_85%_52%/0.40)]">
            <img src="/favicon.ico" className="w-9 h-9 rounded-xl object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground tracking-wide" style={{ fontFamily: "Sora, sans-serif" }}>
                AGAPO
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wider uppercase">
                Brgy. San Francisco
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5">
          {allNavItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const isActive = location.pathname === item.to;
            const link = (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? "justify-center" : ""}
                  ${isActive
                    ? "bg-gradient-to-r from-[hsl(200_85%_62%/0.20)] to-[hsl(231_70%_65%/0.12)] text-sidebar-primary border border-sidebar-primary/25 shadow-[0_2px_8px_hsl(200_85%_52%/0.15)]"
                    : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-white/8"
                  }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
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
        <div className="p-2.5 border-t border-white/10 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[11px] font-medium text-sidebar-foreground/45 truncate">{user?.email}</p>
              <p className="text-[11px] font-semibold text-sidebar-primary capitalize tracking-wide">{role}</p>
            </div>
          )}

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-red-500/12 w-full transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/8 w-full transition-all duration-200 justify-center"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 border-b border-white/50 flex items-center px-4 lg:px-6 bg-white/60 backdrop-blur-xl shadow-[0_1px_12px_hsl(0_0%_0%/0.05)] sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-xs font-semibold text-muted-foreground/70 capitalize ml-3 tracking-wide">
            {isAdmin ? "Administrator" : "Barangay Staff"}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
        <ChatAgent />
      </div>
    </div>
  );
};

export default AppLayout;
