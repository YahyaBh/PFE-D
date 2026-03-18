"use client";

import { useState, useEffect } from "react";
import { X, Landmark, CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, Wallet, Zap, ShieldCheck, Activity, Smartphone } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  currency: string;
  onSuccess: () => void;
}

type WithdrawMethod = "bank" | "card";

export default function WithdrawModal({ isOpen, onClose, balance, currency, onSuccess }: WithdrawModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
      fetch("http://localhost:5000/api/limits", {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).then(setLimits).catch(() => {});
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
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/transactions/withdraw", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          currency: currency,
          method
        })
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
    { id: "bank", name: "Bank Node", icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-500/5", desc: "TRANSFER TO LINKED ACCOUNT" },
    { id: "card", name: "Card Payout", icon: CreditCard, color: "text-primary", bg: "bg-primary/5", desc: "DIRECT DISCHARGE TO VISA/MC" },
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
                <ArrowRight className="w-8 h-8 text-secondary rotate-180" />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Withdraw Funds</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mt-1">Safe and secure withdrawals</p>
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
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-foreground/20 ml-8 mb-4">Choose a withdrawal method</p>
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as WithdrawMethod);
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
                        {m.id === 'bank' ? 'Bank Account' : 'Debit Card'}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">
                        {m.id === 'bank' ? 'Withdraw to your bank account' : 'Withdraw to your Visa or Mastercard'}
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
                    {method === 'bank' ? 'Bank Withdrawal' : 'Card Withdrawal'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/30">Secure withdrawal gateway</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-end px-6">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20">Amount to Withdraw</label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">Available: {balance.toFixed(0)} {currency}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-4xl font-black text-foreground/5 tracking-tighter italic">{currency}</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-foreground/5 border-none rounded-[3.5rem] py-12 pl-36 pr-12 text-7xl font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all text-right placeholder:text-foreground/5 shadow-inner"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  
                  {limits && amount && parseFloat(amount) > 0 && (
                    <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-6 items-center">
                        <Activity className="w-6 h-6 text-primary shrink-0" />
                        <p className="text-[10px] text-foreground/60 font-medium uppercase tracking-[0.2em] leading-relaxed">
                            Withdrawals are usually processed within 24-48 hours.
                        </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 h-20 bg-foreground/5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-all active:scale-95"
                >
                  Back
                </button>
                <button 
                  disabled={!amount || loading || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                  onClick={handleWithdraw}
                  className="flex-[2] h-20 bg-primary text-white rounded-full font-black flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-[12px] disabled:opacity-30 disabled:grayscale"
                >
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Confirm Withdrawal <ArrowRight className="w-6 h-6" /></>}
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
                    <h3 className="text-5xl font-black uppercase tracking-tighter">Withdrawal Requested</h3>
                    <p className="text-foreground/40 font-medium uppercase tracking-[0.3em] text-[11px] leading-relaxed max-w-sm mx-auto">
                        Your withdrawal of <span className="text-primary font-black italic">{parseFloat(amount).toLocaleString()} {currency}</span> to your <span className="text-foreground font-black">{method === 'bank' ? 'Bank Account' : 'Debit Card'}</span> has been received and is being processed.
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

import { ChevronRight } from "lucide-react";
