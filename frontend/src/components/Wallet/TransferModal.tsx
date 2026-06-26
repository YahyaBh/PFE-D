"use client";

import { useState, useEffect } from "react";
import { X, Search, User, ArrowRight, Loader2, CheckCircle2, AlertCircle, Zap, ShieldAlert, ChevronDown } from "lucide-react";

import { apiFetch } from "@/lib/api";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderBalance: number;
  onSuccess: () => void;
  wallets?: { currency: string; balance: number; type?: string }[];
}

export default function TransferModal({ isOpen, onClose, senderBalance, onSuccess, wallets = [] }: TransferModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [sourceCurrency, setSourceCurrency] = useState("MAD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<any>(null);

  const activeBalance = wallets.find(w => w.currency === sourceCurrency)?.balance || senderBalance;
  const isCrossCurrency = sourceCurrency !== "MAD";

  useEffect(() => {
    if (isOpen) {
      apiFetch("/limits")
        .then(r => r.json())
        .then(setLimits)
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowCurrencyDropdown(false); if (!showCurrencyDropdown) onClose(); }
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showCurrencyDropdown, onClose]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`/transactions/search?query=${encodeURIComponent(searchQuery)}`);
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

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > activeBalance) {
      setError("Insufficient liquidity");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({ 
          receiverId: recipient.id, 
          amount: parseFloat(amount),
          currency: sourceCurrency,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer sync failed");
      
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
    setError("");
    onClose();
  };

  const availableCurrencies = wallets.filter(w => w.currency !== 'BTC' && w.currency !== 'ETH' && w.currency !== 'USDT').map(w => w.currency);
  const cryptoCurrencies = wallets.filter(w => w.type === 'crypto').map(w => w.currency);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      <div className="fixed inset-0" onClick={reset} style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(24px)" }} />
      
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />
        
        <div className="px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
              <Zap className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Send Money</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Secure Transfer</p>
            </div>
          </div>
          <button onClick={reset} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 active:scale-90" style={{ color: "#64748B" }}>
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

          {step === 1 && (
            <form onSubmit={handleSearch} className="space-y-6 animate-in fade-in duration-700">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Who are you sending to?</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Email or phone number"
                    className="w-full rounded-2xl py-4 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-xs"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
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

          {step === 2 && recipient && (
            <div className="space-y-6 animate-in fade-in duration-700">
              <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,215,0,0.1)" }}>
                  <User className="w-5 h-5" style={{ color: "#FFD700" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{recipient.name}</p>
                  <p className="text-[11px] truncate" style={{ color: "#64748B" }}>{recipient.email || recipient.phone}</p>
                </div>
              </div>

              {/* Source currency picker */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>From wallet</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="w-full rounded-2xl py-4 px-5 flex items-center justify-between transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{sourceCurrency}</span>
                      <span className="text-[10px]" style={{ color: "#64748B" }}>
                        Balance: {(wallets.find(w => w.currency === sourceCurrency)?.balance || 0).toFixed(2)}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: "#475569" }} />
                  </button>
                  {showCurrencyDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-30 shadow-2xl" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
                      {availableCurrencies.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setSourceCurrency(c); setShowCurrencyDropdown(false); }}
                          className="w-full px-5 py-4 text-sm font-semibold text-left hover:bg-white/5 transition-all flex items-center justify-between"
                          style={{ color: c === sourceCurrency ? "#FFD700" : "#94A3B8" }}
                        >
                          <span>{c}</span>
                          <span className="text-[10px]" style={{ color: "#475569" }}>
                            {(wallets.find(w => w.currency === c)?.balance || 0).toFixed(2)}
                          </span>
                        </button>
                      ))}
                      {cryptoCurrencies.length > 0 && (
                        <>
                          <div className="px-5 py-2 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#475569", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            Crypto Vaults
                          </div>
                          {cryptoCurrencies.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setSourceCurrency(c); setShowCurrencyDropdown(false); }}
                              className="w-full px-5 py-4 text-sm font-semibold text-left hover:bg-white/5 transition-all flex items-center justify-between"
                              style={{ color: c === sourceCurrency ? "#FFD700" : "#94A3B8" }}
                            >
                              <span>{c}</span>
                              <span className="text-[10px]" style={{ color: "#475569" }}>
                                {(wallets.find(w => w.currency === c)?.balance || 0).toFixed(8)}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount</label>
                  <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Available: {activeBalance.toFixed(2)} {sourceCurrency}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>{sourceCurrency}</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-2xl py-5 pl-16 pr-5 text-3xl font-bold text-right outline-none transition-all placeholder:text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {limits && amount && parseFloat(amount) > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Daily Limit", usage: limits.usage?.transfer?.daily || 0, limit: limits.limits?.daily_transfer_limit || 50000 },
                    { label: "Monthly Limit", usage: limits.usage?.transfer?.monthly || 0, limit: limits.limits?.monthly_transfer_limit || 500000 }
                  ].map((item, i) => {
                    const exceeds = parseFloat(amount) + item.usage > item.limit;
                    return (
                      <div key={i} className="p-4 rounded-2xl" style={{ background: exceeds ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${exceeds ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: exceeds ? "#EF4444" : "#64748B" }}>{item.label}</span>
                          {exceeds && <ShieldAlert className="w-3 h-3" style={{ color: "#EF4444" }} />}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "#94A3B8" }}>{item.limit.toLocaleString()} {sourceCurrency}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {amount && parseFloat(amount) > 0 && (
                <div className="p-3 rounded-2xl flex items-center gap-3 text-xs" style={{ background: isCrossCurrency ? "rgba(255,215,0,0.05)" : "rgba(34,197,94,0.05)", border: `1px solid ${isCrossCurrency ? "rgba(255,215,0,0.1)" : "rgba(34,197,94,0.1)"}` }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: isCrossCurrency ? "rgba(255,215,0,0.15)" : "rgba(34,197,94,0.15)", color: isCrossCurrency ? "#FFD700" : "#22C55E" }}>✓</span>
                  <span style={{ color: isCrossCurrency ? "#FFD700" : "#22C55E" }}>
                    {isCrossCurrency ? "Cross-currency transfer — 2.5% conversion fee applies" : "Free transfer — 0% P2P fee"}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}>
                  Back
                </button>
                <button
                  disabled={!amount || loading || parseFloat(amount) <= 0 || parseFloat(amount) > activeBalance}
                  onClick={handleTransfer}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  style={{
                    background: !amount || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: !amount || loading ? "#475569" : "#0A0E1A",
                    boxShadow: !amount || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Now <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 px-4 space-y-6 animate-in zoom-in-95 duration-700">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(255,215,0,0.15)", filter: "blur(20px)" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#FFD700" }} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Transfer Successful</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  Sent <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} {sourceCurrency}</span> to <span className="font-semibold text-white">{recipient.name.split(' ')[0]}</span>.
                </p>
              </div>
              <button onClick={reset} className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95" style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
