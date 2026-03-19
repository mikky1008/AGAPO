import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Admin secret code — set VITE_ADMIN_CODE in your .env to change this
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
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate admin code before doing anything
    if (selectedRole === "admin" && adminCode !== ADMIN_CODE) {
      toast({
        title: "Invalid Admin Code",
        description: "The admin code you entered is incorrect. Contact your barangay administrator.",
        variant: "destructive",
      });
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

    if (error) {
      setLoading(false);
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
      return;
    }

    setLoading(false);
    toast({
      title: "Account Created",
      description: selectedRole === "admin"
        ? "Admin account created. Check your email to confirm."
        : "Staff account created. Check your email to confirm.",
    });
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif text-foreground">AGAPO</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Senior Citizen Information & Assistance Management System
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Barangay San Francisco, Mainit, Surigao del Norte
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            {forgotMode ? (
              <div>
                <h2 className="text-lg font-serif text-foreground mb-1">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mb-4">Enter your email to receive a reset link</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your email" className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotMode(false)}>
                    Back to Sign In
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="pl-10" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-primary hover:underline w-full text-center">
                      Forgot your password?
                    </button>
                  </form>
                </TabsContent>

                {/* Sign Up */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" className="pl-10" required />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" className="pl-10" required />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-10" required minLength={6} />
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(v) => { setSelectedRole(v as "staff" | "admin"); setAdminCode(""); }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {selectedRole === "staff"
                          ? "Staff can view, add, and edit records."
                          : "Administrators have full access including delete."}
                      </p>
                    </div>

                    {/* Admin Code — only shown when Administrator is selected */}
                    {selectedRole === "admin" && (
                      <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/40">
                        <Label htmlFor="admin-code" className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          Admin Verification Code
                        </Label>
                        <Input
                          id="admin-code"
                          type="password"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          placeholder="Enter admin code"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Contact your barangay administrator to get this code.
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading
                        ? "Creating account..."
                        : `Create ${selectedRole === "admin" ? "Admin" : "Staff"} Account`}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Login;
