"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Landmark, Bitcoin, ArrowRight, Loader2, CheckCircle2, AlertCircle, ChevronRight, Wallet, Zap, Sparkles, ShieldCheck, Activity, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DepositMethod = "card" | "bank" | "crypto";

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [step, setStep] = useState<1 | 2 | 2.5 | 3>(1);
  const [method, setMethod] = useState<DepositMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
      fetch("http://localhost:5000/api/limits", {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).then(setLimits).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/deposit/process", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          method,
          amount: parseFloat(amount),
          currency,
          details: method === "card" ? { 
            ...cardDetails, 
            number: cardDetails.number.replace(/\s/g, '') 
          } : { simulated: true }
        })
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
    setAmount("");
    setError("");
    onClose();
  };

  const methods = [
    { id: "card", name: "Virtual Card Ingress", icon: CreditCard, color: "text-primary", bg: "bg-primary/5", desc: "INSTANT SETTLEMENT VIA GLOBAL NETWORK" },
    { id: "bank", name: "Bank Node Sync", icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-500/5", desc: "DIRECT LIQUIDITY FROM LOCAL ACCOUNTS" },
    { id: "crypto", name: "Cypher Asset Link", icon: Bitcoin, color: "text-orange-500", bg: "bg-orange-500/5", desc: "DECENTRALISED CAPITAL INJECTION" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-2xl animate-in fade-in duration-700"
        onClick={reset}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-card rounded-[4rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out overflow-hidden shadow-primary/5">
        
        {/* Header */}
        <div className="px-12 py-10 flex items-center justify-between bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-zellige-soft opacity-10 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                <Plus className="w-8 h-8 text-secondary" />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Add Money</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mt-1">Top up your wallet</p>
            </div>
          </div>
          <button 
            onClick={reset} 
            className="relative z-10 w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-primary transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-12 space-y-12">
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Select Method */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-700">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-foreground/20 ml-8 mb-4">Choose a deposit method</p>
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as DepositMethod);
                    setStep(2);
                  }}
                  className="w-full p-8 bg-white dark:bg-card border border-foreground/5 rounded-[3rem] flex items-center justify-between group hover:border-primary/20 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl shadow-primary/5 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-8">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:bg-primary group-hover:text-white", m.bg, m.color)}>
                      <m.icon className="w-10 h-10" />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="font-black text-2xl uppercase tracking-tighter text-foreground leading-none">
                        {m.id === 'card' ? 'Virtual Card' : m.id === 'bank' ? 'Bank Transfer' : 'Crypto Deposit'}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">
                        {m.id === 'card' ? 'Instant deposit from any card' : m.id === 'bank' ? 'Transfer from your bank account' : 'Deposit BTC, ETH or USDT'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-foreground/10 group-hover:text-primary transition-colors pr-2" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Amount Input */}
          {step === 2 && method && (
            <div className="space-y-12 animate-in slide-in-from-right duration-700 ease-out">
              <div className="flex items-center gap-8 p-10 bg-secondary/10 rounded-[3rem] border border-secondary/20 shadow-xl shadow-secondary/5">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-card flex items-center justify-center shadow-lg text-primary">
                   {(() => {
                        const Icon = methods.find(m => m.id === method)?.icon || Wallet;
                        return <Icon className="w-10 h-10" />;
                   })()}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-3xl uppercase tracking-tighter text-foreground leading-none">
                    {method === 'card' ? 'Card Deposit' : method === 'bank' ? 'Bank Transfer' : 'Crypto Deposit'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/30">Secure payment gateway</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20 ml-8">Choose Currency</label>
                  <div className="flex gap-4 p-2 bg-foreground/5 rounded-full">
                    {(method === 'crypto' ? ["BTC", "ETH", "USDT"] : ["MAD", "USD", "EUR"]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "flex-1 py-4 rounded-full transition-all font-black text-[10px] uppercase tracking-widest",
                          currency === c 
                            ? "bg-primary text-white shadow-xl" 
                            : "text-foreground/40 hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end px-6">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20">Amount</label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">Min. amount: 10.00 {currency}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-4xl font-black text-foreground/5 tracking-tighter italic">{currency}</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-foreground/5 border-none rounded-[3.5rem] py-12 pl-32 pr-12 text-7xl font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all text-right placeholder:text-foreground/5 shadow-inner"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 h-20 bg-foreground/5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  disabled={!amount || loading || parseFloat(amount) < 10}
                  onClick={() => setStep(2.5)}
                  className="flex-[2] h-20 bg-primary text-white rounded-full font-black flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-[12px] disabled:opacity-30 disabled:grayscale"
                >
                  Next <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2.5: Payment Detail */}
          {step === 2.5 && method && (
            <div className="space-y-10 animate-in slide-in-from-right duration-700 ease-out">
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black uppercase tracking-tighter">Payment Details</h3>
                    <div className="inline-flex items-center gap-4 px-8 py-3 bg-primary/5 rounded-full">
                        <Zap className="w-5 h-5 text-primary" />
                        <p className="text-[12px] font-black uppercase tracking-widest text-foreground">
                            Amount to pay: <span className="text-primary italic">{parseFloat(amount).toLocaleString()} {currency}</span>
                        </p>
                    </div>
                </div>

                <div className="p-10 bg-white dark:bg-card rounded-[3rem] border border-foreground/5 shadow-2xl shadow-primary/5 space-y-8">
                    {method === "bank" && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Beneficiary</p>
                                <p className="text-2xl text-foreground font-black px-8 py-5 bg-secondary/20 rounded-2xl tracking-tighter uppercase">Marjane Wallet</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">IBAN</p>
                                <p className="text-sm text-foreground font-bold bg-background p-6 rounded-2xl border border-foreground/5 break-all tracking-[0.1em] font-mono shadow-inner">MA64 1234 5678 9012 3456 7890</p>
                            </div>
                            <div className="p-6 bg-primary rounded-2xl text-center space-y-2 relative overflow-hidden">
                                <Activity className="absolute -left-4 -bottom-4 w-24 h-24 text-white/5" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Reference Number</p>
                                <p className="text-2xl text-white font-black tracking-widest font-mono">MJN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                            </div>
                        </div>
                    )}

                    {method === "crypto" && (
                        <div className="space-y-10">
                            <div className="flex justify-center">
                                <div className="p-6 bg-white rounded-[2rem] shadow-inner border border-foreground/5">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                            currency === 'BTC' ? 'bc1qxy2kgdy6jrsqtzq2n0yrf2493p83kkfjhx0wlh' :
                                            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
                                        )}&bgcolor=ffffff&color=16498d&margin=1`}
                                        alt="QR Protocol"
                                        className="w-44 h-44 mix-blend-multiply opacity-80"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic pr-2 pl-2">Send to this address</p>
                                <p className="text-[10px] bg-background p-6 rounded-2xl border border-foreground/5 break-all font-mono tracking-widest font-bold text-primary shadow-inner">
                                    {currency === 'BTC' ? 'bc1qxy2kgdy6jrsqtzq2n0yrf2493p83kkfjhx0wlh' :
                                     '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {method === "card" && (
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-foreground/20 ml-6">Card Number</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-background border-none rounded-full py-8 pl-10 pr-10 text-xl font-bold font-mono tracking-widest focus:ring-4 focus:ring-primary/5 transition-all shadow-inner" 
                                        placeholder="0000 0000 0000 0000"
                                        value={cardDetails.number}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                                          setCardDetails({...cardDetails, number: raw.replace(/(.{4})/g, '$1 ').trim()});
                                        }}
                                    />
                                    <CreditCard className="absolute right-8 top-1/2 -translate-y-1/2 text-foreground/5 w-8 h-8" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-foreground/20 ml-6">Expiry</label>
                                    <input 
                                        className="w-full bg-background border-none rounded-full py-8 px-8 text-lg font-bold font-mono tracking-widest text-center focus:ring-4 focus:ring-primary/5 shadow-inner" 
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
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-foreground/20 ml-6">CVV</label>
                                    <input 
                                        type="password"
                                        className="w-full bg-background border-none rounded-full py-8 px-8 text-lg font-bold font-mono tracking-widest text-center focus:ring-4 focus:ring-primary/5 shadow-inner" 
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

                <div className="flex gap-6">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 h-20 bg-foreground/5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-all active:scale-95"
                  >
                    Back
                  </button>
                  <button 
                    disabled={loading}
                    onClick={handleDeposit}
                    className="flex-[2] h-20 bg-primary text-white rounded-full font-black flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-[12px]"
                  >
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Confirm Deposit <ArrowRight className="w-6 h-6" /></>}
                  </button>
                </div>
            </div>
          )}

          {/* Step 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-20 px-8 space-y-12 animate-in zoom-in-95 duration-700">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
                    <div className="relative w-40 h-40 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                        <ShieldCheck className="w-20 h-20 text-white" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-5xl font-black uppercase tracking-tighter">Deposit Successful</h3>
                    <p className="text-foreground/40 font-medium uppercase tracking-[0.3em] text-[11px] leading-relaxed max-w-sm mx-auto">
                        Added <span className="text-primary font-black italic">{parseFloat(amount).toLocaleString()} {currency}</span> to your wallet via <span className="text-foreground font-black">{method === 'card' ? 'Card' : method === 'bank' ? 'Bank Transfer' : 'Crypto'}</span>.
                    </p>
                </div>

                <div className="pt-8">
                    <button 
                        onClick={reset}
                        className="w-full bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black h-20 uppercase tracking-[0.4em] text-xs hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
