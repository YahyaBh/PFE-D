"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ChevronRight, Fingerprint } from "lucide-react";
import BiometricOverlay from "@/components/BiometricOverlay";
import Toast from "@/components/ui/Toast";

// Separate component to handle search params
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || "");
  const [showBiometric, setShowBiometric] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.requireMFA) {
        router.push(`/mfa?email=${formData.email}&userId=${data.userId}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
      
      {error && <Toast message={error} onClose={() => setError("")} />}
      
      <div className="max-w-xl w-full relative z-10">
        <div className="p-12 bg-background border-8 border-foreground shadow-[24px_24px_0_0_rgba(0,0,0,1)] dark:shadow-[24px_24px_0_0_white]">
          <div className="mb-12">
            <div className="w-20 h-20 border-4 border-foreground bg-white flex items-center justify-center mb-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-4">
              <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">Welcome Back</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 mt-6">Secure Login Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="stark-input"
                placeholder="YOURNAME@DOMAIN.COM"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Password</label>
                <Link href="#" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot Password?</Link>
              </div>
              <input
                type="password"
                required
                className="stark-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="stark-button w-full py-8 flex items-center justify-center gap-4 mt-6"
            >
              {loading ? "Authorizing..." : <>Login Now <ChevronRight className="w-6 h-6" /></>}
            </button>
          </form>

          <div className="mt-12 pt-12 border-t-4 border-foreground border-dashed">
            <button 
              onClick={() => setShowBiometric(true)}
              className="w-full flex items-center justify-center p-6 border-4 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-all gap-4 font-black uppercase tracking-widest text-xs"
            >
              <Fingerprint className="w-6 h-6" />
              Biometric Sign In
            </button>
          </div>

          <p className="text-center mt-12 text-[10px] font-black uppercase tracking-widest text-foreground/40">
            No account yet?{" "}
            <Link href="/register" className="text-primary hover:underline ml-2">
              Create Account
            </Link>
          </p>
        </div>
        
        {/* Decorative corner tag */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary border-4 border-foreground flex items-center justify-center font-black text-xl rotate-12 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            !
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
