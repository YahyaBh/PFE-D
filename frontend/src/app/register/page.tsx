"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, UserCircle2, CheckCircle2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import Toast from "@/components/ui/Toast";
import dynamic from "next/dynamic";

const FaceAuth = dynamic(() => import("@/components/FaceAuth"), { ssr: false });


export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "face">("info");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("face");
  };

  const handleFaceCapture = (descriptor: number[]) => {
    setFaceDescriptor(descriptor);
  };

  const handleSubmit = async () => {
    if (!faceDescriptor) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, faceDescriptor }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push(`/verify?userId=${data.user.id}&step=email`);
    } catch (err: any) {
      setError(err.message);
      setStep("info"); // Go back to fix info or retry
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
      
      <div className="max-w-2xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="fluid-glass rounded-[3rem] p-12 md:p-16 border border-white/20 shadow-2xl space-y-12">
          {/* Header & Logo */}
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto p-5 shadow-xl shadow-primary/10 hover:rotate-[360deg] transition-all duration-1000">
              <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                  {step === "info" ? "Establish Identity" : "Secure Node"}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/30">
                  {step === "info" 
                    ? "Initialize your new digital wallet" 
                    : "Biometric enrollment v2.0 active"}
                </p>
            </div>
          </div>

          {step === "info" ? (
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-6">
                      <span className="w-2 h-2 rounded-full bg-primary/20" />
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Legal Name</label>
                  </div>
                  <input
                    type="text"
                    required
                    className="fluid-input"
                    placeholder="ENTER NAME"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-6">
                      <span className="w-2 h-2 rounded-full bg-primary/20" />
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Email Handle</label>
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
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                    <span className="w-2 h-2 rounded-full bg-primary/20" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Phone Frequency</label>
                </div>
                <PhoneInput
                  required
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                    <span className="w-2 h-2 rounded-full bg-primary/20" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Secure Access Key</label>
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
                className="fluid-button w-full h-20 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 mt-4"
              >
                Next Step: Biometrics <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
              <div className="rounded-[3rem] overflow-hidden relative group border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md">
                <FaceAuth mode="register" onCapture={handleFaceCapture} />
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 animate-pulse" />
              </div>
              
              <div className="space-y-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !faceDescriptor}
                  className="fluid-button w-full h-20 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase shadow-2xl shadow-primary/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Establish Connection <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>
                
                <button
                  onClick={() => setStep("info")}
                  className="w-full text-foreground/30 hover:text-primary text-[10px] font-black uppercase tracking-[0.5em] transition-all py-2"
                >
                  Return to Matrix Data
                </button>
              </div>
            </div>
          )}

          <div className="pt-12 flex flex-col items-center gap-6 border-t border-foreground/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">
                    Already a recognized entity?
                </p>
                <Link 
                    href="/login" 
                    className="px-12 py-4 rounded-full bg-foreground/5 text-foreground font-black uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-all"
                >
                    Sign In Portal
                </Link>
          </div>
        </div>
        
        {/* Subtle Decorative Flow */}
        <div className="mt-12 text-center opacity-20 pointer-events-none">
            <p className="text-[8px] font-black uppercase tracking-[1em]">MARJANE // SECURE // ENROLLMENT</p>
        </div>
      </div>
    </div>
  );
}

