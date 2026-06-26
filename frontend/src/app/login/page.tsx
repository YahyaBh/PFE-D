"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ChevronRight, Fingerprint, Loader2 } from "lucide-react";
import gsap from "gsap";
import BiometricOverlay from "@/components/BiometricOverlay";
import Toast from "@/components/ui/Toast";
import { api, BASE_URL } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || "");
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      (async () => {
        try {
          const merchantRes = await fetch(`${BASE_URL}/merchant/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const merchantData = await merchantRes.json();
          router.replace(merchantData?.merchant ? "/merchant/dashboard" : "/dashboard");
        } catch {
          router.replace("/dashboard");
        }
      })();
    }
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

  // ── Spotlight ──
  useEffect(() => {
    const spot = document.createElement("div");
    spot.id = "login-spotlight";
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

  // ── Particles ──
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
      const dur = 12 + Math.random() * 16;
      const delay = Math.random() * 10;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.requireMFA) {
        if (rememberMe) localStorage.setItem("rememberMe", "true");
        else { sessionStorage.setItem("rememberMe", "false"); localStorage.removeItem("rememberMe"); }
        if (data.faceDescriptor) {
          sessionStorage.setItem("mfa_faceDescriptor", JSON.stringify(data.faceDescriptor));
        }
        router.push(`/mfa?email=${formData.email}&userId=${data.userId}`);
      } else if (data.token || data.accessToken) {
        const tokenVal = data.accessToken || data.token;
        if (rememberMe) {
          localStorage.setItem("token", tokenVal);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        } else {
          localStorage.setItem("token", tokenVal);
          sessionStorage.setItem("token", tokenVal);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
            sessionStorage.setItem("refreshToken", data.refreshToken);
          }
        }
        try {
          const merchantRes = await fetch(`${BASE_URL}/merchant/status`, {
            headers: { Authorization: `Bearer ${tokenVal}` }
          });
          const merchantData = await merchantRes.json();
          router.push(merchantData?.merchant ? "/merchant/dashboard" : "/dashboard");
        } catch {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message);
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
            animation: "login-orb-drift-1 20s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "400px", height: "400px", bottom: "5%", right: "-8%",
            background: "radial-gradient(circle, rgba(255,215,0,.12), transparent 70%)",
            filter: "blur(120px)",
            animation: "login-orb-drift-2 25s ease-in-out infinite alternate",
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
      {showBiometric && <BiometricOverlay type="face" onComplete={() => { setShowBiometric(false); router.push("/dashboard"); }} />}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div
          ref={cardRef}
          className="w-full max-w-[420px]"
          style={{ opacity: 0 }}
        >
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
              <h1 ref={headlineRef} className="text-4xl md:text-5xl font-display font-black tracking-[-.03em] leading-none">
                <span className="hl-word inline-block mr-3">WELCOME</span>
                <span
                  className="hl-word inline-block"
                  style={{
                    color: "#FFD700", fontWeight: 300, fontStyle: "italic",
                    textShadow: "0 0 40px rgba(255,215,0,.12)",
                  }}
                >
                  BACK
                </span>
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
                SECURE AUTHENTICATION PROTOCOL
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div ref={fieldsRef} className="space-y-5">
                {/* Email */}
                <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                    <label
                      className="text-[11px] font-semibold uppercase tracking-[.15em]"
                      style={{ color: "#64748B" }}
                    >
                      Email Identity
                    </label>
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yourname@domain.com"
                    className="login-input w-full outline-none"
                    style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: "9999px",
                      padding: "16px 24px",
                      fontSize: "14px",
                      color: "#fff",
                      transition: "border-color .3s, box-shadow .3s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#FFD700";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Password */}
                <div className="field-stagger space-y-2.5" style={{ opacity: 0 }}>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#FFD700" }} />
                      <label
                        className="text-[11px] font-semibold uppercase tracking-[.15em]"
                        style={{ color: "#64748B" }}
                      >
                        Security Key
                      </label>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-semibold uppercase tracking-[.1em] no-underline transition-all"
                      style={{ color: "#FFD700" }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                    >
                      Recover Access
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                      className="login-input w-full outline-none"
                      style={{
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: "9999px",
                        padding: "16px 48px 16px 24px",
                        fontSize: "14px",
                        color: "#fff",
                        transition: "border-color .3s, box-shadow .3s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#FFD700";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
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

                {/* Toggle row */}
                <div className="field-stagger flex items-center justify-between px-1 pt-2" style={{ opacity: 0 }}>
                  <label className="flex items-center gap-3 cursor-pointer select-none" style={{ userSelect: "none" }}>
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className="relative w-11 h-[22px] rounded-full transition-colors duration-300 cursor-pointer shrink-0"
                      style={{
                        background: rememberMe ? "#FFD700" : "rgba(255,255,255,.12)",
                      }}
                    >
                      <div
                        className="absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-300"
                        style={{
                          background: rememberMe ? "#080C17" : "#fff",
                          left: rememberMe ? "calc(100% - 20px)" : "2px",
                          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[.2em] transition-colors"
                      style={{ color: "#64748B" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
                    >
                      Keep Me Signed In
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-bold uppercase tracking-[.15em] no-underline transition-all"
                    style={{ color: "#FFD700" }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* Buttons */}
              <div ref={buttonsRef} className="space-y-3 pt-2">
                {/* Primary button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-stagger group relative w-full overflow-hidden rounded-full font-semibold text-[13px] tracking-[.2em] uppercase leading-none no-underline flex items-center justify-center gap-3"
                  style={{
                    background: "linear-gradient(135deg,#FFD700,#FFE135)",
                    color: "#080C17",
                    padding: "18px 32px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "box-shadow .3s, transform .15s",
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = "0 0 40px rgba(255,215,0,.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(0,0)";
                  }}
                  onMouseMove={handleMagnetic}
                  onClick={(e) => {
                    if (!loading) {
                      const btn = e.currentTarget;
                      btn.style.transform = "scale(0.96)";
                      setTimeout(() => { btn.style.transform = ""; }, 150);
                    }
                  }}
                >
                  {/* Sweep */}
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
                      Enter Portal
                      <ChevronRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
                      />
                    </>
                  )}
                </button>

                {/* Biometric button */}
                <button
                  type="button"
                  onClick={() => setShowBiometric(true)}
                  className="btn-stagger group relative w-full overflow-hidden rounded-full text-[13px] font-semibold tracking-[.15em] uppercase leading-none flex items-center justify-center gap-3"
                  style={{
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.1)",
                    color: "rgba(255,255,255,.7)",
                    padding: "16px 32px",
                    cursor: "pointer",
                    transition: "background .25s, border-color .25s, color .25s, transform .15s",
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,.2)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
                    e.currentTarget.style.color = "rgba(255,255,255,.7)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Fingerprint size={18} className="transition-transform group-hover:scale-110" />
                  Biometric Sign In
                </button>
              </div>
            </form>

            {/* Divider */}
            <div
              className="w-full"
              style={{
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)",
              }}
            />

            {/* Bottom section */}
            <div className="text-center space-y-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-[.15em]"
                style={{ color: "#64748B" }}
              >
                New to Marjane Ecosystem?
              </p>
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full text-[13px] font-semibold leading-none no-underline transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "rgba(255,255,255,.7)",
                  cursor: "pointer",
                  transition: "background .25s, border-color .25s, box-shadow .3s, color .3s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,.05)";
                  el.style.borderColor = "rgba(255,255,255,.4)";
                  el.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "transparent";
                  el.style.borderColor = "rgba(255,255,255,.15)";
                  el.style.color = "rgba(255,255,255,.7)";
                }}
              >
                Create Identity
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-10 text-center pointer-events-none"
          style={{ opacity: 0.2 }}
        >
          <p className="text-[8px] font-black uppercase tracking-[1em]">
            MARJANE // WEB3 // WALLET
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes login-orb-drift-1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(60px,40px) scale(1.1); }
        }
        @keyframes login-orb-drift-2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-50px,-30px) scale(1.15); }
        }
        .login-input::placeholder {
          color: #475569;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080C17" }}>
        <div className="w-10 h-10 border-2 border-[#FFD700]/20 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
