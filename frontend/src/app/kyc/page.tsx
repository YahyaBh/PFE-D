"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Upload, Camera, MapPin, FileCheck, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, Trash2,
  FileText, Image, ChevronLeft, Sparkles
} from "lucide-react";
import Toast from "@/components/ui/Toast";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

const STEPS = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "government_id", label: "Government ID", icon: FileText },
  { id: "selfie", label: "Selfie", icon: Camera },
  { id: "address", label: "Address Proof", icon: MapPin },
  { id: "review", label: "Review & Submit", icon: FileCheck },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
  UNVERIFIED: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "Unverified", icon: Shield },
  PENDING: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Pending Review", icon: Clock },
  VERIFIED: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", label: "Verified", icon: CheckCircle2 },
  REJECTED: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Rejected", icon: XCircle },
};

export default function KYCPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  const [kycStatus, setKycStatus] = useState("UNVERIFIED");
  const [riskScore, setRiskScore] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/kyc/status", { headers });
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

      const res = await fetch("http://localhost:5000/api/kyc/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
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
      const res = await fetch(`http://localhost:5000/api/kyc/documents/${docId}`, {
        method: "DELETE", headers
      });
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
      const res = await fetch("http://localhost:5000/api/kyc/submit", {
        method: "POST", headers
      });
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
      const res = await fetch("http://localhost:5000/api/kyc/auto-verify", {
        method: "POST", headers
      });
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

  const getDocByType = (type: string) => documents.find((d: any) => d.type === type);
  const statusCfg = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.UNVERIFIED;
  const StatusIcon = statusCfg.icon;
  const isPostSubmission = kycStatus === "PENDING" || kycStatus === "VERIFIED" || kycStatus === "REJECTED";

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/profile")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Profile</span>
          </button>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Identity Verification</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ───── Status Banner ───── */}
        <div className={cn(
          "p-6 rounded-[2.5rem] border flex items-center gap-5",
          statusCfg.bg, statusCfg.border
        )}>
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", statusCfg.bg)}>
            <StatusIcon className={cn("w-7 h-7", statusCfg.color)} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black">{statusCfg.label}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {kycStatus === "UNVERIFIED" && "Complete the steps below to verify your identity."}
              {kycStatus === "PENDING" && "Your documents are being reviewed. This usually takes 24-48 hours."}
              {kycStatus === "VERIFIED" && "Your identity has been verified. You have full access."}
              {kycStatus === "REJECTED" && (rejectionReason || "Your verification was rejected. Please resubmit.")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Risk Score</p>
            <p className={cn("text-2xl font-black", riskScore >= 80 ? "text-green-500" : riskScore >= 50 ? "text-amber-500" : "text-red-500")}>{riskScore}</p>
          </div>
        </div>

        {/* ───── Post-submission Status View ───── */}
        {isPostSubmission ? (
          <div className="space-y-4">
            {/* Documents */}
            <div className="p-6 rounded-[2.5rem] bg-card border border-border space-y-4">
              <h3 className="font-bold text-sm">Submitted Documents</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              ) : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                        doc.status === "APPROVED" ? "bg-green-500/10" : doc.status === "REJECTED" ? "bg-red-500/10" : "bg-amber-500/10"
                      )}>
                        {doc.status === "APPROVED" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                         doc.status === "REJECTED" ? <XCircle className="w-5 h-5 text-red-500" /> :
                         <Clock className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-widest">{doc.type.split('_').join(' ')}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.file_name}</p>
                      </div>
                    </div>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-full border",
                      doc.status === "APPROVED" ? "text-green-500 bg-green-500/10 border-green-500/20" :
                      doc.status === "REJECTED" ? "text-red-500 bg-red-500/10 border-red-500/20" :
                      "text-amber-500 bg-amber-500/10 border-amber-500/20"
                    )}>{doc.status}</span>
                  </div>
                ))
              )}
            </div>

            {/* Review History */}
            {reviews.length > 0 && (
              <div className="p-6 rounded-[2.5rem] bg-card border border-border space-y-3">
                <h3 className="font-bold text-sm">Review History</h3>
                {reviews.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-background border border-border rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{r.action}</p>
                      {r.note && <p className="text-[10px] text-muted-foreground mt-0.5">{r.note}</p>}
                      <p className="text-[9px] text-muted-foreground/60 mt-1">
                        {r.reviewed_by} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-verify Demo Button (for PENDING status) */}
            {kycStatus === "PENDING" && (
              <button
                onClick={handleAutoVerify}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-500/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Simulate Auto-Verification</>}
              </button>
            )}

            {/* Resubmit if rejected */}
            {kycStatus === "REJECTED" && (
              <button
                onClick={() => { setCurrentStep(0); setKycStatus("UNVERIFIED"); }}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                Resubmit Verification
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ───── Step Indicators ───── */}
            <div className="flex items-center justify-between px-2">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <div key={step.id} className="flex items-center gap-1">
                    <button
                      onClick={() => i <= currentStep && setCurrentStep(i)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                        isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" :
                        isDone ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={cn("w-8 h-0.5 rounded-full", isDone ? "bg-green-500/30" : "bg-muted")} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ───── Step Content ───── */}
            <div className="p-6 rounded-[2.5rem] bg-card border border-border min-h-[300px]">

              {/* Step 0: Overview */}
              {currentStep === 0 && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto p-3 shadow-lg border border-foreground/5">
                    <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-xl font-black">Verify Your Identity</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    To comply with financial regulations and secure your account, please complete the identity verification process.
                  </p>
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {[
                      { icon: FileText, label: "Government ID", desc: "Passport or national ID" },
                      { icon: Camera, label: "Selfie Photo", desc: "Clear face photo" },
                      { icon: MapPin, label: "Address Proof", desc: "Utility bill / statement" },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-background border border-border rounded-2xl text-center space-y-2">
                        <item.icon className="w-5 h-5 text-primary mx-auto" />
                        <p className="text-[10px] font-bold text-foreground">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-2xl transition-all text-sm shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
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
                <div className="space-y-5">
                  <h3 className="text-lg font-black">Review & Submit</h3>
                  <p className="text-sm text-slate-400">Review your uploaded documents before submitting for verification.</p>

                   <div className="space-y-3">
                    {["GOVERNMENT_ID", "SELFIE", "ADDRESS_PROOF"].map(type => {
                      const doc = getDocByType(type);
                      return (
                        <div key={type} className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                          <div className="flex items-center gap-3">
                            {doc ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-muted-foreground/30" />}
                            <div>
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">{type.split('_').join(' ')}</p>
                              <p className="text-[10px] text-muted-foreground">{doc ? doc.file_name : "Not uploaded"}</p>
                            </div>
                          </div>
                          {doc ? (
                            <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-full">READY</span>
                          ) : (
                            <button onClick={() => setCurrentStep(type === "GOVERNMENT_ID" ? 1 : type === "SELFIE" ? 2 : 3)} className="text-xs text-primary font-bold hover:text-primary/80">Upload</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Risk Score Preview */}
                  <div className="p-4 bg-background border border-border rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estimated Risk Score</p>
                      <p className="text-xs text-muted-foreground mt-0.5">≥80 qualifies for auto-approval</p>
                    </div>
                    <p className={cn("text-3xl font-black", riskScore >= 80 ? "text-green-500" : riskScore >= 50 ? "text-amber-500" : "text-red-500")}>{riskScore}</p>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || documents.length === 0}
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck className="w-4 h-4" /> Submit for Verification</>}
                  </button>
                </div>
              )}
            </div>

            {/* ───── Step Navigation ───── */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {currentStep < 4 && (
                <button
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-all font-bold"
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
  title, description, type, existingDoc, onUpload, onDelete, uploading, isSelfie = false
}: {
  title: string;
  description: string;
  type: string;
  existingDoc: any;
  onUpload: (file: File, type: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  isSelfie?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (file) onUpload(file, type);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {existingDoc ? (
        <div className="p-5 bg-background border border-green-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-bold text-sm text-foreground">{existingDoc.file_name}</p>
                <p className="text-[10px] text-muted-foreground">Uploaded {new Date(existingDoc.created_at).toLocaleDateString("en-GB")}</p>
              </div>
            </div>
            <button onClick={() => onDelete(existingDoc.id)} className="text-red-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50 bg-background"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept={isSelfie ? "image/*" : "image/*,.pdf"}
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                {isSelfie ? <Camera className="w-7 h-7 text-muted-foreground" /> : <Upload className="w-7 h-7 text-muted-foreground" />}
              </div>
              <p className="text-sm font-bold text-foreground">
                {isSelfie ? "Upload your selfie" : "Drop file here or click to browse"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP or PDF · Max 10MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
