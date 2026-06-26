"use client";

import { useState } from "react";
import { api, BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Store, User, Building2, Banknote,
  FileText, Tag, Mail, Phone, Loader2, CheckCircle2, Shield,
  Eye, EyeOff, ClipboardList
} from "lucide-react";

const BUSINESS_CATEGORIES = [
  "RETAIL", "FOOD", "SERVICES", "TECHNOLOGY",
  "HEALTH", "EDUCATION", "OTHER",
];

const BANKS = [
  "Attijariwafa Bank", "BMCE Bank", "CIH Bank", "Bank Populaire",
  "BMCI", "Société Générale", "Crédit Agricole", "CFG Bank",
];

const BANK_PREFIXES: Record<string, string> = {
  "Attijariwafa Bank": "007",
  "BMCE Bank": "011",
  "CIH Bank": "013",
  "Bank Populaire": "012",
  "BMCI": "014",
  "Société Générale": "016",
  "Crédit Agricole": "017",
  "CFG Bank": "020",
};

function validateRIB(rib: string): boolean {
  const digits = rib.replace(/\s/g, "");
  return /^\d{24}$/.test(digits);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type StepData = {
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  bankName: string;
  rib: string;
  accountHolder: string;
};

const initialData: StepData = {
  businessName: "",
  businessDescription: "",
  businessCategory: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  bankName: "",
  rib: "",
  accountHolder: "",
};

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StepData>(initialData);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showRib, setShowRib] = useState(true);

  const update = (field: keyof StepData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const step1Valid = data.businessName.trim().length > 0;
  const step2Valid = data.fullName.trim().length > 0 && validateEmail(data.email) && data.password.length >= 8 && data.password === data.confirmPassword;
  const step3Valid =
    data.bankName.length > 0 &&
    validateRIB(data.rib) &&
    data.accountHolder.trim().length > 0;

  const canProceed = [step1Valid, step2Valid, step3Valid][step] ?? false;

  const handleNext = () => {
    if (canProceed && step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const formatRIB = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 24);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const registerRes = await api.post("/auth/register", {
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone.trim() || undefined,
      }, { skipAuth: true });
      const registerBody = await registerRes.json();
      if (!registerRes.ok && registerBody.error?.toLowerCase().includes("already exists")) {
        throw new Error("An account with this email already exists. Please sign in at the merchant login page.");
      }
      if (!registerRes.ok) throw new Error(registerBody.error || "Registration failed");
      const token = registerBody.accessToken || registerBody.token;
      if (token) {
        localStorage.setItem("token", token);
        if (registerBody.refreshToken) localStorage.setItem("refreshToken", registerBody.refreshToken);
      }
      const onboardingRes = await fetch(`${BASE_URL}/merchant/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.businessName.trim(),
          description: data.businessDescription.trim(),
          category: data.businessCategory || undefined,
        }),
      });
      const onboardingBody = await onboardingRes.json();
      if (!onboardingRes.ok) throw new Error(onboardingBody.error || "Merchant application failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
        <div className="text-center space-y-8 max-w-md w-full animate-in fade-in duration-700">
          <div className="relative mx-auto w-24 h-24">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="4"
                strokeDasharray="283" strokeDashoffset="283"
                strokeLinecap="round" transform="rotate(-90, 50, 50)"
                style={{
                  animation: "draw-check 0.8s ease-out forwards",
                }}
              />
              <polyline
                points="35,50 46,61 65,39" fill="none" stroke="#22c55e" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="40" strokeDashoffset="40"
                style={{
                  animation: "draw-checkmark 0.5s ease-out 0.6s forwards",
                }}
              />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tighter text-white">Application Submitted</h2>
            <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm">
              Your application is under review. You&apos;ll be notified within 2 business days.
            </p>
          </div>
          <div
            className="flex items-center gap-3 justify-center rounded-2xl px-6 py-4 mx-auto"
            style={{
              color: "#d97706",
              background: "rgba(217,119,6,0.1)",
              border: "1px solid rgba(217,119,6,0.2)",
            }}
          >
            <ClockIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">Review typically takes 24-48 hours</span>
          </div>
          <button
            onClick={() => router.push("/merchant/dashboard")}
            className="px-10 py-4 text-black font-black rounded-2xl transition-all"
            style={{
              background: "#FFD700",
              boxShadow: "0 0 20px rgba(255,215,0,0.2)",
            }}
          >
            Return to Dashboard
          </button>
          <style jsx>{`
            @keyframes draw-check {
              to { stroke-dashoffset: 0; }
            }
            @keyframes draw-checkmark {
              to { stroke-dashoffset: 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-[520px]">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-bold transition-colors mb-6"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? "Back" : "Back"}
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={{
                  background:
                    i < step
                      ? "#22c55e"
                      : i === step
                      ? "#FFD700"
                      : "rgba(255,255,255,0.04)",
                  border:
                    i === step
                      ? "2px solid #FFD700"
                      : i < step
                      ? "2px solid #22c55e"
                      : "2px solid rgba(255,255,255,0.08)",
                  color:
                    i <= step ? "#0a0a0f" : "rgba(255,255,255,0.3)",
                  boxShadow:
                    i === step
                      ? "0 0 20px rgba(255,215,0,0.2)"
                      : "none",
                }}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < 3 && (
                <div
                  className="w-12 h-[2px] mx-1 transition-all duration-300"
                  style={{
                    background:
                      i < step
                        ? "#22c55e"
                        : "rgba(255,255,255,0.06)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error toast */}
        {error && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "#dc2626",
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-[2rem] p-8 md:p-10 space-y-8 transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Step header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter text-white">
              {step === 0 && "Business Information"}
              {step === 1 && "Owner Information"}
              {step === 2 && "Banking Details"}
              {step === 3 && "Review & Submit"}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {step === 0 && "Tell us about your business"}
              {step === 1 && "Who will manage this account?"}
              {step === 2 && "Link your business bank account"}
              {step === 3 && "Verify all details before submitting"}
            </p>
          </div>

          {/* Step 1: Business Info */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Store className="w-4 h-4" style={{ color: "#FFD700" }} /> Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <FileText className="w-4 h-4" style={{ color: "#FFD700" }} /> Description
                </label>
                <textarea
                  value={data.businessDescription}
                  onChange={(e) => update("businessDescription", e.target.value)}
                  placeholder="Tell us about your business..."
                  className="w-full outline-none rounded-2xl py-4 px-6 font-medium text-sm resize-none min-h-[100px]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Tag className="w-4 h-4" style={{ color: "#FFD700" }} /> Category
                </label>
                <select
                  value={data.businessCategory}
                  onChange={(e) => update("businessCategory", e.target.value)}
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: data.businessCategory ? "#ffffff" : "rgba(255,255,255,0.3)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <option value="" style={{ background: "#0a0a0f", color: "rgba(255,255,255,0.3)" }}>Select a category</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: "#0a0a0f", color: "#fff" }}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Owner Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <User className="w-4 h-4" style={{ color: "#FFD700" }} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="John Doe"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Mail className="w-4 h-4" style={{ color: "#FFD700" }} /> Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="owner@business.com"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Phone className="w-4 h-4" style={{ color: "#FFD700" }} /> Phone (optional)
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+212 6XX XX XX XX"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Shield className="w-4 h-4" style={{ color: "#FFD700" }} /> Password *
                </label>
                <input
                  type="password"
                  required
                  value={data.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${data.password.length >= 8 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = data.password.length >= 8 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"; }}
                />
                {data.password.length > 0 && data.password.length < 8 && (
                  <span className="text-[11px]" style={{ color: "#f87171" }}>Minimum 8 characters required</span>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Shield className="w-4 h-4" style={{ color: "#FFD700" }} /> Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={data.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${data.confirmPassword && data.password === data.confirmPassword ? "rgba(34,197,94,0.3)" : data.confirmPassword ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = data.confirmPassword && data.password === data.confirmPassword ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"; }}
                />
                {data.confirmPassword && data.password !== data.confirmPassword && (
                  <span className="text-[11px]" style={{ color: "#f87171" }}>Passwords do not match</span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Banking Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#FFD700" }} /> Bank Name *
                </label>
                <select
                  value={data.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: data.bankName ? "#ffffff" : "rgba(255,255,255,0.3)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <option value="" style={{ background: "#0a0a0f", color: "rgba(255,255,255,0.3)" }}>Select your bank</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank} style={{ background: "#0a0a0f", color: "#fff" }}>{bank}</option>
                  ))}
                </select>
              </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Banknote className="w-4 h-4" style={{ color: "#FFD700" }} /> RIB *
                  </label>
                  <div className="relative">
                    <input
                      type={showRib ? "text" : "password"}
                      value={data.rib}
                      onChange={(e) => update("rib", formatRIB(e.target.value))}
                      placeholder="XXXX XXXX XXXX XXXX XXXX XXXX"
                      className="w-full outline-none rounded-2xl py-4 pr-12 pl-6 font-mono font-bold text-base tracking-wider"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#ffffff",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRib(!showRib)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    >
                      {showRib ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span style={{ color: data.rib.replace(/\s/g, "").length === 24 ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
                      {data.rib.replace(/\s/g, "").length}/24 digits
                    </span>
                    {data.rib.replace(/\s/g, "").length > 0 && data.rib.replace(/\s/g, "").length !== 24 && (
                      <span style={{ color: "#f87171" }}>Must be exactly 24 digits</span>
                    )}
                  </div>
                </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <User className="w-4 h-4" style={{ color: "#FFD700" }} /> Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.accountHolder}
                  onChange={(e) => update("accountHolder", e.target.value)}
                  placeholder="Name on bank account"
                  className="w-full outline-none rounded-2xl py-4 px-6 font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#FFD700"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "#FFD700" }}>
                  <Store className="w-4 h-4" /> Business Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Name</span>
                    <span className="font-bold text-white">{data.businessName}</span>
                  </div>
                  {data.businessDescription && (
                    <div className="flex justify-between">
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>Description</span>
                      <span className="font-medium text-white text-right max-w-[200px] truncate">{data.businessDescription}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Category</span>
                    <span className="font-bold text-white">{data.businessCategory || "—"}</span>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "#FFD700" }}>
                  <User className="w-4 h-4" /> Owner Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Full Name</span>
                    <span className="font-bold text-white">{data.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Email</span>
                    <span className="font-bold text-white">{data.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Phone</span>
                    <span className="font-bold text-white">{data.phone || "—"}</span>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "#FFD700" }}>
                  <Banknote className="w-4 h-4" /> Banking Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Bank</span>
                    <span className="font-bold text-white">{data.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>RIB</span>
                    <span className="font-mono font-bold text-white">{data.rib}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Account Holder</span>
                    <span className="font-bold text-white">{data.accountHolder}</span>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <div
                  onClick={() => setConfirmed(!confirmed)}
                  className="relative w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                  style={{
                    background: confirmed ? "#FFD700" : "rgba(255,255,255,0.04)",
                    border: confirmed ? "2px solid #FFD700" : "2px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {confirmed && <Check className="w-3.5 h-3.5" style={{ color: "#0a0a0f" }} />}
                </div>
                <span className="text-xs font-bold leading-tight" style={{ color: "rgba(255,255,255,0.5)" }}>
                  I confirm the information is accurate
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                style={{
                  background: "#FFD700",
                  color: "#0a0a0f",
                  boxShadow: canProceed ? "0 0 20px rgba(255,215,0,0.2)" : "none",
                }}
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !confirmed}
                className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-30 w-full"
                style={{
                  background: "#FFD700",
                  color: "#0a0a0f",
                  boxShadow: confirmed ? "0 0 20px rgba(255,215,0,0.2)" : "none",
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Apply for Merchant Account
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
