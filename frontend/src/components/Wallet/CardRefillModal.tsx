"use client";

import { useState, useEffect } from "react";
import { X, Wallet, ArrowRight, Loader2, AlertCircle, CreditCard, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface CardRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    cardName: string;
    cardNumber: string;
    balance: string | number;
    status: string;
  } | null;
  walletBalance: number;
  onSuccess: (newBalance: string) => void;
}

export default function CardRefillModal({ isOpen, onClose, card, walletBalance, onSuccess }: CardRefillModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversionFee, setConversionFee] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount("");
      setError("");
      setConversionFee(0);
    }
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const last4 = card.cardNumber?.slice(-4) || "0000";
  const parsedBalance = typeof card.balance === "string" ? parseFloat(card.balance) : card.balance;
  const parsedWallet = walletBalance || 0;
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.015; // 1.5% conversion fee for MAD refill
  const totalNeeded = amountNum; // No conversion needed since cards are MAD-only and wallet is MAD

  const handleSubmit = async () => {
    if (amountNum <= 0) return;
    if (amountNum > parsedWallet) {
      setError("Insufficient wallet balance");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/cards/refill", {
        cardId: card.id,
        amount: amountNum,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refill failed");

      setStep(2);
      onSuccess(data.newBalance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setAmount("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={reset}
        style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(24px)" }}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />

        {/* Header */}
        <div className="px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
              <CreditCard className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Refill Card</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Add funds to your virtual card</p>
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
          {/* Card Info */}
          <div
            className="p-4 rounded-2xl flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,215,0,0.1)" }}
            >
              <CreditCard className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{card.cardName}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>
                •••• {last4} &middot; Current balance: {parsedBalance.toFixed(2)} MAD
              </p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div
            className="p-4 rounded-2xl flex items-center gap-4"
            style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}
          >
            <Wallet className="w-5 h-5 shrink-0" style={{ color: "#22C55E" }} />
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "#22C55E" }}>
                Wallet Balance: {parsedWallet.toFixed(2)} MAD
              </p>
            </div>
          </div>

          {error && (
            <div
              className="p-4 rounded-2xl flex items-center gap-4"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* Step 1: Enter Amount */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-700">
              <div className="space-y-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount to transfer</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl px-6 py-6 text-3xl font-bold outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#E2E8F0",
                      caretColor: "#FFD700",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                    autoFocus
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#475569" }}>MAD</span>
                </div>
              </div>

              {amountNum > 0 && amountNum <= parsedWallet && (
                <div
                  className="p-3 rounded-2xl text-[10px] font-medium space-y-1"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                >
                  <div className="flex justify-between">
                    <span>Refill amount</span>
                    <span className="text-white">{amountNum.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining wallet balance</span>
                    <span className="text-white">{(parsedWallet - amountNum).toFixed(2)} MAD</span>
                  </div>
                </div>
              )}

              {amountNum > parsedWallet && (
                <p className="text-[11px] font-medium" style={{ color: "#EF4444" }}>
                  Insufficient wallet balance. You need {amountNum.toFixed(2)} MAD but only have {parsedWallet.toFixed(2)} MAD available.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || amountNum <= 0 || amountNum > parsedWallet}
                className="w-full py-4 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: "#0A0E1A",
                  cursor: (loading || amountNum <= 0 || amountNum > parsedWallet) ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => {
                  if (!loading && amountNum > 0 && amountNum <= parsedWallet) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #FFE135, #FFD700)";
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #FFD700, #FFE135)";
                }}
              >
                {loading ? <Loader2 className="w-5 h-5" style={{ animation: "spin 0.8s linear infinite" }} /> : <ArrowRight className="w-5 h-5" />}
                {loading ? "Processing..." : "Transfer Funds"}
              </button>
            </div>
          )}

          {/* Step 2: Success */}
          {step === 2 && (
            <div className="text-center py-6 space-y-6 animate-in fade-in duration-700">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "rgba(34,197,94,0.12)" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: "#22C55E" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Refill Successful</h3>
                <p className="text-sm" style={{ color: "#64748B" }}>
                  {amountNum.toFixed(2)} MAD has been transferred to {card.cardName}.
                </p>
              </div>
              <button
                onClick={reset}
                className="w-full py-4 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#E2E8F0",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
