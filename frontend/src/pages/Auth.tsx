import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        // HARDCODED: Redirecting password reset to the live lab domain
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `https://nudgechecklab.com/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email sent", description: "Check your inbox for the password reset link." });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/", { replace: true });
      } else {
        // GATES OPEN: Invite code validation removed.
        // HARDCODED: Redirecting signup confirmation to the live lab domain
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: "https://nudgechecklab.com" 
          },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "Check your email to confirm your account, then log in." });
        setMode("login");
      }
    } catch (err: any) {
      toast({
        title: mode === "forgot" ? "Reset failed" : mode === "login" ? "Login failed" : "Sign up failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === "forgot" ? "RESET PASSWORD" : mode === "login" ? "LOG IN" : "CREATE ACCOUNT";
  const buttonLabel = mode === "forgot" ? "SEND RESET LINK" : mode === "login" ? "LOG IN" : "SIGN UP";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* --- NUDGE CHECK BRANDING --- */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-black italic tracking-tighter uppercase text-foreground">
            Nudge <span className="text-primary">Check</span>
          </h1>
          <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">
            Kicking Performance Lab
          </p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-xl">
          <h2 className="mb-6 text-center font-display text-sm font-bold tracking-widest text-foreground">
            {heading}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block font-display text-[11px] font-semibold tracking-wider text-muted-foreground">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-card-border bg-secondary px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                placeholder="kicker@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="mb-1 block font-display text-[11px] font-semibold tracking-wider text-muted-foreground">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-card-border bg-secondary px-4 py-3 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="self-end font-display text-[11px] tracking-wider text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-primary py-4 font-display text-sm font-bold tracking-wider text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {loading ? "PLEASE WAIT…" : buttonLabel}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-card-border pt-4">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("login")}
                className="font-display text-xs tracking-wider text-muted-foreground hover:text-primary"
              >
                Back to LOG IN
              </button>
            ) : (
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-display text-xs tracking-wider text-muted-foreground hover:text-primary"
              >
                {mode === "login" ? "Need an account? SIGN UP" : "Already have an account? LOG IN"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;