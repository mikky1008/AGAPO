import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, HandHeart, ShieldAlert, FileText, LogOut,
  Menu, PanelLeftClose, PanelLeft, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import NotificationBell from "@/components/NotificationBell";
import ChatAgent from "@/components/ChatAgent";

const allNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/seniors", icon: Users, label: "Senior Citizens" },
  { to: "/assistance", icon: HandHeart, label: "Assistance Records" },
  { to: "/priority", icon: ShieldAlert, label: "Priority Assessment" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/profile", icon: User, label: "Profile" },
];

/** Subtle senior-care SVG scene — semi-transparent, placed in page background */
const BackgroundArt = () => (
  <svg
    className="pointer-events-none select-none fixed bottom-0 right-0 opacity-[0.055] z-0"
    width="520" height="420" viewBox="0 0 520 420" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Elderly figure with walking cane */}
    <ellipse cx="130" cy="360" rx="42" ry="14" fill="hsl(158,55%,35%)" opacity="0.5"/>
    {/* body */}
    <rect x="112" y="270" width="36" height="80" rx="18" fill="hsl(158,55%,35%)"/>
    {/* head */}
    <circle cx="130" cy="252" r="22" fill="hsl(158,55%,35%)"/>
    {/* cane */}
    <line x1="155" y1="345" x2="175" y2="370" stroke="hsl(158,55%,35%)" strokeWidth="5" strokeLinecap="round"/>
    <line x1="175" y1="370" x2="185" y2="370" stroke="hsl(158,55%,35%)" strokeWidth="5" strokeLinecap="round"/>
    {/* arms */}
    <path d="M112 295 Q88 315 80 335" stroke="hsl(158,55%,35%)" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M148 295 Q168 310 158 340" stroke="hsl(158,55%,35%)" strokeWidth="8" strokeLinecap="round" fill="none"/>

    {/* Heart / care symbol */}
    <path d="M280 180 C280 170, 265 160, 258 172 C251 160, 236 170, 236 180 C236 195 258 210 258 210 C258 210 280 195 280 180 Z"
      fill="hsl(145,65%,42%)" opacity="0.7"/>

    {/* Caregiver / helper figure */}
    <ellipse cx="350" cy="360" rx="46" ry="14" fill="hsl(152,55%,38%)" opacity="0.5"/>
    <rect x="330" y="265" width="40" height="88" rx="20" fill="hsl(152,55%,38%)"/>
    <circle cx="350" cy="246" r="24" fill="hsl(152,55%,38%)"/>
    {/* arms outstretched — welcoming */}
    <path d="M330 292 Q300 275 285 285" stroke="hsl(152,55%,38%)" strokeWidth="9" strokeLinecap="round" fill="none"/>
    <path d="M370 292 Q400 275 415 285" stroke="hsl(152,55%,38%)" strokeWidth="9" strokeLinecap="round" fill="none"/>

    {/* Connecting line — helping hand */}
    <path d="M168 330 Q210 280 280 310" stroke="hsl(145,65%,42%)" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" opacity="0.6"/>

    {/* Small leaf / wellness icons */}
    <path d="M430 120 C430 100 450 90 465 105 C450 105 445 120 430 120 Z" fill="hsl(158,64%,38%)" opacity="0.8"/>
    <path d="M445 120 L448 140" stroke="hsl(158,64%,38%)" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>

    <path d="M60 150 C60 130 80 120 95 135 C80 135 75 150 60 150 Z" fill="hsl(145,72%,44%)" opacity="0.6"/>
    <path d="M75 150 L78 170" stroke="hsl(145,72%,44%)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>

    {/* Star/sparkle accents */}
    <circle cx="200" cy="100" r="4" fill="hsl(158,64%,38%)" opacity="0.5"/>
    <circle cx="480" cy="200" r="3" fill="hsl(145,72%,44%)" opacity="0.4"/>
    <circle cx="310" cy="60" r="5" fill="hsl(172,60%,40%)" opacity="0.45"/>

    {/* Large faint circle frame */}
    <circle cx="350" cy="310" r="180" stroke="hsl(158,64%,38%)" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="12 8"/>
  </svg>
);

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
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <BackgroundArt />

      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 sidebar-glass flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-white/10 shrink-0
          ${collapsed ? "justify-center p-4" : "gap-3 px-5 py-5"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(145_72%_58%)] to-[hsl(158_64%_42%)] flex items-center justify-center shrink-0 shadow-[0_4px_12px_hsl(145_72%_38%/0.45)]">
            <img src="/favicon.ico" className="w-9 h-9 rounded-xl object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground tracking-wide"
                style={{ fontFamily: "Sora, sans-serif" }}>AGAPO</h1>
              <p className="text-[10px] text-sidebar-foreground/50 font-semibold tracking-widest uppercase">
                Brgy. San Francisco
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            const link = (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${collapsed ? "justify-center" : ""}
                  ${isActive
                    ? "bg-gradient-to-r from-[hsl(145_72%_58%/0.22)] to-[hsl(158_64%_50%/0.14)] text-sidebar-primary border border-sidebar-primary/28 shadow-[0_2px_8px_hsl(145_72%_38%/0.18)]"
                    : "text-sidebar-foreground/62 hover:text-sidebar-foreground hover:bg-white/8"
                  }`}>
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
            if (collapsed) return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
            return link;
          })}
        </nav>

        {/* Footer */}
        <div className="p-2.5 border-t border-white/10 space-y-1 shrink-0">
          {!collapsed && (
            <div className="px-3 py-2">
              <p className="text-[11px] font-medium text-sidebar-foreground/42 truncate"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{user?.email}</p>
              <p className="text-[11px] font-bold text-sidebar-primary capitalize tracking-wide"
                style={{ fontFamily: "Sora, sans-serif" }}>{role}</p>
            </div>
          )}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={handleLogout}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/58 hover:text-sidebar-foreground hover:bg-red-500/14 w-full transition-all duration-200
                  ${collapsed ? "justify-center" : ""}`}
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/48 hover:text-sidebar-foreground hover:bg-white/8 w-full transition-all duration-200 justify-center">
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Topbar */}
        <header className="h-14 border-b border-white/52 flex items-center px-4 lg:px-6 bg-white/62 backdrop-blur-xl shadow-[0_1px_12px_hsl(0_0%_0%/0.05)] sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-xs font-bold text-muted-foreground/65 capitalize ml-3 tracking-widest uppercase"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
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
