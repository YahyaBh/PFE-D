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
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-6 relative overflow-hidden bg-zellige-soft">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[150px]" />
      
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}
      
      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="fluid-glass rounded-[3rem] p-12 md:p-16 border border-white/20 shadow-2xl space-y-12">
          {/* Header & Logo */}
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto p-5 shadow-xl shadow-primary/10 hover:rotate-[360deg] transition-all duration-1000">
              <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                    Welcome <span className="text-primary italic">Back</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/30">Secure Authentication Protocol</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-6">
                  <span className="w-2 h-2 rounded-full bg-primary/20" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Email Identity</label>
              </div>
              <input
                type="email"
                required
                className="fluid-input"
                placeholder="YOURNAME@DOMAIN.COM"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary/20" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Security Key</label>
                </div>
                <Link href="#" className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-colors">Recover Access</Link>
              </div>
              <input
                type="password"
                required
                className="fluid-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fluid-button w-full h-20 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-2xl shadow-primary/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Enter Portal <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Biometric Integration */}
          <div className="pt-8 space-y-8 border-t border-foreground/5">
            <button 
              onClick={() => setShowBiometric(true)}
              className="w-full h-20 rounded-full bg-foreground/5 text-foreground flex items-center justify-center gap-5 hover:bg-foreground hover:text-background transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Fingerprint className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
              <span className="font-black uppercase tracking-widest text-[11px] relative z-10">Biometric Sign In</span>
            </button>

            <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">
                    New to Marjane Ecosystem?
                </p>
                <Link 
                    href="/register" 
                    className="px-10 py-4 rounded-full border border-primary/10 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all"
                >
                    Create Identity
                </Link>
            </div>
          </div>
        </div>
        
        {/* Subtle Decorative Flow */}
        <div className="mt-12 text-center opacity-20 pointer-events-none">
            <p className="text-[8px] font-black uppercase tracking-[1em]">MARJANE // WEB3 // WALLET</p>
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
