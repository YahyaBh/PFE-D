"use client";

import { useState } from "react";
import { X, Search, User, ArrowRight, Loader2, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestModal({ isOpen, onClose, onSuccess }: RequestModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/transactions/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Node not found");
      setRecipient(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/transactions/request", { 
        recipientId: recipient.id, 
        amount: parseFloat(amount),
        note
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Requisition failed");
      
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSearchQuery("");
    setRecipient(null);
    setAmount("");
    setNote("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-in fade-in duration-700"
        onClick={reset}
        style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(24px)" }}
      />
      
      {/* Modal Card — dark glassmorphism matching dashboard widgets */}
      <div
        className="relative w-full max-w-lg rounded-3xl animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top glow accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />
        
        {/* Header */}
        <div className="px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Request Money</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Ask for a payment</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
            style={{ color: "#64748B" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* Step 1: Search Payer */}
          {step === 1 && (
            <form onSubmit={handleSearch} className="space-y-6 animate-in fade-in duration-700">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Who are you requesting from?</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Email or phone number"
                    className="w-full rounded-2xl py-4 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-xs"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#E2E8F0",
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button
                disabled={!searchQuery || loading}
                className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                style={{
                  background: !searchQuery || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: !searchQuery || loading ? "#475569" : "#0A0E1A",
                  boxShadow: !searchQuery || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Step 2: Amount & Note */}
          {step === 2 && recipient && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {/* Recipient card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,215,0,0.1)" }}>
                  <User className="w-5 h-5" style={{ color: "#FFD700" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{recipient.name}</p>
                  <p className="text-[11px] truncate" style={{ color: "#64748B" }}>{recipient.email || recipient.phone}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>How much?</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>MAD</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-2xl py-5 pl-16 pr-5 text-3xl font-bold text-right outline-none transition-all placeholder:text-sm"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#E2E8F0",
                    }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Add a note (Optional)</label>
                <textarea
                  placeholder="What is this request for?"
                  className="w-full rounded-2xl py-4 px-5 text-sm outline-none transition-all placeholder:text-xs resize-none min-h-[100px]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#E2E8F0",
                  }}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                >
                  Back
                </button>
                <button
                  disabled={!amount || loading || parseFloat(amount) <= 0}
                  onClick={handleRequest}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  style={{
                    background: !amount || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: !amount || loading ? "#475569" : "#0A0E1A",
                    boxShadow: !amount || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Request <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-12 px-4 space-y-6 animate-in zoom-in-95 duration-700">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(255,215,0,0.15)", filter: "blur(20px)" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#FFD700" }} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Request Sent</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  Request for <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} MAD</span> sent to <span className="font-semibold text-white">{recipient.name.split(' ')[0]}</span>.
                </p>
              </div>
              <button
                onClick={reset}
                className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: "#0A0E1A",
                  boxShadow: "0 4px 15px rgba(255,215,0,0.25)",
                }}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
