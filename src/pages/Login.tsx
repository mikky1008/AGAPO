import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "goldenreg-admin-2025";

// ── Inject login styles once ──────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("goldenreg-login-styles")) {
  const s = document.createElement("style");
  s.id = "goldenreg-login-styles";
  s.textContent = `
    @keyframes glowPulse {
      0%   { box-shadow: 0 8px 40px rgba(0,0,0,0.70),
                         0 0  20px rgba(160,10,10,0.20),
                         inset 0 1px 0 rgba(255,255,255,0.12); }
      50%  { box-shadow: 0 12px 60px rgba(0,0,0,0.75),
                         0 0  55px rgba(190,20,20,0.40),
                         0 0 100px rgba(220,40,40,0.15),
                         inset 0 1px 0 rgba(255,255,255,0.18); }
      100% { box-shadow: 0 8px 40px rgba(0,0,0,0.70),
                         0 0  20px rgba(160,10,10,0.20),
                         inset 0 1px 0 rgba(255,255,255,0.12); }
    }
    @keyframes borderBreath {
      0%   { border-color: rgba(255,255,255,0.15); }
      50%  { border-color: rgba(200,35,35,0.55); }
      100% { border-color: rgba(255,255,255,0.15); }
    }
    @keyframes shimmerSweep {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }

    /* The glass login panel — char-furniture style */
    .gr-glass-login {
      background: rgba(12, 2, 2, 0.42);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 28px;
      position: relative;
      overflow: hidden;
      animation: glowPulse 5s ease-in-out infinite,
                 borderBreath 5s ease-in-out infinite;
    }
    .gr-glass-login::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 30%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,200,150,0.65), transparent);
      animation: shimmerSweep 4s linear infinite;
      pointer-events: none;
    }
    .gr-glass-login::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 28px;
      background: linear-gradient(
        135deg,
        rgba(255,255,255,0.06) 0%,
        rgba(255,255,255,0.00) 40%,
        rgba(180,80,20,0.05) 100%
      );
      pointer-events: none;
    }

    /* Input fields */
    .gr-input-glass {
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 12px;
      color: #ffffff;
      font-size: 14px;
      padding: 12px 16px 12px 40px;
      outline: none;
      transition: all 0.2s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .gr-input-glass::placeholder { color: rgba(255, 255, 255, 0.50); }
    .gr-input-glass:focus {
      background: rgba(255, 255, 255, 0.13);
      border-color: rgba(200, 80, 30, 0.65);
      box-shadow: 0 0 0 3px rgba(190, 50, 20, 0.20);
    }
    .gr-input-glass.has-error { border-color: rgba(248, 100, 100, 0.70); }
    .gr-input-glass.pr-icon { padding-right: 40px; }

    /* Tab styles */
    .gr-tab[data-state="active"] {
      background: rgba(255,255,255,0.13) !important;
      color: #ffffff !important;
    }
    .gr-tab[data-state="inactive"] {
      color: rgba(255,255,255,0.50) !important;
    }
  `;
  document.head.appendChild(s);
}

