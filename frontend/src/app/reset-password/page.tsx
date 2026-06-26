"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, ChevronRight, Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { api } from "@/lib/api";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/reset-password", { token, password });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-6 relative overflow-hidden bg-zellige-soft">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[150px]" />

      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="fluid-glass rounded-[3rem] p-12 md:p-16 border border-white/20 shadow-2xl space-y-12">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mx-auto p-5 shadow-xl shadow-primary/10">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                New <span className="text-primary italic">Password</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/30">Secure Your Account</p>
            </div>
          </div>

          {success ? (
            <div className="text-center space-y-8 animate-in fade-in duration-700">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-4">
                <p className="text-2xl font-black uppercase tracking-tight">Password Updated</p>
                <p className="text-[11px] font-medium text-foreground/40 leading-relaxed max-w-sm mx-auto">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                  <span className="w-2 h-2 rounded-full bg-primary/20" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">New Password</label>
                </div>
                <input
                  type="password"
                  required
                  className="fluid-input"
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                  <span className="w-2 h-2 rounded-full bg-primary/20" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Confirm Password</label>
                </div>
                <input
                  type="password"
                  required
                  className="fluid-input"
                  placeholder="••••••••"
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fluid-button w-full h-20 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-2xl shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>Update Password <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="mt-12 text-center opacity-20 pointer-events-none">
          <p className="text-[8px] font-black uppercase tracking-[1em]">MARJANE // WEB3 // WALLET</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ResetContent />
    </Suspense>
  );
}
