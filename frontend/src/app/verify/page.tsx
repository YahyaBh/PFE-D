"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Mail, Phone, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "@/lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const initialStep = (searchParams.get("step") as "email" | "phone") || "email";

  const [step, setStep] = useState<"email" | "phone">(initialStep);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push("/register");
    }
  }, [userId, router]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/verify-token", { userId, type: step, code: code.toUpperCase() });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setSuccess(true);
      
      // Delay to show success state
      setTimeout(() => {
        if (step === "email" && !data.isPhoneVerified) {
          setStep("phone");
          setCode("");
          setSuccess(false);
          router.push(`/verify?userId=${userId}&step=phone`);
        } else {
          // If both verified or it was the phone step, go to dashboard
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await api.post("/auth/resend-verification", { userId, type: step });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 6);
    setCode(val);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
      {error && <Toast message={error} onClose={() => setError("")} />}
      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-card mb-8 border border-foreground/5 relative shadow-xl p-4">
          <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
             {step === "email" ? <Mail className="w-4 h-4 text-primary" /> : <Phone className="w-4 h-4 text-primary" />}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          Verify your {step}
        </h1>
        <p className="text-muted-foreground mb-10 px-6 font-medium">
          We've sent a 6-character code to your {step}. Please enter it below to secure your account.
        </p>

        <form onSubmit={handleVerify} className="space-y-6">

          <div className="relative group">
            <input
              autoFocus
              type="text"
              placeholder="A1B2C3"
              className={cn(
                "w-full bg-card/50 border rounded-[2rem] py-6 text-center text-4xl font-black tracking-[1em] text-foreground placeholder:text-muted-foreground/10 focus:outline-none transition-all uppercase",
                success ? "border-green-500/50 bg-green-500/5 ring-4 ring-green-500/10" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
              )}
              value={code}
              onChange={handleCodeChange}
              disabled={loading || success}
            />
            {success && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6 || success}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-primary/20 flex items-center justify-center group transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : success ? (
              "Verified!"
            ) : (
              <>
                Confirm {step === "email" ? "Email" : "Phone"} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-border flex flex-col items-center gap-4">
           <p className="text-muted-foreground text-sm font-medium">Didn't receive the code?</p>
           <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-[11px] transition-colors disabled:opacity-30"
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
           By continuing, you help us ensure your Marjane Wallet remains protected against unauthorized access.
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
       </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
