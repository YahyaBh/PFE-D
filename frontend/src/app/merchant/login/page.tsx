"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, Loader2, X, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingMerchant, setCheckingMerchant] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/merchant/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            if (err.field === "email" || err.field === "password") {
              fieldErrors[err.field] = err.message;
            }
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            setErrors({ email: data.error || "Login failed" });
          }
        } else {
          setErrors({ email: data.error || "Invalid credentials" });
        }
        return;
      }

      if (data.requireMFA) {
        sessionStorage.setItem("mfa_faceDescriptor", JSON.stringify(data.faceDescriptor));
        router.push(`/mfa?email=${encodeURIComponent(formData.email)}&userId=${data.userId}&returnTo=/merchant/dashboard`);
        return;
      }

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

      // Verify this user has a merchant account
      setCheckingMerchant(true);
      try {
        const statusRes = await api.get("/merchant/status");
        const statusData = await statusRes.json();
        if (!statusRes.ok || !statusData.merchant) {
          // Not a merchant — clean up tokens and show error
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");
          setCheckingMerchant(false);
          setErrors({ email: "This account is not a registered merchant. Please sign in at the personal login page." });
          return;
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        setCheckingMerchant(false);
        setErrors({ email: "Could not verify merchant status. Please try again." });
        return;
      }

      router.push("/merchant/dashboard");
    } catch (err: any) {
      setErrors({ email: err.message || "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "#0a0a0f", color: "#fff" }}>
      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.15,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        <div
          className="rounded-3xl p-8 md:p-10 space-y-8"
          style={{
            background: "rgba(17,17,24,0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <div className="text-center space-y-1">
            <h1 className="text-lg font-black tracking-tighter italic text-white">
              MARJANE{" "}
              <span style={{ color: "#FFD700" }}>MERCHANT HUB</span>
            </h1>
          </div>

          {/* Title */}
          <div className="text-center space-y-1.5">
            <h2 className="text-[28px] font-black tracking-tight text-white">
              Merchant Sign In
            </h2>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Access your business dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full outline-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${errors.email ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "14px",
                    padding: "14px 14px 14px 44px",
                    color: "#fff",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.currentTarget.style.borderColor = "#FFD700";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.06)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

          {/* Form errors banner */}
          {errors.email && (
            <div
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{
                background: errors.email.includes("not a registered merchant") ? "rgba(245,158,11,0.1)" : "rgba(220,38,38,0.1)",
                border: `1px solid ${errors.email.includes("not a registered merchant") ? "rgba(245,158,11,0.2)" : "rgba(220,38,38,0.2)"}`,
                color: errors.email.includes("not a registered merchant") ? "#f59e0b" : "#ef4444",
              }}
            >
              {errors.email.includes("not a registered merchant") ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <div className="w-5 h-5 shrink-0 mt-0.5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "rgba(220,38,38,0.2)" }}>!</div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{errors.email}</p>
                {errors.email.includes("not a registered merchant") && (
                  <Link href="/login" className="text-[10px] font-bold underline mt-1 inline-block opacity-80 hover:opacity-100" style={{ color: "#f59e0b" }}>
                    Go to Personal Login →
                  </Link>
                )}
              </div>
            </div>
          )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full outline-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${errors.password ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "14px",
                    padding: "14px 44px 14px 16px",
                    color: "#fff",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor = "#FFD700";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.06)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.password ? "#ef4444" : "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium px-1" style={{ color: "#ef4444" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{
                    background: rememberMe ? "#FFD700" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${rememberMe ? "#FFD700" : "rgba(255,255,255,0.15)"}`,
                  }}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs font-bold tracking-wide transition-colors"
                style={{ color: "#FFD700", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || checkingMerchant}
              className="w-full rounded-full text-sm font-bold leading-none flex items-center justify-center gap-2 transition-all"
              style={{
                background: "#FFD700",
                color: "#000000",
                padding: "16px 32px",
                cursor: loading || checkingMerchant ? "not-allowed" : "pointer",
                opacity: loading || checkingMerchant ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && !checkingMerchant) {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(255,215,0,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {checkingMerchant ? (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#000000" }} />
              ) : loading ? (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#000000" }} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            className="w-full"
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            }}
          />

          {/* Register link */}
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Not a merchant yet?{" "}
              <Link
                href="/merchant/register"
                className="font-bold transition-colors"
                style={{ color: "#FFD700" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                Apply here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[10px] font-medium tracking-wider"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Protected by Bank Al-Maghrib regulations
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="rounded-3xl p-8 w-full max-w-sm space-y-6"
            style={{
              background: "rgba(17,17,24,0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Reset Password</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Enter your email address and we will send you a link to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email address"
              className="w-full outline-none text-sm"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "14px 16px",
                color: "#fff",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FFD700";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            />
            <button
              type="button"
              className="w-full rounded-full text-sm font-bold leading-none py-4 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}
            >
              Send Reset Link
            </button>
          </div>
        </div>
      )}

      {/* Global styles for placeholder */}
      <style jsx global>{`
        input::placeholder {
          color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
