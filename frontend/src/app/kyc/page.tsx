"use client";

import { api } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Upload, Camera, MapPin, FileCheck, Loader2,
  CheckCircle2, XCircle, Clock, ChevronRight, Trash2,
  FileText, ChevronLeft, Sparkles
} from "lucide-react";
import Toast from "@/components/ui/Toast";

const STEPS = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "government_id", label: "Government ID", icon: FileText },
  { id: "selfie", label: "Selfie", icon: Camera },
  { id: "address", label: "Address", icon: MapPin },
  { id: "review", label: "Review", icon: FileCheck },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  UNVERIFIED: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "Unverified", icon: Shield },
  PENDING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "Pending Review", icon: Clock },
  VERIFIED: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", label: "Verified", icon: CheckCircle2 },
  REJECTED: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "Rejected", icon: XCircle },
};

export default function KYCPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const [kycStatus, setKycStatus] = useState("UNVERIFIED");
  const [riskScore, setRiskScore] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) { router.push("/login"); return; }
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/kyc/status");
      const data = await res.json();
      setKycStatus(data.status || "UNVERIFIED");
      setRiskScore(data.riskScore || 0);
      setRejectionReason(data.rejectionReason || "");
      setDocuments(data.documents || []);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, type: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("type", type);
      const res = await api.post("/kyc/upload", formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRiskScore(data.riskScore);
      setToast({ message: "Document uploaded successfully!", type: "success" });
      await fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message || "Upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await api.delete(`/kyc/documents/${docId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRiskScore(data.riskScore);
      setToast({ message: "Document removed", type: "success" });
      await fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/kyc/submit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ message: "Verification submitted!", type: "success" });
      await fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message || "Submission failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoVerify = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/kyc/auto-verify");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ message: data.message, type: data.status === "VERIFIED" ? "success" : "error" });
      await fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const goStep = (i: number) => {
    setSlideDir(i > currentStep ? "left" : "right");
    setCurrentStep(i);
  };

  const getDocByType = (type: string) => documents.find((d: any) => d.type === type);
  const statusCfg = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.UNVERIFIED;
  const StatusIcon = statusCfg.icon;
  const isPostSubmission = kycStatus === "PENDING" || kycStatus === "VERIFIED" || kycStatus === "REJECTED";

  if (loading) return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#475569" }}>Loading your verification...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <style>{`
        @keyframes fade-slide-in-left { 0%{opacity:0;transform:translateX(-20px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes fade-slide-in-right { 0%{opacity:0;transform:translateX(20px)} 100%{opacity:1;transform:translateX(0)} }
        .fade-slide-in-left { animation: fade-slide-in-left 0.4s ease-out; }
        .fade-slide-in-right { animation: fade-slide-in-right 0.4s ease-out; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes bounce-check { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .bounce-check { animation: bounce-check 0.5s ease-out; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b" style={{ background: "rgba(10,14,26,0.8)", borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/profile")} className="flex items-center gap-2 text-sm font-medium transition-all active:scale-95" style={{ color: "#94A3B8" }}>
            <ArrowLeft className="w-4 h-4" /> Profile
          </button>
          <h1 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#475569" }}>Identity Verification</h1>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-24 space-y-6">

        {/* ═══ STATUS BAR ═══ */}
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "rgba(17,17,24,0.8)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: kycStatus === "VERIFIED" ? "#22C55E" : kycStatus === "REJECTED" ? "#EF4444" : "#FFD700", boxShadow: `0 0 8px ${kycStatus === "VERIFIED" ? "rgba(34,197,94,0.4)" : kycStatus === "REJECTED" ? "rgba(239,68,68,0.4)" : "rgba(255,215,0,0.4)"}` }} />
          <div className="relative flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 glow-yellow" style={{ background: statusCfg.bg, boxShadow: kycStatus === "UNVERIFIED" ? "0 0 12px rgba(255,215,0,0.2)" : "none" }}>
              <StatusIcon className="w-6 h-6" style={{ color: statusCfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: "#E2E8F0" }}>{statusCfg.label}</h2>
                {kycStatus === "UNVERIFIED" && <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "#FFD700" }} />}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>
                {kycStatus === "UNVERIFIED" && "Complete the steps below to verify your identity."}
                {kycStatus === "PENDING" && "Your documents are being reviewed. This usually takes 24-48 hours."}
                {kycStatus === "VERIFIED" && "Your identity has been verified. You have full access."}
                {kycStatus === "REJECTED" && (rejectionReason || "Your verification was rejected. Please resubmit.")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Risk Score</p>
              <p className="text-2xl font-bold" style={{ color: riskScore >= 80 ? "#22C55E" : riskScore >= 50 ? "#FFD700" : "#EF4444" }}>{riskScore}</p>
            </div>
          </div>
        </div>

        {/* ═══ POST-SUBMISSION VIEW ═══ */}
        {isPostSubmission ? (
          <div className="space-y-5">
            <div className="rounded-2xl p-6" style={{ background: "rgba(17,17,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
              <h3 className="text-sm font-bold tracking-wide mb-4" style={{ color: "#E2E8F0" }}>Submitted Documents</h3>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-xs" style={{ color: "#475569" }}>No documents uploaded</p>
                ) : (
                  documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: doc.status === "APPROVED" ? "rgba(34,197,94,0.12)" : doc.status === "REJECTED" ? "rgba(239,68,68,0.12)" : "rgba(255,215,0,0.12)" }}>
                          {doc.status === "APPROVED" ? <CheckCircle2 className="w-4 h-4" style={{ color: "#22C55E" }} /> :
                           doc.status === "REJECTED" ? <XCircle className="w-4 h-4" style={{ color: "#EF4444" }} /> :
                           <Clock className="w-4 h-4" style={{ color: "#FFD700" }} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{doc.type.split('_').join(' ')}</p>
                          <p className="text-[10px]" style={{ color: "#64748B" }}>{doc.file_name}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold uppercase px-2.5 py-1 rounded-full" style={{ background: doc.status === "APPROVED" ? "rgba(34,197,94,0.12)" : doc.status === "REJECTED" ? "rgba(239,68,68,0.12)" : "rgba(255,215,0,0.12)", color: doc.status === "APPROVED" ? "#22C55E" : doc.status === "REJECTED" ? "#EF4444" : "#FFD700" }}>{doc.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(17,17,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                <h3 className="text-sm font-bold tracking-wide mb-4" style={{ color: "#E2E8F0" }}>Review History</h3>
                <div className="space-y-3">
                  {reviews.map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#FFD700" }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#E2E8F0" }}>{r.action}</p>
                        {r.note && <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{r.note}</p>}
                        <p className="text-[9px] mt-1" style={{ color: "#475569" }}>{r.reviewed_by} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kycStatus === "PENDING" && (
              <button onClick={handleAutoVerify} disabled={submitting}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Simulate Auto-Verification</>}
              </button>
            )}

            {kycStatus === "REJECTED" && (
              <button onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post("/kyc/reset-status");
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setToast({ message: "KYC reset. You can now re-upload documents.", type: "success" });
                  await fetchStatus();
                  setCurrentStep(0);
                } catch (err: any) {
                  setToast({ message: err.message, type: "error" });
                } finally { setLoading(false); }
              }} disabled={loading}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resubmit Verification"}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ═══ STEP INDICATOR ═══ */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(17,17,24,0.6)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === currentStep;
                  const isDone = i < currentStep;
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => goStep(i)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isActive ? "rgba(255,215,0,0.15)" : isDone ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? "rgba(255,215,0,0.3)" : isDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                            boxShadow: isActive ? "0 0 15px rgba(255,215,0,0.2)" : "none",
                            transform: isActive ? "scale(1.1)" : "none",
                            cursor: i <= currentStep ? "pointer" : "default",
                          }}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4 bounce-check" style={{ color: "#22C55E" }} /> : <StepIcon className="w-4 h-4" style={{ color: isActive ? "#FFD700" : "#475569" }} />}
                        </button>
                        <span className="text-[7px] font-bold uppercase tracking-widest hidden sm:block" style={{ color: isActive ? "#FFD700" : isDone ? "#22C55E" : "#475569" }}>{step.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-px mx-3" style={{ background: isDone ? "rgba(34,197,94,0.3)" : currentStep > i ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ STEP CONTENT ═══ */}
            <div className="rounded-2xl p-6 md:p-8 min-h-[320px]" style={{ background: "rgba(17,17,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
              <div className={currentStep === 0 ? "fade-slide-in-left" : slideDir === "left" ? "fade-slide-in-left" : "fade-slide-in-right"}>

                {/* Step 0: Overview */}
                {currentStep === 0 && (
                  <div className="space-y-8 text-center py-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto p-2.5" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
                      <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E2E8F0" }}>Verify Your Identity</h2>
                      <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                        To comply with financial regulations and secure your account, please complete the identity verification process.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {[
                        { icon: FileText, label: "Government ID", desc: "Passport or national ID", color: "#FFD700" },
                        { icon: Camera, label: "Selfie Photo", desc: "Clear face photo", color: "#6366F1" },
                        { icon: MapPin, label: "Address Proof", desc: "Utility bill / statement", color: "#22C55E" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="group relative p-6 rounded-2xl text-center space-y-3 transition-all duration-300 cursor-default"
                          style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(255,215,0,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-300" style={{ background: `${item.color}15` }}>
                            <item.icon className="w-5 h-5" style={{ color: item.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>{item.label}</p>
                            <p className="text-[10px] mt-1" style={{ color: "#64748B" }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => goStep(1)}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 mx-auto"
                      style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}
                    >
                      Start Verification <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 1: Government ID */}
                {currentStep === 1 && (
                  <UploadStep
                    title="Upload Government ID"
                    description="Upload a clear photo of your passport, national ID card, or driver's license."
                    type="GOVERNMENT_ID"
                    existingDoc={getDocByType("GOVERNMENT_ID")}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDoc}
                    uploading={uploading}
                    dual
                  />
                )}

                {/* Step 2: Selfie */}
                {currentStep === 2 && (
                  <UploadStep
                    title="Take a Selfie"
                    description="Upload a clear, well-lit photo of your face. Make sure it matches the ID you provided."
                    type="SELFIE"
                    existingDoc={getDocByType("SELFIE")}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDoc}
                    uploading={uploading}
                    isSelfie
                  />
                )}

                {/* Step 3: Address Proof */}
                {currentStep === 3 && (
                  <UploadStep
                    title="Address Verification"
                    description="Upload a utility bill, bank statement, or government document showing your current address (issued within the last 3 months)."
                    type="ADDRESS_PROOF"
                    existingDoc={getDocByType("ADDRESS_PROOF")}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDoc}
                    uploading={uploading}
                  />
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 4 && (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-bold" style={{ color: "#E2E8F0" }}>Review &amp; Submit</h3>
                      <p className="text-xs" style={{ color: "#64748B" }}>Review your uploaded documents before submitting for verification.</p>
                    </div>

                    <div className="space-y-3">
                      {["GOVERNMENT_ID", "SELFIE", "ADDRESS_PROOF"].map(type => {
                        const doc = getDocByType(type);
                        return (
                          <div key={type} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center gap-3">
                              {doc ? <CheckCircle2 className="w-5 h-5 bounce-check" style={{ color: "#22C55E" }} /> : <XCircle className="w-5 h-5" style={{ color: "#475569" }} />}
                              <div>
                                <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#E2E8F0" }}>{type.split('_').join(' ')}</p>
                                <p className="text-[10px]" style={{ color: "#64748B" }}>{doc ? doc.file_name : "Not uploaded"}</p>
                              </div>
                            </div>
                            {doc ? (
                              <span className="text-[8px] font-bold uppercase px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>Ready</span>
                            ) : (
                              <button onClick={() => goStep(type === "GOVERNMENT_ID" ? 1 : type === "SELFIE" ? 2 : 3)} className="text-[10px] font-bold" style={{ color: "#FFD700" }}>Upload</button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)" }}>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#64748B" }}>Estimated Risk Score</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>≥80 qualifies for auto-approval</p>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: riskScore >= 80 ? "#22C55E" : riskScore >= 50 ? "#FFD700" : "#EF4444" }}>{riskScore}</p>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting || documents.length === 0}
                      className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                      style={{ background: submitting || documents.length === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #FFD700, #FFE135)", color: submitting || documents.length === 0 ? "#475569" : "#0A0E1A", boxShadow: submitting || documents.length === 0 ? "none" : "0 4px 15px rgba(255,215,0,0.25)" }}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck className="w-4 h-4" /> Submit for Verification</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ NAVIGATION ═══ */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => goStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 text-xs font-semibold transition-all disabled:opacity-30"
                style={{ color: "#94A3B8" }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {currentStep < 4 && (
                <button
                  onClick={() => goStep(Math.min(4, currentStep + 1))}
                  className="flex items-center gap-2 text-xs font-bold transition-all"
                  style={{ color: "#FFD700" }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}

// ──── Reusable Upload Step ────
function UploadStep({
  title, description, type, existingDoc, onUpload, onDelete, uploading, isSelfie = false, dual = false
}: {
  title: string;
  description: string;
  type: string;
  existingDoc: any;
  onUpload: (file: File, type: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  isSelfie?: boolean;
  dual?: boolean;
}) {
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [dragOver1, setDragOver1] = useState(false);
  const [dragOver2, setDragOver2] = useState(false);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const handleFile = (file: File, side?: number) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (dual) {
          if (side === 1) setPreview1(e.target?.result as string);
          else setPreview2(e.target?.result as string);
        } else {
          setPreview1(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
      onUpload(file, type);
    }
  };

  const UploadZone = ({ side, inputRef, dragOver, setDragOver, preview, setPreview }: any) => (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], side); }}
      onClick={() => inputRef.current?.click()}
      className="rounded-2xl p-8 text-center cursor-pointer transition-all duration-300"
      style={{
        background: dragOver ? "rgba(255,215,0,0.06)" : "rgba(26,26,46,0.4)",
        border: `2px dashed ${dragOver ? "rgba(255,215,0,0.5)" : preview ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.12)"}`,
      }}
      onMouseEnter={e => { if (!preview) { e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)"; e.currentTarget.style.background = "rgba(26,26,46,0.6)"; } }}
      onMouseLeave={e => { if (!preview) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(26,26,46,0.4)"; } }}
    >
      <input ref={inputRef} type="file" accept={isSelfie ? "image/*" : "image/*,.pdf"} className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], side)} />
      {uploading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#FFD700" }} />
      ) : preview ? (
        <div className="relative">
          <img loading="lazy" src={preview} alt="Preview" className="max-h-32 mx-auto rounded-xl" />
          <button onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.8)" }}>
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
            {isSelfie ? <Camera className="w-6 h-6" style={{ color: "#6366F1" }} /> : <Upload className="w-6 h-6" style={{ color: "#FFD700" }} />}
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "#94A3B8" }}>{isSelfie ? "Upload your selfie" : "Click or drag to upload"}</p>
            <p className="text-[9px] mt-1" style={{ color: "#475569" }}>JPG, PNG, WEBP or PDF · Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold" style={{ color: "#E2E8F0" }}>{title}</h3>
        <p className="text-xs" style={{ color: "#64748B" }}>{description}</p>
      </div>

      {existingDoc && !dual ? (
        <div className="p-5 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 bounce-check" style={{ color: "#22C55E" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{existingDoc.file_name}</p>
                <p className="text-[10px]" style={{ color: "#64748B" }}>Uploaded {new Date(existingDoc.created_at).toLocaleDateString("en-GB")}</p>
              </div>
            </div>
            <button onClick={() => onDelete(existingDoc.id)} className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ color: "#EF4444" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dual ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: "#475569" }}>Recto (Front)</p>
                <UploadZone side={1} inputRef={fileRef1} dragOver={dragOver1} setDragOver={setDragOver1} preview={preview1} setPreview={setPreview1} />
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: "#475569" }}>Verso (Back)</p>
                <UploadZone side={2} inputRef={fileRef2} dragOver={dragOver2} setDragOver={setDragOver2} preview={preview2} setPreview={setPreview2} />
              </div>
            </div>
          ) : (
            <UploadZone side={1} inputRef={fileRef1} dragOver={dragOver1} setDragOver={setDragOver1} preview={preview1} setPreview={setPreview1} />
          )}

          {(preview1 || preview2) && (
            <p className="text-[10px] text-center animate-in fade-in" style={{ color: "#22C55E" }}>
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />File selected — proceed to next step
            </p>
          )}
        </div>
      )}
    </div>
  );
}
