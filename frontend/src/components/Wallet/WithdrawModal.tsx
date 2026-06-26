"use client";

import { useState, useEffect } from "react";
import { X, Landmark, CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, Wallet, ArrowRight as ArrowRightIcon, ShieldCheck, Activity } from "lucide-react";

import { apiFetch } from "@/lib/api";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  currency: string;
  onSuccess: () => void;
  wallets?: { id: string; currency: string; balance: number; type?: string }[];
}

type WithdrawMethod = "bank" | "card" | "crypto";

export default function WithdrawModal({ isOpen, onClose, balance, currency, onSuccess, wallets = [] }: WithdrawModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [destAddress, setDestAddress] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("");

  useEffect(() => {
    if (isOpen) {
      apiFetch("/limits")
        .then(r => r.json())
        .then(setLimits)
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > balance) {
        setError("Insufficient liquidity");
        return;
    }

    setLoading(true);
    setError("");

    try {
      const body: any = { 
        amount: parseFloat(amount),
        currency: method === 'crypto' ? cryptoCurrency : currency,
        method
      };
      if (method === 'crypto' && destAddress) {
        body.destinationAddress = destAddress;
      }
      const res = await apiFetch("/transactions/withdraw", {
        method: "POST",
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discharge failed");
      
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
    setMethod(null);
    setAmount("");
    setError("");
    onClose();
  };

  const methods = [
    { id: "bank", name: "Bank Account", icon: Landmark, color: "#8B5CF6", desc: "Withdraw to your bank account" },
    { id: "card", name: "Debit Card", icon: CreditCard, color: "#FFD700", desc: "Withdraw to your Visa or Mastercard" },
    { id: "crypto", name: "Crypto Wallet", icon: Wallet, color: "#F7931A", desc: "Withdraw BTC, ETH or USDT" },
  ];

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
              <ArrowRightIcon className="w-5 h-5 rotate-180" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Withdraw Funds</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Safe and secure withdrawals</p>
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

          {/* Step 1: Select Method */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in duration-700">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Choose a withdrawal method</p>
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as WithdrawMethod);
                    setStep(2);
                  }}
                  className="w-full p-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${m.color}15` }}>
                      <m.icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{m.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: "#475569" }} />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Amount Input */}
          {step === 2 && method && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {/* Method badge */}
              <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${methods.find(m => m.id === method)?.color}15` }}>
                  {(() => {
                    const Icon = methods.find(m => m.id === method)?.icon || Wallet;
                    return <Icon className="w-5 h-5" style={{ color: methods.find(m => m.id === method)?.color }} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {method === 'bank' ? 'Bank Withdrawal' : method === 'crypto' ? 'Crypto Withdrawal' : 'Card Withdrawal'}
                  </p>
                  <p className="text-[10px]" style={{ color: "#64748B" }}>Secure withdrawal gateway</p>
                </div>
              </div>

              {/* Crypto currency selector */}
              {method === 'crypto' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Crypto Currency</label>
                  <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {['BTC', 'ETH', 'USDT'].map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCryptoCurrency(c); setAmount(""); }}
                        className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: cryptoCurrency === c ? "linear-gradient(135deg, #FFD700, #FFE135)" : "transparent",
                          color: cryptoCurrency === c ? "#0A0E1A" : "#475569",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination address (crypto) */}
              {method === 'crypto' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Destination Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter the recipient's vault address"
                    className="w-full rounded-2xl py-4 px-5 text-sm font-mono outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#E2E8F0",
                    }}
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount to Withdraw</label>
                  <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Available: {(method === 'crypto' ? wallets.find((w: any) => w.currency === cryptoCurrency)?.balance || 0 : balance).toFixed(method === 'crypto' ? 8 : 0)} {method === 'crypto' ? cryptoCurrency : currency}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>{method === 'crypto' ? cryptoCurrency : currency}</span>
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

              {/* Fee breakdown */}
              {amount && parseFloat(amount) > 0 && (() => {
                const feePercent = method === 'crypto' ? 0 : (currency === 'EUR' || currency === 'USD' ? 2.5 : 2.0);
                const fee = parseFloat(amount) * (feePercent / 100);
                const totalDeducted = parseFloat(amount) + fee;
                return (
                  <div className="p-4 rounded-2xl space-y-2 text-xs" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex justify-between" style={{ color: "#64748B" }}>
                      <span>Withdrawal amount</span>
                      <span className="text-white">{parseFloat(amount).toFixed(method === 'crypto' ? 8 : 2)} {method === 'crypto' ? cryptoCurrency : currency}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: "#64748B" }}>
                      <span>Fee ({feePercent}%)</span>
                      <span style={{ color: "#EF4444" }}>{fee.toFixed(method === 'crypto' ? 8 : 2)} {method === 'crypto' ? cryptoCurrency : currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#E2E8F0" }}>
                      <span>Total deducted</span>
                      <span className="text-white">{totalDeducted.toFixed(method === 'crypto' ? 8 : 2)} {method === 'crypto' ? cryptoCurrency : currency}</span>
                    </div>
                    {method === 'crypto' && destAddress && (
                      <div className="flex justify-between pt-1" style={{ color: "#64748B" }}>
                        <span>Destination</span>
                        <span className="text-[9px] font-mono text-white truncate max-w-[160px]">{destAddress}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Info */}
              {limits && amount && parseFloat(amount) > 0 && method !== 'crypto' && (
                <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Activity className="w-5 h-5 shrink-0" style={{ color: "#475569" }} />
                  <p className="text-[10px] leading-relaxed" style={{ color: "#64748B" }}>Withdrawals are usually processed within 24-48 hours.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                >
                  Back
                </button>
                <button
                  disabled={!amount || loading || parseFloat(amount) <= 0 || (method === 'crypto' ? parseFloat(amount) > (wallets.find((w: any) => w.currency === cryptoCurrency)?.balance || 0) || !cryptoCurrency || !destAddress : parseFloat(amount) > balance)}
                  onClick={handleWithdraw}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  style={{
                    background: !amount || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: !amount || loading ? "#475569" : "#0A0E1A",
                    boxShadow: !amount || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Withdrawal <ArrowRight className="w-4 h-4" /></>}
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
                <h3 className="text-xl font-bold text-white">Withdrawal Requested</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  Withdrawal of <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} {method === 'crypto' ? cryptoCurrency : currency}</span> to your {method === 'crypto' ? <span className="text-[9px] font-mono text-white">{destAddress}</span> : <span className="font-semibold text-white">{method === 'bank' ? 'Bank Account' : 'Debit Card'}</span>}.
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
