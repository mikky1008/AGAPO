import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, Lock, Mail, ShieldCheck, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "agapo-admin-2025";

// ── Inject login styles once ──────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("agapo-login-styles")) {
  const s = document.createElement("style");
  s.id = "agapo-login-styles";
  s.textContent = `
    .agapo-login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg,
        hsl(160 50% 8%) 0%,
        hsl(155 55% 12%) 25%,
        hsl(145 60% 10%) 50%,
        hsl(158 52% 7%) 75%,
        hsl(162 48% 9%) 100%);
      background-size: 300% 300%;
      animation: loginBgFloat 12s ease-in-out infinite;
    }
    .agapo-orb-1 {
      position: absolute; top: -120px; left: -120px;
      width: 480px; height: 480px; border-radius: 50%;
      background: radial-gradient(circle, hsl(145 70% 40% / 0.28) 0%, transparent 70%);
      pointer-events: none;
    }
    .agapo-orb-2 {
      position: absolute; bottom: -100px; right: -100px;
      width: 420px; height: 420px; border-radius: 50%;
      background: radial-gradient(circle, hsl(158 64% 35% / 0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .agapo-orb-3 {
      position: absolute; top: 40%; left: 60%;
      width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, hsl(172 60% 42% / 0.14) 0%, transparent 70%);
      pointer-events: none;
    }
    /* The main glass login panel */
    .agapo-glass-login {
      background: rgba(10, 24, 15, 0.48);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 28px;
      position: relative;
      overflow: hidden;
      animation: glowPulse 5s ease-in-out infinite, borderBreath 5s ease-in-out infinite;
    }
    .agapo-glass-login::before {
      content: '';
      position: absolute; top: 0; left: 0;
      width: 30%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(134,239,172,0.55), transparent);
      animation: shimmerSweep 4s linear infinite;
      pointer-events: none;
    }
    .agapo-glass-login::after {
      content: '';
      position: absolute; inset: 0;
      border-radius: 28px;
      background: linear-gradient(135deg,
        rgba(255,255,255,0.055) 0%,
        rgba(255,255,255,0.000) 40%,
        rgba(20,100,50,0.04) 100%);
      pointer-events: none;
    }
    /* Glass inputs */
    .agapo-input-glass {
      width: 100%;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 12px;
      color: #ffffff;
      font-size: 14px;
      padding: 12px 16px 12px 42px;
      outline: none;
      transition: all 0.2s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .agapo-input-glass::placeholder { color: rgba(255,255,255,0.40); }
    .agapo-input-glass:focus {
      background: rgba(255,255,255,0.11);
      border-color: rgba(74,222,128,0.55);
      box-shadow: 0 0 0 3px rgba(74,222,128,0.14);
    }
    .agapo-input-glass.has-error {
      border-color: rgba(248,113,113,0.65);
    }
    .agapo-input-glass.pr-icon { padding-right: 40px; }
    /* Tab styles */
    .agapo-tab[data-state="active"] {
      background: rgba(255,255,255,0.11) !important;
      color: #ffffff !important;
    }
    .agapo-tab[data-state="inactive"] {
      color: rgba(255,255,255,0.45) !important;
    }
  `;
  document.head.appendChild(s);
}

