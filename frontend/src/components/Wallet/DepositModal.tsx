"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Landmark, ArrowRight, Loader2, AlertCircle, Wallet, Plus, ShieldCheck, ChevronRight, Activity, Zap, Copy, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
const QRCodeSVG = dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG), { ssr: false }) as any;
import { generateCryptoAddress, shortenAddress } from "@/lib/cryptoAddress";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets?: { id: string; currency: string; balance: number; type?: string; label?: string }[];
}

type DepositMethod = "card" | "bank" | "store" | "crypto";

const METHOD_MAP: Record<DepositMethod, string> = {
  card: "CARD",
  bank: "BANK_TRANSFER",
  store: "MARJANE_STORE",
  crypto: "CRYPTO",
};

export default function DepositModal({ isOpen, onClose, onSuccess, wallets = [] }: DepositModalProps) {
  const [step, setStep] = useState<1 | 2 | 2.5 | 3>(1);
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [madAmount, setMadAmount] = useState("");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get("/limits").then(r => r.json()).then(setLimits).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedCrypto || !madAmount || parseFloat(madAmount) <= 0) {
      setConvertedAmount(null);
      return;
    }
    setConverting(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.post("/exchange/convert", { amount: madAmount, from: "MAD", to: selectedCrypto });
        const data = await res.json();
        setConvertedAmount(data.amount != null && data.amount > 0 ? data.amount : null);
      } catch {
        setConvertedAmount(null);
      } finally {
        setConverting(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [madAmount, selectedCrypto]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !method) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/deposit/process", { 
        method: METHOD_MAP[method],
        amount: parseFloat(amount),
        currency,
        details: method === "card" ? { 
          ...cardDetails, 
          number: cardDetails.number.replace(/\s/g, '') 
        } : { simulated: true }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingress failed");
      
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
    setSelectedCrypto("");
    setMadAmount("");
    setConvertedAmount(null);
    setAmount("");
    setError("");
    onClose();
  };

  const methods = [
    { id: "card", name: "Virtual Card", icon: CreditCard, color: "#FFD700", desc: "Instant deposit from any card" },
    { id: "bank", name: "Bank Transfer", icon: Landmark, color: "#8B5CF6", desc: "Transfer from your bank account" },
    { id: "store", name: "In-Store Deposit", icon: Wallet, color: "#22C55E", desc: "Deposit at any Marjane checkout" },
    { id: "crypto", name: "Crypto Deposit", icon: Wallet, color: "#F7931A", desc: "Receive BTC, ETH or USDT" },
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
              <Plus className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Add Money</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Top up your wallet</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Choose a deposit method</p>
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as DepositMethod);
                    setSelectedCrypto("");
                    setMadAmount("");
                    setConvertedAmount(null);
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
                  <ChevronRight className="w-4 h-4" style={{ color: "#475569" }} />
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
                      {method === 'card' ? 'Card Deposit' : method === 'bank' ? 'Bank Transfer' : method === 'crypto' ? 'Crypto Deposit' : 'In-Store Deposit'}
                  </p>
                  <p className="text-[10px]" style={{ color: "#64748B" }}>Secure payment gateway</p>
                </div>
              </div>

              {method === 'crypto' ? (
                <div className="space-y-6 animate-in fade-in duration-700">
                  {!selectedCrypto ? (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                        Select a vault to receive crypto
                      </p>
                      <div className="space-y-3">
                        {wallets.filter((w: any) => w.type === 'crypto').map((vw: any) => (
                          <button
                            key={vw.id}
                            onClick={() => setSelectedCrypto(vw.currency)}
                            className="w-full p-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: vw.currency === 'BTC' ? 'rgba(247,147,26,0.2)' : vw.currency === 'ETH' ? 'rgba(98,126,234,0.2)' : 'rgba(38,161,123,0.2)', color: vw.currency === 'BTC' ? '#F7931A' : vw.currency === 'ETH' ? '#627EEA' : '#26A17B' }}>
                                {vw.currency === 'BTC' ? '₿' : vw.currency === 'ETH' ? 'Ξ' : '₮'}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold text-white">{vw.currency}</p>
                                <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#64748B" }}>{shortenAddress(generateCryptoAddress(vw.currency, vw.id))}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4" style={{ color: "#475569" }} />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => { setStep(1); setMethod(null); }}
                        className="w-full rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                      >
                        Back
                      </button>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const vw = wallets.find((w: any) => w.type === 'crypto' && w.currency === selectedCrypto);
                        if (!vw) return null;
                        const address = generateCryptoAddress(selectedCrypto, vw.id);
                        return (
                          <div className="flex flex-col items-center gap-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold" style={{ background: selectedCrypto === 'BTC' ? 'rgba(247,147,26,0.2)' : selectedCrypto === 'ETH' ? 'rgba(98,126,234,0.2)' : 'rgba(38,161,123,0.2)', color: selectedCrypto === 'BTC' ? '#F7931A' : selectedCrypto === 'ETH' ? '#627EEA' : '#26A17B' }}>
                                {selectedCrypto === 'BTC' ? '₿' : selectedCrypto === 'ETH' ? 'Ξ' : '₮'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{selectedCrypto} Vault</p>
                                <p className="text-[10px]" style={{ color: "#475569" }}>{vw.label || `${selectedCrypto} Vault`}</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-lg">
                              <QRCodeSVG value={vw.id} size={200} />
                            </div>
                            <div className="w-full flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <code className="flex-1 text-[11px] font-mono truncate" style={{ color: "#94A3B8" }}>{address}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(vw.id);
                                  setCopiedAddr(vw.id);
                                  setTimeout(() => setCopiedAddr(null), 2000);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: copiedAddr === vw.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", color: copiedAddr === vw.id ? "#22C55E" : "#64748B" }}
                              >
                                {copiedAddr === vw.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="w-full space-y-2">
                              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount (MAD)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#475569" }}>MAD</span>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  step="any"
                                  value={madAmount}
                                  onChange={(e) => setMadAmount(e.target.value)}
                                  className="w-full rounded-2xl py-4 pr-4 text-right text-lg font-bold outline-none transition-all"
                                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", paddingLeft: "4.5rem", color: "#E2E8F0" }}
                                />
                              </div>
                            </div>
                            {converting && (
                              <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#64748B" }} />
                                <span className="text-[11px]" style={{ color: "#64748B" }}>Converting...</span>
                              </div>
                            )}
                            {convertedAmount !== null && convertedAmount > 0 && (
                              <div className="w-full p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#22C55E" }}>Send exactly</p>
                                <p className="text-xl font-bold text-white mt-1">{convertedAmount.toFixed(8)} {selectedCrypto}</p>
                              </div>
                            )}
                            <p className="text-[10px] text-center" style={{ color: "#475569" }}>
                              Send {convertedAmount ? `exactly ${convertedAmount.toFixed(8)} ${selectedCrypto}` : `any amount of ${selectedCrypto}`} to this address. It will be credited after network confirmation.
                            </p>
                            <button
                              onClick={() => setSelectedCrypto("")}
                              className="w-full rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                            >
                              Change Currency
                            </button>
                            <button
                              onClick={reset}
                              className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                              style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}
                            >
                              Done
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              ) : (
                /* ─═══ FIAT DEPOSIT ═══─ */
                <>
              {/* Currency selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Currency</label>
                <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {(method === 'store' ? ["MAD"] : ["MAD", "USD", "EUR"]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: currency === c ? "linear-gradient(135deg, #FFD700, #FFE135)" : "transparent",
                        color: currency === c ? "#0A0E1A" : "#475569",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount</label>
                  <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Min. 10.00 {currency}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>{currency}</span>
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

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                >
                  Cancel
                </button>
                <button
                  disabled={!amount || loading || parseFloat(amount) < 10}
                  onClick={() => setStep(2.5)}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  style={{
                    background: !amount || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: !amount || loading ? "#475569" : "#0A0E1A",
                    boxShadow: !amount || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Fee info */}
              {amount && parseFloat(amount) > 0 && (() => {
                const feePercent = method === 'card' ? 1.5 : 1.0;
                const fee = parseFloat(amount) * (feePercent / 100);
                const credited = parseFloat(amount) - fee;
                return (
                  <div className="p-4 rounded-2xl space-y-2 text-xs" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex justify-between" style={{ color: "#64748B" }}>
                      <span>Deposit amount</span>
                      <span className="text-white">{parseFloat(amount).toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: "#64748B" }}>
                      <span>Fee ({feePercent}%)</span>
                      <span style={{ color: "#FFD700" }}>{fee.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#E2E8F0" }}>
                      <span>Total credited</span>
                      <span className="text-white">{credited.toFixed(2)} {currency}</span>
                    </div>
                  </div>
                );
              })()}
                </>
              )}
            </div>
          )}

          {/* Step 2.5: Payment Detail */}
          {step === 2.5 && method && (
            <div className="space-y-6 animate-in fade-in duration-700">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-bold text-white">Payment Details</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.15)" }}>
                  <Zap className="w-4 h-4" style={{ color: "#FFD700" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#FFD700" }}>
                    Amount: {parseFloat(amount).toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-2xl space-y-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {method === "bank" && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Beneficiary</p>
                      <p className="text-base font-bold text-white">Marjane Wallet</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>IBAN</p>
                      <p className="text-sm font-mono font-bold tracking-wider p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}>MA64 1234 5678 9012 3456 7890</p>
                    </div>
                    <div className="p-4 rounded-xl text-center space-y-1" style={{ background: "rgba(255,215,0,0.08)" }}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Reference</p>
                      <p className="text-lg font-bold tracking-wider font-mono" style={{ color: "#FFD700" }}>MJN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                  </div>
                )}

                {method === "store" && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl text-center space-y-1" style={{ background: "rgba(255,215,0,0.08)" }}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Reference Code</p>
                      <p className="text-lg font-bold tracking-wider font-mono" style={{ color: "#FFD700" }}>MJN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-semibold" style={{ color: "#64748B" }}>Show this code at any Marjane checkout to deposit cash.</p>
                    </div>
                  </div>
                )}

                {method === "card" && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Card Number</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-xl py-4 pl-4 pr-12 text-sm font-mono font-bold tracking-wider outline-none"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                          placeholder="0000 0000 0000 0000"
                          value={cardDetails.number}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setCardDetails({...cardDetails, number: raw.replace(/(.{4})/g, '$1 ').trim()});
                          }}
                        />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#475569" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Expiry</label>
                        <input
                          className="w-full rounded-xl py-4 px-4 text-sm font-mono font-bold tracking-wider text-center outline-none"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                            if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                            setCardDetails({...cardDetails, expiry: val});
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>CVV</label>
                        <input
                          type="password"
                          className="w-full rounded-xl py-4 px-4 text-sm font-mono font-bold tracking-wider text-center outline-none"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                          placeholder="•••"
                          maxLength={3}
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}
                >
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleDeposit}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  style={{
                    background: loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: loading ? "#475569" : "#0A0E1A",
                    boxShadow: loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Deposit <ArrowRight className="w-4 h-4" /></>}
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
                  <ShieldCheck className="w-10 h-10" style={{ color: "#FFD700" }} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Deposit Successful</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  Added <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} {currency}</span> via <span className="font-semibold text-white">{method === 'card' ? 'Card' : method === 'bank' ? 'Bank Transfer' : method === 'crypto' ? 'Crypto Deposit' : 'In-Store Deposit'}</span>.
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
