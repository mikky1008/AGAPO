import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "agapo-admin-2025";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"staff" | "admin">("staff");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Login Failed", description: error.message, variant: "destructive" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "admin" && adminCode !== ADMIN_CODE) {
      toast({ title: "Invalid Admin Code", description: "Contact your barangay administrator.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: selectedRole }, emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (error) toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Account Created", description: "Check your email to confirm your account." });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Reset Link Sent", description: "Check your email for the password reset link." }); setForgotMode(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, hsl(150 28% 95%) 0%, hsl(162 24% 96%) 50%, hsl(145 22% 94%) 100%)" }}>

      {/* Background ambient orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(158 64% 40%) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(145 72% 44%) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-14 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(172 60% 42%) 0%, transparent 70%)" }} />

      {/* Senior-care themed SVG art — bottom left */}
      <svg className="absolute bottom-0 left-0 opacity-[0.065] pointer-events-none select-none"
        width="340" height="280" viewBox="0 0 340 280" fill="none" aria-hidden="true">
        <circle cx="90" cy="220" r="15" fill="hsl(158,55%,35%)"/>
        <rect x="76" y="170" width="28" height="55" rx="14" fill="hsl(158,55%,35%)"/>
        <line x1="104" y1="230" x2="118" y2="250" stroke="hsl(158,55%,35%)" strokeWidth="4" strokeLinecap="round"/>
        <line x1="118" y1="250" x2="126" y2="250" stroke="hsl(158,55%,35%)" strokeWidth="4" strokeLinecap="round"/>
        <path d="M76 192 Q58 205 52 220" stroke="hsl(158,55%,35%)" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M104 192 Q120 202 115 222" stroke="hsl(158,55%,35%)" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M195 140 C195 132 183 125 178 134 C173 125 161 132 161 140 C161 152 178 163 178 163 C178 163 195 152 195 140 Z" fill="hsl(145,65%,42%)" opacity="0.8"/>
        <path d="M230 90 C230 74 248 65 261 78 C248 78 244 90 230 90 Z" fill="hsl(158,64%,38%)" opacity="0.7"/>
        <line x1="242" y1="90" x2="245" y2="108" stroke="hsl(158,64%,38%)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
        <circle cx="310" cy="60" r="4" fill="hsl(145,72%,44%)" opacity="0.5"/>
        <circle cx="50" cy="80" r="3" fill="hsl(172,60%,40%)" opacity="0.4"/>
      </svg>

      {/* Top right corner art */}
      <svg className="absolute top-0 right-0 opacity-[0.055] pointer-events-none select-none"
        width="260" height="220" viewBox="0 0 260 220" fill="none" aria-hidden="true">
        <path d="M170 60 C170 44 188 35 201 48 C188 48 184 60 170 60 Z" fill="hsl(158,64%,38%)" opacity="0.8"/>
        <line x1="182" y1="60" x2="185" y2="78" stroke="hsl(158,64%,38%)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <path d="M230 120 C230 108 218 100 213 109 C208 100 196 108 196 120 C196 132 213 142 213 142 C213 142 230 132 230 120Z" fill="hsl(145,65%,42%)" opacity="0.6"/>
        <circle cx="80" cy="40" r="16" fill="hsl(158,55%,35%)" opacity="0.5"/>
        <rect x="68" y="56" width="24" height="46" rx="12" fill="hsl(158,55%,35%)" opacity="0.5"/>
        <circle cx="130" cy="180" r="3" fill="hsl(172,60%,40%)" opacity="0.4"/>
        <circle cx="220" cy="30" r="4" fill="hsl(145,72%,44%)" opacity="0.45"/>
      </svg>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-[0_8px_28px_hsl(158_64%_38%/0.42)]"
            style={{ background: "linear-gradient(135deg, hsl(158 64% 38%) 0%, hsl(145 72% 44%) 100%)" }}>
            <Heart className="w-8 h-8 text-white drop-shadow" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{
            fontFamily: "Sora, sans-serif",
            background: "linear-gradient(135deg, hsl(158 64% 32%) 0%, hsl(145 72% 40%) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>AGAPO</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1.5"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Senior Citizen Information & Assistance Management
          </p>
          <p className="text-xs text-muted-foreground/65 mt-0.5"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Barangay San Francisco, Mainit, Surigao del Norte
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 border border-white/68"
          style={{
            background: "hsl(0 0% 100% / 0.72)",
            backdropFilter: "blur(24px) saturate(175%)", WebkitBackdropFilter: "blur(24px) saturate(175%)",
            boxShadow: "0 8px 32px -4px hsl(158 64% 38% / 0.16), 0 2px 8px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.92)",
          }}>
          {forgotMode ? (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Reset Password</h2>
              <p className="text-sm text-muted-foreground mb-5" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Enter your email to receive a reset link</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="field-label">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                    <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send Reset Link"}</Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setForgotMode(false)}>← Back to Sign In</Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 bg-muted/52 rounded-xl p-1 h-10">
                <TabsTrigger value="login" className="rounded-lg text-xs font-semibold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-xs font-semibold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="field-label">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                      <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="field-label">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                      <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-sm" disabled={loading}>{loading ? "Signing in…" : "Sign In to AGAPO"}</Button>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs font-semibold text-primary/72 hover:text-primary w-full text-center transition-colors"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Forgot your password?</button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="field-label">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                      <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="field-label">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="field-label">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/58" />
                      <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-10" required minLength={6} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="field-label">Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v as "staff" | "admin"); setAdminCode(""); }}>
                      <SelectTrigger className="bg-white/62 backdrop-blur-sm border-white/58 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Barangay Staff</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground/68 leading-relaxed"
                      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      {selectedRole === "staff" ? "Staff can view, add, and edit records." : "Administrators have full system access."}
                    </p>
                  </div>
                  {selectedRole === "admin" && (
                    <div className="space-y-2 rounded-xl p-3.5"
                      style={{ background: "hsl(158 64% 38% / 0.07)", border: "1px solid hsl(158 64% 38% / 0.20)" }}>
                      <Label htmlFor="admin-code" className="flex items-center gap-1.5 field-label">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />Admin Verification Code
                      </Label>
                      <Input id="admin-code" type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Enter admin code" required />
                      <p className="text-[11px] text-muted-foreground/68" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        Contact your barangay administrator to obtain this code.
                      </p>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11 text-sm" disabled={loading}>
                    {loading ? "Creating account…" : `Create ${selectedRole === "admin" ? "Admin" : "Staff"} Account`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
