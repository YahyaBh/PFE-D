"use client";

import { useState } from "react";
import { X, Search, User, ArrowRight, Loader2, CheckCircle2, AlertCircle, MessageSquare, Zap, Sparkles, ShieldCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
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
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/transactions/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          recipientId: recipient.id, 
          amount: parseFloat(amount),
          note
        })
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
                <MessageSquare className="w-8 h-8 text-secondary" />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Request Money</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mt-1">Ask for a payment</p>
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

          {/* Step 1: Search Payer */}
          {step === 1 && (
            <form onSubmit={handleSearch} className="space-y-12 animate-in fade-in duration-700">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20 ml-8">Who are you requesting from?</label>
                <div className="relative">
                  <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-8 h-8 text-foreground/20" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Email or Phone Number"
                    className="w-full bg-background border-none rounded-full py-10 pl-24 pr-10 text-2xl font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/5 shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button 
                disabled={!searchQuery || loading}
                className="w-full bg-primary text-white font-black py-10 rounded-full flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-sm"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Continue <ArrowRight className="w-6 h-6" /></>}
              </button>
            </form>
          )}

          {/* Step 2: Amount & Note */}
          {step === 2 && recipient && (
            <div className="space-y-12 animate-in slide-in-from-right duration-700 ease-out">
              <div className="flex items-center gap-8 p-10 bg-secondary/10 rounded-[3rem] border border-secondary/20 shadow-xl shadow-secondary/5">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-card flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-3xl uppercase tracking-tighter text-foreground leading-none">{recipient.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 italic">{recipient.email || recipient.phone}</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-end px-6">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20">How much?</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-4xl font-black text-foreground/5 tracking-tighter italic">MAD</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-foreground/5 border-none rounded-[3.5rem] py-12 pl-36 pr-12 text-7xl font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all text-right placeholder:text-foreground/5 shadow-inner"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20 ml-8 italic">Add a note (Optional)</label>
                    <div className="relative">
                        <textarea 
                            placeholder="What is this request for?"
                            className="w-full bg-foreground/5 border-none rounded-[2.5rem] py-8 px-10 text-foreground font-bold text-xs uppercase tracking-[0.2em] focus:ring-4 focus:ring-primary/10 transition-all min-h-[140px] resize-none placeholder:text-foreground/5 shadow-inner"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
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
                  disabled={!amount || loading || parseFloat(amount) <= 0}
                  onClick={handleRequest}
                  className="flex-[2] h-20 bg-primary text-white rounded-full font-black flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-[12px] disabled:opacity-30 disabled:grayscale"
                >
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Send Request <Sparkles className="w-6 h-6" /></>}
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
                        <CheckCircle2 className="w-20 h-20 text-white" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-5xl font-black uppercase tracking-tighter">Request Sent</h3>
                    <p className="text-foreground/40 font-medium uppercase tracking-[0.3em] text-[11px] leading-relaxed max-w-sm mx-auto">
                        We've sent your request for <span className="text-primary font-black italic">{parseFloat(amount).toLocaleString()} MAD</span> to <span className="text-foreground font-black">{recipient.name.split(' ')[0]}</span>.
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
