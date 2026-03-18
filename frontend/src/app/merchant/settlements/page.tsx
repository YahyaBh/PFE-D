"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  PlusCircle, 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Info,
  ArrowRight,
  Globe,
  Loader2,
  Send,
  Wallet
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MerchantSettlements() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/merchant/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setBalance(data.wallet.balance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlement = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/merchant/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        setShowModal(false);
        setAmount("");
        fetchBalance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-10 bg-gradient-to-br from-card to-background border border-border rounded-[3rem] relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                  <Wallet className="w-48 h-48 text-foreground" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center h-full gap-8 text-center md:text-left">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Available Revenue</p>
                    <h2 className="text-6xl font-black text-foreground tracking-tighter">
                        {loading ? "---" : parseFloat(balance.toString()).toFixed(2)} <span className="text-2xl opacity-40">MAD</span>
                    </h2>
                  </div>
                  <button 
                     onClick={() => setShowModal(true)}
                     className="px-10 py-5 bg-primary hover:bg-primary/90 text-white font-black rounded-3xl transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95"
                  >
                     <PlusCircle className="w-5 h-5" />
                     REQUEST SETTLEMENT
                  </button>
              </div>
          </div>

          <div className="p-10 bg-card border border-border rounded-[3rem] shadow-sm flex flex-col justify-center text-center">
             <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-black text-foreground mb-2">Primary Bank Account</h3>
             <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest leading-relaxed">
                Marjane Credit Populaire<br />
                **** **** **** 8829
             </p>
             <button className="mt-6 text-[10px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary/80 transition-colors">
                 Manage Payout Details
                 <ArrowRight className="w-3 h-3" />
             </button>
          </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-[3rem] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-border flex justify-between items-center">
             <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <History className="w-6 h-6 text-muted-foreground" />
                Settlement History
             </h3>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-muted text-muted-foreground text-[10px] font-black rounded-xl">PENDING</button>
                <button className="px-4 py-2 bg-muted text-muted-foreground text-[10px] font-black rounded-xl">ALL</button>
             </div>
          </div>
          <div className="p-12 text-center">
             <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ArrowLeftRight className="w-10 h-10 text-muted/20" />
             </div>
             <p className="text-muted-foreground text-sm font-bold max-w-xs mx-auto mb-8">No recent settlements found for this merchant account.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                 <div className="p-6 bg-background rounded-3xl border border-border flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-foreground leading-tight">Settlement Cycle</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed font-medium">Most payouts are processed within 24 business hours.</p>
                    </div>
                 </div>
                 <div className="p-6 bg-background rounded-3xl border border-border flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-foreground leading-tight">Global Reach</p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed font-medium">Accept payments from any wallet in the 12 active zones.</p>
                    </div>
                 </div>
             </div>
          </div>
      </div>

       {/* Request Modal */}
       {showModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
           <div className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8">
                 <div className="text-center">
                     <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
                         <ArrowLeftRight className="w-10 h-10 text-white" />
                     </div>
                     <h2 className="text-3xl font-black text-foreground tracking-tighter">Request Settlement</h2>
                     <p className="text-sm text-muted-foreground mt-2 font-medium">Transfer funds from your merchant wallet to your bank.</p>
                 </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Amount to Payout</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-background border border-border rounded-3xl py-6 px-8 text-2xl font-black text-foreground focus:outline-none focus:border-primary transition-all text-center placeholder:text-muted-foreground/10"
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground uppercase">MAD</div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center font-extrabold">Max available: {parseFloat(balance.toString()).toFixed(2)} MAD</p>
                    </div>

                    <div className="p-6 bg-background rounded-3xl border border-border space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-muted-foreground uppercase tracking-widest">Settlement Fee</span>
                            <span className="text-foreground">0.00 MAD</span>
                        </div>
                        <div className="h-[1px] bg-border" />
                        <div className="flex justify-between items-center text-sm font-black">
                            <span className="text-primary uppercase tracking-widest">Net Payout</span>
                            <span className="text-foreground">{(parseFloat(amount) || 0).toFixed(2)} MAD</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSettlement}
                        disabled={submitting || !amount || parseFloat(amount) > balance}
                        className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black rounded-3xl transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                        CONFIRM SETTLEMENT
                    </button>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="w-full py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                    >
                        Cancel Transaction
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