// ── Sub-components ────────────────────────────────────────────────────────────
const PwToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
  <button
    type="button" onClick={toggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/90 transition-colors z-10"
  >
    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-300/90 mt-1 pl-1">{msg}</p> : null;

const PrimaryBtn = ({
  children, type = "button", disabled, onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <button
    type={type} disabled={disabled} onClick={onClick}
    className="w-full py-3 rounded-[14px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
    style={{ background: "var(--gradient-button)", boxShadow: "var(--shadow-button)" }}
  >
    {children}
  </button>
);

/**
 * Background: Unsplash luxury interior photo (Roberto Nickson)
 * Multi-layer overlay for drama + brand crimson palette
 */
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1776653096575-0898bcd8b9e9?w=1920&q=90&fit=crop&crop=center')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* Layer 1: Deep crimson tint */}
    <div className="absolute inset-0" style={{
      background: "linear-gradient(135deg, rgba(60,0,0,0.72) 0%, rgba(20,0,0,0.50) 50%, rgba(50,0,0,0.78) 100%)",
    }} />
    {/* Layer 2: Bottom-up dark gradient */}
    <div className="absolute inset-0" style={{
      background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
    }} />
    {/* Layer 3: Top cinematic shadow */}
    <div className="absolute inset-0" style={{
      background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%)",
    }} />
    {/* Layer 4: Edge vignette */}
    <div className="absolute inset-0" style={{
      background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 40%, rgba(0,0,0,0.60) 100%)",
    }} />
    <div className="relative z-10 w-full flex justify-center">{children}</div>
  </div>
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
  const [signupEmail2,   setSignupEmail2]   = useState("");
  const [signupErrs,     setSignupErrs]     = useState<Record<string,string>>({});

  /* ── Forgot password ── */
  const [forgotMode,   setForgotMode]   = useState(false);
  const [forgotEmail,  setForgotEmail]  = useState("");
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
    if (!fullName.trim())              errs.fullName  = "Full name is required.";
    if (!signupEmail.trim())           errs.email     = "Email is required.";
    if (signupPassword.length < 6)     errs.password  = "Password must be at least 6 characters.";
    if (signupPassword !== confirmPw)  errs.confirmPw = "Passwords do not match.";
    if (adminCode !== ADMIN_CODE)      errs.adminCode = "Invalid admin code.";
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
      setSignupEmail2(signupEmail);
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
      <PageWrapper>
        <div className="gr-glass-login p-8 w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white drop-shadow-md">Check your email</h2>
            <p className="text-sm text-white/65 mt-2">
              Confirmation sent to <strong className="text-white">{signupEmail2}</strong>.{" "}
              Verify before signing in.
            </p>
          </div>
          <PrimaryBtn type="button" onClick={() => { setSignupSuccess(false); setActiveTab("login"); }}>
            Back to Sign In
          </PrimaryBtn>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="gr-glass-login p-8 w-full max-w-md space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8B1A10 0%, #C9933A 100%)",
              boxShadow: "0 8px 28px rgba(139,26,16,0.60)",
            }}>
            <Star className="w-8 h-8 text-white drop-shadow" fill="white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "Sora, sans-serif" }}>
              GoldenReg
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                <input
                  type="email" placeholder="Email address"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  className="gr-input-glass" required
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
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <TabsTrigger value="login"  className="gr-tab rounded-[10px] text-sm font-semibold transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="gr-tab rounded-[10px] text-sm font-semibold transition-all">Create Account</TabsTrigger>
            </TabsList>

            {/* ══ SIGN IN ══ */}
            <TabsContent value="login" className="mt-5 space-y-4">
              {loginSuccess && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-green-300"
                  style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.28)" }}>
                  <CheckCircle className="w-4 h-4 shrink-0" /> Login successful. Redirecting…
                </div>
              )}
              {loginErrs.general && (
                <p className="text-sm text-red-300 font-medium text-center drop-shadow">{loginErrs.general}</p>
              )}
              <form onSubmit={handleLogin} className="space-y-3" noValidate>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type="email" placeholder="Email address" value={loginEmail}
                      onChange={e => { setLoginEmail(e.target.value); setLoginErrs(p => ({...p, email: "", general: ""})); }}
                      className={`gr-input-glass ${loginErrs.email ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={loginErrs.email} />
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type={showLoginPw ? "text" : "password"} placeholder="Password" value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginErrs(p => ({...p, password: "", general: ""})); }}
                      className={`gr-input-glass pr-icon ${loginErrs.password ? "has-error" : ""}`} />
                    <PwToggle show={showLoginPw} toggle={() => setShowLoginPw(p => !p)} />
                  </div>
                  <FieldError msg={loginErrs.password} />
                </div>
                <PrimaryBtn type="submit" disabled={signingIn}>
                  {signingIn ? "Signing in…" : "Sign In to GoldenReg"}
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
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: "var(--gradient-button)" }}>
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Admin Account
                </div>

                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type="text" placeholder="Full Name *" value={fullName}
                      onChange={e => setFullName(e.target.value)} maxLength={100}
                      className={`gr-input-glass ${signupErrs.fullName ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.fullName} />
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type="email" placeholder="Email address *" value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      className={`gr-input-glass ${signupErrs.email ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.email} />
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type={showSignupPw ? "text" : "password"} placeholder="Password (min 6 chars) *"
                      value={signupPassword} onChange={e => setSignupPassword(e.target.value)} minLength={6}
                      className={`gr-input-glass pr-icon ${signupErrs.password ? "has-error" : ""}`} />
                    <PwToggle show={showSignupPw} toggle={() => setShowSignupPw(p => !p)} />
                  </div>
                  <FieldError msg={signupErrs.password} />
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type={showConfirmPw ? "text" : "password"} placeholder="Confirm Password *"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      className={`gr-input-glass pr-icon ${signupErrs.confirmPw ? "has-error" : ""}`} />
                    <PwToggle show={showConfirmPw} toggle={() => setShowConfirmPw(p => !p)} />
                  </div>
                  <FieldError msg={signupErrs.confirmPw} />
                </div>

                <div className="rounded-xl p-4 space-y-2" style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${signupErrs.adminCode ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.11)"}`,
                }}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                    Admin Verification Code *
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none z-10" />
                    <input type="password" placeholder="Enter admin code" value={adminCode}
                      onChange={e => setAdminCode(e.target.value)}
                      className={`gr-input-glass ${signupErrs.adminCode ? "has-error" : ""}`} />
                  </div>
                  <FieldError msg={signupErrs.adminCode} />
                  <p className="text-[11px] text-white/40">Contact your administrator to get this code.</p>
                </div>

                <PrimaryBtn type="submit" disabled={signingUp}>
                  {signingUp ? "Creating account…" : "Create Account"}
                </PrimaryBtn>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageWrapper>
  );
};

export default Login;