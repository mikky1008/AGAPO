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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account Created", description: "Check your email to confirm your account." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset Link Sent", description: "Check your email for the password reset link." });
      setForgotMode(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(225 35% 94%) 0%, hsl(240 30% 96%) 40%, hsl(262 25% 95%) 100%)",
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(231 70% 60%) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(262 60% 65%) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(200 85% 55%) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-[0_8px_28px_hsl(231_70%_55%/0.40)]"
            style={{ background: "linear-gradient(135deg, hsl(231 70% 55%) 0%, hsl(262 60% 62%) 100%)" }}
          >
            <Heart className="w-8 h-8 text-white drop-shadow" />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "Sora, sans-serif",
              background: "linear-gradient(135deg, hsl(231 70% 50%) 0%, hsl(262 60% 58%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AGAPO
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1.5">
            Senior Citizen Information & Assistance Management
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Barangay San Francisco, Mainit, Surigao del Norte
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border border-white/65"
          style={{
            background: "hsl(0 0% 100% / 0.72)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 8px 32px -4px hsl(231 70% 55% / 0.16), 0 2px 8px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.90)",
          }}
        >
          {forgotMode ? (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "Sora, sans-serif" }}>
                Reset Password
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Enter your email to receive a reset link</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setForgotMode(false)}>
                  ← Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 bg-muted/50 rounded-xl p-1 h-10">
                <TabsTrigger value="login" className="rounded-lg text-xs font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-xs font-semibold">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-sm" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In to AGAPO"}
                  </Button>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs font-semibold text-primary/70 hover:text-primary w-full text-center transition-colors">
                    Forgot your password?
                  </button>
                </form>
              </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-10" required minLength={6} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v as "staff" | "admin"); setAdminCode(""); }}>
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-white/55 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Barangay Staff</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                      {selectedRole === "staff" ? "Staff can view, add, and edit records." : "Administrators have full system access."}
                    </p>
                  </div>
                  {selectedRole === "admin" && (
                    <div
                      className="space-y-2 rounded-xl p-3.5"
                      style={{
                        background: "hsl(231 70% 55% / 0.06)",
                        border: "1px solid hsl(231 70% 55% / 0.18)",
                      }}
                    >
                      <Label htmlFor="admin-code" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Admin Verification Code
                      </Label>
                      <Input id="admin-code" type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Enter admin code" required />
                      <p className="text-[11px] text-muted-foreground/70">Contact your barangay administrator to obtain this code.</p>
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
