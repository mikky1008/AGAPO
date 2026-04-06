import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, HandHeart, ShieldAlert, FileText, LogOut,
  Menu, PanelLeftClose, PanelLeft, User, Bot, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import NotificationBell from "@/components/NotificationBell";
import ChatAgent from "@/components/ChatAgent";

const staffNavItems = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/seniors",     icon: Users,           label: "Senior Citizens" },
  { to: "/assistance",  icon: HandHeart,       label: "Assistance Records" },
  { to: "/priority",    icon: ShieldAlert,     label: "Priority Assessment" },
  { to: "/reports",     icon: FileText,        label: "Reports" },
  { to: "/profile",     icon: User,            label: "Profile" },
];

const adminOnlyNavItems = [
  { to: "/agent-logs",  icon: Bot,             label: "AI Agent Logs" },
  { to: "/users",       icon: UsersRound,      label: "User Management" },
];

const BackgroundArt = () => (
  <svg
    className="pointer-events-none select-none fixed bottom-0 right-0 z-0"
    width="480" height="380" viewBox="0 0 480 380" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
    style={{ opacity: 0.045 }}
  >
    <ellipse cx="120" cy="335" rx="38" ry="12" fill="hsl(158,55%,32%)"/>
    <rect x="104" y="252" width="32" height="74" rx="16" fill="hsl(158,55%,32%)"/>
    <circle cx="120" cy="236" r="20" fill="hsl(158,55%,32%)"/>
    <line x1="136" y1="320" x2="154" y2="342" stroke="hsl(158,55%,32%)" strokeWidth="5" strokeLinecap="round"/>
    <line x1="154" y1="342" x2="163" y2="342" stroke="hsl(158,55%,32%)" strokeWidth="5" strokeLinecap="round"/>
    <path d="M104 272 Q82 290 76 310" stroke="hsl(158,55%,32%)" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <path d="M136 272 Q154 286 148 314" stroke="hsl(158,55%,32%)" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <path d="M268 168 C268 159 255 151 249 162 C243 151 230 159 230 168 C230 181 249 194 249 194 C249 194 268 181 268 168Z" fill="hsl(145,60%,38%)"/>
    <rect x="308" y="248" width="36" height="82" rx="18" fill="hsl(152,52%,35%)"/>
    <circle cx="326" cy="232" r="22" fill="hsl(152,52%,35%)"/>
    <path d="M308 270 Q280 254 266 264" stroke="hsl(152,52%,35%)" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M344 270 Q372 254 386 264" stroke="hsl(152,52%,35%)" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M158 306 Q200 260 258 288" stroke="hsl(145,60%,38%)" strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round"/>
    <path d="M400 110 C400 93 418 84 431 97 C418 97 414 110 400 110Z" fill="hsl(158,60%,36%)"/>
    <line x1="412" y1="110" x2="415" y2="128" stroke="hsl(158,60%,36%)" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="185" cy="92" r="4" fill="hsl(158,60%,36%)"/>
    <circle cx="448" cy="185" r="3" fill="hsl(145,65%,40%)"/>
    <circle cx="290" cy="54" r="5" fill="hsl(172,56%,38%)"/>
    <circle cx="326" cy="232" r="180" stroke="hsl(158,55%,32%)" strokeWidth="1.2" fill="none" strokeDasharray="10 7"/>
  </svg>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const navItems = isAdmin
    ? [...staffNavItems.slice(0, -1), ...adminOnlyNavItems, staffNavItems[staffNavItems.length - 1]]
    : staffNavItems;

  const renderNavItem = (item: typeof staffNavItems[0]) => {
    const isActive = location.pathname === item.to;
    const link = (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${collapsed ? "justify-center" : ""}
          ${isActive
            ? "text-[hsl(145,70%,55%)] border border-[hsl(145,70%,55%)/25%]"
            : "text-[hsl(150,15%,62%)] hover:text-[hsl(150,20%,88%)] hover:bg-white/6"
          }`}
        style={isActive ? {
          background: "linear-gradient(90deg, hsl(145 70% 55% / 0.16), hsl(158 64% 45% / 0.08))",
          boxShadow: "0 2px 8px hsl(145 70% 30% / 0.18)"
        } : {}}
      >
        <item.icon className="w-4 h-4 shrink-0" style={isActive ? { color: "hsl(145,70%,58%)" } : {}} />
        {!collapsed && <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{item.label}</span>}
      </Link>
    );
    if (collapsed) return (
      <Tooltip key={item.to} delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
    return link;
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <BackgroundArt />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 sidebar-glass flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-white/8 shrink-0
          ${collapsed ? "justify-center p-4" : "gap-3 px-5 py-5"}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(145 70% 48%), hsl(158 64% 35%))", boxShadow: "0 4px 12px hsl(145 70% 20% / 0.50)" }}>
            <img src="/favicon.ico" className="w-9 h-9 rounded-xl object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-[15px] font-bold tracking-wide"
                style={{ fontFamily: "Sora, sans-serif", color: "hsl(150 20% 92%)" }}>AGAPO</h1>
              <p className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "hsl(150 15% 55%)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Brgy. San Francisco
              </p>
            </div>
          )}
        </div>

        {/* Nav — staff items */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {staffNavItems.slice(0, -1).map(renderNavItem)}

          {/* Admin-only section */}
          {isAdmin && (
            <>
              {!collapsed && (
                <p className="text-[9px] font-bold uppercase tracking-widest px-3 pt-4 pb-1"
                  style={{ color: "hsl(150 12% 40%)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Admin
                </p>
              )}
              {collapsed && <div className="h-2" />}
              {adminOnlyNavItems.map(renderNavItem)}
            </>
          )}

          {/* Profile always last */}
          {renderNavItem(staffNavItems[staffNavItems.length - 1])}
        </nav>

        {/* Footer */}
        <div className="p-2.5 border-t border-white/8 space-y-1 shrink-0">
          {!collapsed && (
            <div className="px-3 py-2">
              <p className="text-[11px] font-medium truncate"
                style={{ color: "hsl(150 12% 48%)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>{user?.email}</p>
              <p className="text-[11px] font-bold capitalize tracking-wide"
                style={{ color: "hsl(145,70%,55%)", fontFamily: "Sora, sans-serif" }}>{role}</p>
            </div>
          )}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={handleLogout}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200
                  ${collapsed ? "justify-center" : ""}`}
                style={{ color: "hsl(150 15% 55%)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(0 72% 65%)"; (e.currentTarget as HTMLElement).style.background = "hsl(0 72% 51% / 0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(150 15% 55%)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all duration-200 justify-center hover:bg-white/6"
            style={{ color: "hsl(150 12% 46%)" }}>
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="h-14 flex items-center px-4 lg:px-6 sticky top-0 z-20 topbar-glass">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-xs font-bold text-muted-foreground capitalize ml-3 tracking-widest uppercase"
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