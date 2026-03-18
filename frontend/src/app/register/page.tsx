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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-secondary/5 skew-x-12 -translate-x-1/2" />
      
      {error && <Toast message={error} onClose={() => setError("")} />}
      
      <div className="max-w-2xl w-full relative z-10">
        <div className="p-12 bg-background border-8 border-foreground shadow-[24px_24px_0_0_rgba(0,0,0,1)] dark:shadow-[24px_24px_0_0_white]">
          <div className="mb-12">
            <div className="w-20 h-20 border-4 border-foreground bg-white flex items-center justify-center mb-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-4">
              <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
              {step === "info" ? "Create Account" : "Secure Identity"}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 mt-6">
              {step === "info" 
                ? "Initialize your new wallet" 
                : "Enrollment via biometric scan"}
            </p>
          </div>

          {step === "info" ? (
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Full Name</label>
                  <input
                    type="text"
                    required
                    className="stark-input"
                    placeholder="ENTER NAME"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Email Address</label>
                  <input
                    type="email"
                    required
                    className="stark-input"
                    placeholder="YOURNAME@DOMAIN.COM"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Phone Number</label>
                <PhoneInput
                  required
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Secure Password</label>
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
                className="stark-button w-full py-8 flex items-center justify-center gap-4 mt-6"
              >
                Next: Identity Verification <ChevronRight className="w-6 h-6" />
              </button>
            </form>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="border-8 border-foreground shadow-[16px_16px_0_0_rgba(0,0,0,1)] bg-background overflow-hidden relative group">
                <FaceAuth mode="register" onCapture={handleFaceCapture} />
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 animate-pulse" />
              </div>
              
              <div className="space-y-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !faceDescriptor}
                  className="stark-button w-full py-8 flex items-center justify-center gap-4"
                >
                  {loading ? "Establishing Identity..." : <>Confirm Registration <CheckCircle2 className="w-6 h-6" /></>}
                </button>
                
                <button
                  onClick={() => setStep("info")}
                  className="w-full text-foreground/40 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors py-2"
                >
                  RETURN_TO_ENTITY_DATA
                </button>
              </div>
            </div>
          )}

          <p className="text-center mt-12 text-[10px] font-black uppercase tracking-widest text-foreground/40">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline ml-2">
              Sign In
            </Link>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-6 -left-6 px-6 py-2 bg-foreground text-background font-black text-[10px] tracking-[0.4em] transform -rotate-2">
            SECURE ENROLLMENT V2.0
        </div>
      </div>
    </div>
  );
}

