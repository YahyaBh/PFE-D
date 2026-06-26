"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, CheckCircle2, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import gsap from "gsap";
import PhoneInput from "@/components/ui/PhoneInput";
import Toast from "@/components/ui/Toast";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const FaceAuth = dynamic(() => import("@/components/FaceAuth"), { ssr: false });

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "face">("info");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem("token")) { router.replace("/dashboard"); }
  }, [router]);

  const animateIn = useCallback(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(cardRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" });
    tl.fromTo(logoRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.3");
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll(".hl-word");
      tl.fromTo(words, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power2.out" }, "-=0.2");
    }
    tl.fromTo(subRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.1");
    if (fieldsRef.current) {
      const inputs = fieldsRef.current.querySelectorAll(".field-stagger");
      tl.fromTo(inputs, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }, "-=0.1");
    }
    if (buttonsRef.current) {
      const btns = buttonsRef.current.querySelectorAll(".btn-stagger");
      tl.fromTo(btns, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.1");
    }
  }, []);

  useEffect(() => { animateIn(); }, [animateIn]);

  useEffect(() => {
    const spot = document.createElement("div");
    spot.id = "register-spotlight";
    Object.assign(spot.style, {
      position: "fixed", top: "0", left: "0", width: "500px", height: "500px",
      borderRadius: "50%", pointerEvents: "none", zIndex: "9998",
      background: "radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 65%)",
      transform: "translate(-50%,-50%)", opacity: "0",
      transition: "opacity .8s ease", willChange: "transform, opacity",
    });
    document.body.appendChild(spot);

    let sx = 0, sy = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => { sx = e.clientX; sy = e.clientY; spot.style.opacity = "1"; };
    const onLeave = () => { spot.style.opacity = "0"; };
    const tick = () => { cx += (sx - cx) * 0.1; cy += (sy - cy) * 0.1; spot.style.transform = `translate(${cx - 250}px, ${cy - 250}px)`; raf = requestAnimationFrame(tick); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      spot.remove();
    };
  }, []);

  useEffect(() => {
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 15; i++) {
      const p = document.createElement("div");
      Object.assign(p.style, {
        position: "fixed", width: "1px", height: "1px",
        background: "rgba(255,255,255,.1)", borderRadius: "50%",
        pointerEvents: "none", zIndex: "0",
        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
        opacity: `${0.05 + Math.random() * 0.1}`,
      });
      document.body.appendChild(p);
      particles.push(p);
      const dur = 12 + Math.random() * 16, delay = Math.random() * 10;
      gsap.to(p, {
        y: -window.innerHeight - 100, opacity: 0, duration: dur, repeat: -1, delay, ease: "none",
        onUpdate: function () {
          const prog = this.progress();
          const drift = Math.sin(prog * Math.PI * 2 * (0.5 + Math.random() * 1.5)) * (10 + Math.random() * 30);
          p.style.transform = `translateX(${drift}px)`;
        },
      });
    }
    return () => { particles.forEach((p) => p.remove()); };
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("face");
  };

  const handleFaceCapture = useCallback((descriptor: number[] | null) => {
    setFaceDescriptor(descriptor);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/register", { ...formData, faceDescriptor });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(`/verify?userId=${data.user.id}&step=email`);
    } catch (err: any) {
      setError(err.message);
      setStep("info");
    } finally {
      setLoading(false);
    }
  };

  const handleMagnetic = (e: React.MouseEvent<HTMLElement>) => {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 40) {
      const pull = Math.min(dist / 40, 1) * 8;
      const a = Math.atan2(y, x);
      btn.style.transform = `translate(${Math.cos(a) * pull}px, ${Math.sin(a) * pull * 0.5}px)`;
    }
  };

  const handleMagneticReset = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translate(0,0)";
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080C17", color: "#fff" }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: "400px", height: "400px", top: "5%", left: "-8%",
            background: "radial-gradient(circle, rgba(0,102,255,.15), transparent 70%)",
            filter: "blur(120px)",
            animation: "register-orb-drift-1 20s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "400px", height: "400px", bottom: "5%", right: "-8%",
            background: "radial-gradient(circle, rgba(255,215,0,.12), transparent 70%)",
            filter: "blur(120px)",
            animation: "register-orb-drift-2 25s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          opacity: ".015",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "256px 256px",
        }}
      />

      {error && <Toast message={error} type="error" onClose={() => setError("")} />}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div ref={cardRef} className="w-full max-w-[480px]" style={{ opacity: 0 }}>
          <div
            className="rounded-3xl p-8 md:p-10 space-y-8"
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 20px 40px rgba(0,0,0,.4)",
            }}
          >
            {/* Logo */}
            <div ref={logoRef} className="text-center" style={{ opacity: 0 }}>
              <Link href="/" className="inline-block">
                <div
                  className="flex items-center justify-center rounded-2xl p-3 mx-auto"
                  style={{
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.08)",
                    width: "80px", height: "80px",
                  }}
                >
                  <img loading="lazy" src="/Marjane-logo.png" alt="Marjane Wallet" className="w-full h-full object-contain" />
                </div>
              </Link>
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
              <h1 ref={headlineRef} className="text-[clamp(28px,5vw,40px)] font-display font-black tracking-[-.03em] leading-none">
                {step === "info" ? (
                  <>
                    <span className="hl-word inline-block mr-3">ESTABLISH</span>
                    <span
                      className="hl-word inline-block"
                      style={{
                        color: "#FFD700", fontWeight: 300, fontStyle: "italic",
                        textShadow: "0 0 40px rgba(255,215,0,.12)",
                      }}
                    >
                      IDENTITY
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hl-word inline-block mr-3">SECURE</span>
                    <span
                      className="hl-word inline-block"
                      style={{
                        color: "#FFD700", fontWeight: 300, fontStyle: "italic",
                        textShadow: "0 0 40px rgba(255,215,0,.12)",
                      }}
                    >
                      NODE
                    </span>
                  </>
                )}
              </h1>
              <p
                ref={subRef}
                className="text-[11px] font-medium uppercase tracking-[.15em]"
                style={{ color: "#64748B" }}
              >
                <span
                  className="inline-block w-[5px] h-[5px] rounded-full mr-2 align-middle"
                  style={{ background: "#FFD700" }}
                />
                {step === "info" ? "INITIALIZE YOUR NEW DIGITAL WALLET" : "BIOMETRIC ENROLLMENT V2.0"}
              </p>
            </div>

            {step === "info" ? (
              <form onSubmit={handleInfoSubmit} className="space-y-5">
                <div ref={fieldsRef} className="space-y-4">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                      <div className="flex items-center gap-2.5 px-1">
                        <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                        <label className="text-[11px] font-semibold uppercase tracking-[.15em]" style={{ color: "#64748B" }}>Legal Name</label>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="ENTER NAME"
                        className="register-input w-full outline-none"
                        style={{
                          background: "rgba(255,255,255,.03)",
                          border: "1px solid rgba(255,255,255,.1)",
                          borderRadius: "9999px",
                          padding: "14px 20px",
                          fontSize: "13px",
                          color: "#fff",
                          transition: "border-color .3s, box-shadow .3s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,.08)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                    </div>
                    <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                      <div className="flex items-center gap-2.5 px-1">
                        <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                        <label className="text-[11px] font-semibold uppercase tracking-[.15em]" style={{ color: "#64748B" }}>Email Handle</label>
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="YOURNAME@DOMAIN.COM"
                        className="register-input w-full outline-none"
                        style={{
                          background: "rgba(255,255,255,.03)",
                          border: "1px solid rgba(255,255,255,.1)",
                          borderRadius: "9999px",
                          padding: "14px 20px",
                          fontSize: "13px",
                          color: "#fff",
                          transition: "border-color .3s, box-shadow .3s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,.08)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-2.5 px-1">
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                      <label className="text-[11px] font-semibold uppercase tracking-[.15em]" style={{ color: "#64748B" }}>Phone Frequency</label>
                    </div>
                    <PhoneInput
                      required
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                    />
                  </div>

                  {/* Password */}
                  <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-2.5 px-1">
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                      <label className="text-[11px] font-semibold uppercase tracking-[.15em]" style={{ color: "#64748B" }}>Secure Access Key</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                        className="register-input w-full outline-none"
                        style={{
                          background: "rgba(255,255,255,.03)",
                          border: "1px solid rgba(255,255,255,.1)",
                          borderRadius: "9999px",
                          padding: "14px 48px 14px 20px",
                          fontSize: "13px",
                          color: "#fff",
                          transition: "border-color .3s, box-shadow .3s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,.08)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Next button */}
                <div ref={buttonsRef} className="pt-2">
                  <button
                    type="submit"
                    className="btn-stagger group relative w-full overflow-hidden rounded-full font-semibold text-[13px] tracking-[.2em] uppercase leading-none no-underline flex items-center justify-center gap-3"
                    style={{
                      background: "linear-gradient(135deg,#FFD700,#FFE135)",
                      color: "#080C17",
                      padding: "18px 32px",
                      cursor: "pointer",
                      transition: "box-shadow .3s, transform .15s",
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 40px rgba(255,215,0,.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translate(0,0)"; }}
                    onMouseMove={handleMagnetic}
                    onClick={(e) => { const btn = e.currentTarget; btn.style.transform = "scale(0.96)"; setTimeout(() => { btn.style.transform = ""; }, 150); }}
                  >
                    <span
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg,transparent,rgba(255,225,53,.35),transparent)",
                        transform: "translateX(-100%)",
                        transition: "transform .4s ease",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "translateX(100%)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "translateX(-100%)"; }}
                    />
                    Next Step: Biometrics
                    <ChevronRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
                    />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {/* Face capture */}
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.02)",
                  }}
                >
                  <FaceAuth mode="register" onCapture={handleFaceCapture} />
                  <div
                    className="absolute top-0 left-0 w-full h-[2px]"
                    style={{
                      background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
                      animation: "register-sweep 2s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Submit + back */}
                <div ref={buttonsRef} className="space-y-3">
                    <button
                    type="button"
                    disabled={loading || !faceDescriptor}
                    className="btn-stagger group relative w-full overflow-hidden rounded-full font-semibold text-[13px] tracking-[.2em] uppercase leading-none no-underline flex items-center justify-center gap-3"
                    style={{
                      background: "linear-gradient(135deg,#FFD700,#FFE135)",
                      color: "#080C17",
                      padding: "18px 32px",
                      cursor: loading || !faceDescriptor ? "not-allowed" : "pointer",
                      opacity: loading || !faceDescriptor ? 0.5 : 0,
                    }}
                    onMouseEnter={(e) => { if (!loading && faceDescriptor) e.currentTarget.style.boxShadow = "0 0 40px rgba(255,215,0,.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translate(0,0)"; }}
                    onMouseMove={handleMagnetic}
                    onClick={(e) => {
                      if (!loading && faceDescriptor) {
                        e.currentTarget.style.transform = "scale(0.96)";
                        setTimeout(() => { e.currentTarget.style.transform = ""; }, 150);
                        handleSubmit();
                      }
                    }}
                  >
                    <span
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg,transparent,rgba(255,225,53,.35),transparent)",
                        transform: "translateX(-100%)",
                        transition: "transform .4s ease",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "translateX(100%)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "translateX(-100%)"; }}
                    />
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#080C17" }} />
                    ) : (
                      <>
                        Establish Connection
                        <CheckCircle2 size={18} className="transition-transform duration-300 group-hover:scale-110" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("info")}
                    className="btn-stagger group relative w-full overflow-hidden rounded-full text-[13px] font-semibold tracking-[.15em] uppercase leading-none flex items-center justify-center gap-3"
                    style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.1)",
                      color: "rgba(255,255,255,.7)",
                      padding: "14px 32px",
                      cursor: "pointer",
                      transition: "background .25s, border-color .25s, color .25s",
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
                  >
                    <ArrowLeft size={16} />
                    Return to Identity Data
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div
              className="w-full"
              style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)" }}
            />

            {/* Bottom section */}
            <div className="text-center space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[.15em]" style={{ color: "#64748B" }}>
                Already a recognized entity?
              </p>
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full text-[13px] font-semibold leading-none no-underline"
                style={{
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "rgba(255,255,255,.7)",
                  cursor: "pointer",
                  transition: "background .25s, border-color .25s, box-shadow .3s, color .3s",
                }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,.05)"; el.style.borderColor = "rgba(255,255,255,.4)"; el.style.color = "#fff"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "transparent"; el.style.borderColor = "rgba(255,255,255,.15)"; el.style.color = "rgba(255,255,255,.7)"; }}
              >
                Sign In Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center pointer-events-none" style={{ opacity: 0.2 }}>
          <p className="text-[8px] font-black uppercase tracking-[1em]">
            MARJANE // SECURE // ENROLLMENT
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes register-orb-drift-1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(60px,40px) scale(1.1); }
        }
        @keyframes register-orb-drift-2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-50px,-30px) scale(1.15); }
        }
        @keyframes register-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .register-input::placeholder {
          color: #475569;
        }
      `}</style>
    </div>
  );
}