// ── Sub-components ────────────────────────────────────────────────────────────
const PwToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
  <button
    type="button" onClick={toggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/85 transition-colors z-10"
  >
    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-300/85 mt-1 pl-1">{msg}</p> : null;

const PrimaryBtn = ({
  children, type = "button", disabled,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) => (
  <button
    type={type} disabled={disabled}
    className="w-full py-3 rounded-[14px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
    style={{ background: "var(--gradient-button)", boxShadow: "var(--shadow-button)" }}
  >
    {children}
  </button>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  /* ── Sign In state ── */
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [signingIn,     setSigningIn]     = useState(false);
  const [loginSuccess,  setLoginSuccess]  = useState(false);
  const [loginErrs,     setLoginErrs]     = useState<Record<string,string>>({});

  /* ── Sign Up state ── */
  const [fullName,       setFullName]       = useState("");
  const [signupEmail,    setSignupEmail]    = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPw,      setConfirmPw]      = useState("");
  const selectedRole = "admin" as const;
  const [adminCode,      setAdminCode]      = useState("");
  const [showSignupPw,   setShowSignupPw]   = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [signingUp,      setSigningUp]      = useState(false);
  const [signupSuccess,  setSignupSuccess]  = useState(false);
  const [signupErrs,     setSignupErrs]     = useState<Record<string,string>>({});

  /* ── Forgot password ── */
  const [forgotMode,  setForgotMode]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!loginEmail.trim())  errs.email    = "Please enter your email.";
    if (!loginPassword)      errs.password = "Please enter your password.";
    setLoginErrs(errs);
    if (Object.keys(errs).length) return;
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setSigningIn(false);
    if (error) {
      setLoginErrs({ general: "Invalid email or password." });
    } else {
      setLoginSuccess(true);
      setTimeout(() => navigate("/dashboard"), 800);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!fullName.trim())              errs.fullName   = "Full name is required.";
    if (!signupEmail.trim())           errs.email      = "Email is required.";
    if (signupPassword.length < 6)     errs.password   = "Password must be at least 6 characters.";
    if (signupPassword !== confirmPw)  errs.confirmPw  = "Passwords do not match.";
    if (selectedRole === "admin" && adminCode !== ADMIN_CODE)
                                       errs.adminCode  = "Invalid admin code.";
    setSignupErrs(errs);
    if (Object.keys(errs).length) return;
    setSigningUp(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: fullName.trim(), role: selectedRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setSigningUp(false);
    if (error) {
      setSignupErrs({ general: error.message });
    } else {
      setSignupSuccess(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset Link Sent", description: "Check your email for the password reset link." });
      setForgotMode(false);
    }
  };

  // ── Signup success screen ──
  if (signupSuccess) {
    return (
      <div className="agapo-login-bg">
        <div className="agapo-orb-1" /><div className="agapo-orb-2" /><div className="agapo-orb-3" />
        <div className="agapo-glass-login p-8 w-full max-w-md text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.16)" }}>
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-sm text-white/60 mt-2">
              Confirmation sent to <strong className="text-white">{signupEmail}</strong>.
              Verify before signing in.
            </p>
          </div>
          <PrimaryBtn type="button" onClick={() => { setSignupSuccess(false); setActiveTab("login"); }}>
            Back to Sign In
          </PrimaryBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="agapo-login-bg">
      <div className="agapo-orb-1" /><div className="agapo-orb-2" /><div className="agapo-orb-3" />

      <div className="agapo-glass-login p-8 w-full max-w-md space-y-6 relative z-10">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(145 70% 38%) 0%, hsl(158 64% 28%) 100%)",
              boxShadow: "0 8px 28px hsl(158 64% 20% / 0.55)",
            }}>
            <Heart className="w-8 h-8 text-white drop-shadow" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "Sora, sans-serif" }}>
              AGAPO
            </h1>
            <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Barangay San Francisco, Mainit, Surigao del Norte
            </p>
          </div>
        </div>

        {/* Forgot password mode */}
        {forgotMode ? (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-base font-semibold text-white">Reset Password</h2>
              <p className="text-xs text-white/50 mt-1">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                <input
                  type="email" placeholder="Email address"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  className="agapo-input-glass" required
                />
              </div>
              <PrimaryBtn type="submit" disabled={sendingReset}>
                {sendingReset ? "Sending…" : "Send Reset Link"}
              </PrimaryBtn>
              <button type="button" onClick={() => setForgotMode(false)}
                className="w-full text-xs text-white/45 hover:text-white/80 transition-colors text-center pt-1">
                ← Back to Sign In
              </button>
            </form>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setLoginErrs({}); setSignupErrs({}); }}>
            <TabsList
              className="grid grid-cols-2 w-full rounded-xl p-1 gap-1"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <TabsTrigger value="login"  className="agapo-tab rounded-[10px] text-sm font-semibold transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="agapo-tab rounded-[10px] text-sm font-semibold transition-all">Create Account</TabsTrigger>
            </TabsList>

            {/* ══ SIGN IN ══ */}
            <TabsContent value="login" className="mt-5 space-y-4">
              {loginSuccess && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-300"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <CheckCircle className="w-4 h-4 shrink-0" /> Login successful. Redirecting…
                </div>
              )}
              {loginErrs.general && (
                <p className="text-sm text-red-300 font-medium text-center">{loginErrs.general}</p>
              )}
              <form onSubmit={handleLogin} className="space-y-3" noValidate>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type="email" placeholder="Email address" value={loginEmail}
                      onChange={e => { setLoginEmail(e.target.value); setLoginErrs(p => ({...p, email: "", general: ""})); }}
                      className={`agapo-input-glass ${loginErrs.email ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={loginErrs.email} />
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type={showLoginPw ? "text" : "password"} placeholder="Password" value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginErrs(p => ({...p, password: "", general: ""})); }}
                      className={`agapo-input-glass pr-icon ${loginErrs.password ? "has-error" : ""}`} />
                    <PwToggle show={showLoginPw} toggle={() => setShowLoginPw(p => !p)} />
                  </div>
                  <FieldError msg={loginErrs.password} />
                </div>
                <PrimaryBtn type="submit" disabled={signingIn}>
                  {signingIn ? "Signing in…" : "Sign In to AGAPO"}
                </PrimaryBtn>
                <button type="button" onClick={() => setForgotMode(true)}
                  className="w-full text-xs text-white/40 hover:text-white/75 transition-colors text-center pt-0.5">
                  Forgot your password?
                </button>
              </form>
            </TabsContent>

            {/* ══ SIGN UP ══ */}
            <TabsContent value="signup" className="mt-5 space-y-3">
              {signupErrs.general && (
                <p className="text-sm text-red-300 text-center">{signupErrs.general}</p>
              )}
              <form onSubmit={handleSignup} className="space-y-3" noValidate>
                {/* Full Name */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type="text" placeholder="Full Name *" value={fullName}
                      onChange={e => setFullName(e.target.value)} maxLength={100}
                      className={`agapo-input-glass ${signupErrs.fullName ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.fullName} />
                </div>

                {/* Email */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type="email" placeholder="Email address *" value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      className={`agapo-input-glass ${signupErrs.email ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.email} />
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type={showSignupPw ? "text" : "password"} placeholder="Password (min 6 chars) *"
                      value={signupPassword} onChange={e => setSignupPassword(e.target.value)} minLength={6}
                      className={`agapo-input-glass pr-icon ${signupErrs.password ? "has-error" : ""}`} />
                    <PwToggle show={showSignupPw} toggle={() => setShowSignupPw(p => !p)} />
                  </div>
                  <FieldError msg={signupErrs.password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type={showConfirmPw ? "text" : "password"} placeholder="Confirm Password *"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      className={`agapo-input-glass pr-icon ${signupErrs.confirmPw ? "has-error" : ""}`} />
                    <PwToggle show={showConfirmPw} toggle={() => setShowConfirmPw(p => !p)} />
                  </div>
                  <FieldError msg={signupErrs.confirmPw} />
                </div>

                {/* Admin code — always required, only admins can self-register */}
                <div className="rounded-xl p-3.5 space-y-2"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${signupErrs.adminCode ? "rgba(248,113,113,0.50)" : "rgba(255,255,255,0.10)"}`,
                  }}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    Admin Verification Code
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none z-10" />
                    <input type="password" placeholder="Enter admin code" value={adminCode}
                      onChange={e => setAdminCode(e.target.value)}
                      className={`agapo-input-glass ${signupErrs.adminCode ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.adminCode} />
                  <p className="text-[11px] text-white/35">Only administrators can self-register. Staff accounts are created by an admin.</p>
                </div>

                <PrimaryBtn type="submit" disabled={signingUp}>
                  {signingUp ? "Creating account…" : "Create Admin Account"}
                </PrimaryBtn>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Login;