"use client";

import { useState } from "react";
import { Eye, EyeOff, Shield, Snowflake, Trash2, CheckCircle, RefreshCw, Copy, Check, Loader2, Plus, Sparkles, X, ShieldCheck, Zap } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VirtualCardProps {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
  cardName: string;
  cardHolder?: string;
  status: "ACTIVE" | "FROZEN" | "TERMINATED";
  onToggleStatus: (id: string, newStatus: "ACTIVE" | "FROZEN") => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onRefill: (id: string, amount: number) => void;
  balance?: number;
  isLoading?: boolean;
}

export default function VirtualCard({
  id,
  cardNumber,
  cvv,
  expiryDate,
  cardName,
  cardHolder,
  status,
  onToggleStatus,
  onDelete,
  onRegenerate,
  onRefill,
  balance = 0,
  isLoading
}: VirtualCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [refillAmount, setRefillAmount] = useState("");
  const [copied, setCopied] = useState(false);
  
  const isFrozen = status === "FROZEN";

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto group">
      <div className="w-full flex justify-center py-8">
        <div className={cn(
          "relative w-full aspect-[1.586/1] rounded-[2rem] overflow-hidden transition-all duration-500",
          "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800",
          "border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_60px_rgba(251,230,10,0.1)]",
          isFrozen && "opacity-40 grayscale"
        )}>
          {/* Subtle Accent Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-marjane-gold/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-marjane-blue/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 h-full p-10 flex flex-col justify-between">
              {/* Header: Status & Brand */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", isFrozen ? "bg-red-500 shadow-red-500/50" : "bg-marjane-gold shadow-marjane-gold/50")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                            Node {status}
                        </span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2 border border-white/10">
                    <img src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Balance Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Available Liquidity</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-white">{balance.toLocaleString()}</span>
                    <span className="text-sm font-black text-marjane-gold tracking-widest uppercase mb-1">MAD</span>
                </div>
              </div>

              {/* Card Number */}
              <div className="flex items-center justify-between group/number">
                <span className="text-2xl md:text-3xl font-mono font-bold tracking-[0.2em] text-white/90 drop-shadow-lg">
                  {showDetails 
                    ? cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() 
                    : `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}`}
                </span>
                <div className="flex gap-2 opacity-0 group-hover/number:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                    >
                        {showDetails ? <EyeOff className="w-3.5 h-3.5 text-white/40" /> : <Eye className="w-3.5 h-3.5 text-white/40" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-marjane-gold" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                    </button>
                </div>
              </div>

              {/* Footer: User & Expiry */}
              <div className="flex justify-between items-end border-t border-white/5 pt-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Entity Identity</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{cardHolder || "MARJANE USER"}</p>
                </div>
                <div className="flex gap-8 text-right">
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Expiry</p>
                        <p className="text-[10px] font-black tracking-widest text-white/80">{expiryDate}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Security</p>
                        <p className="text-[10px] font-black tracking-widest text-white/80">{showDetails ? cvv : "•••"}</p>
                    </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Control Surface - Marjane Dashboard Style */}
      <div className="mt-10 flex flex-col gap-6 w-full px-4 text-white">
            <button 
                onClick={(e) => { e.stopPropagation(); setShowRefill(!showRefill); }}
                className="w-full h-14 rounded-full bg-marjane-gold text-marjane-blue font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(251,230,10,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <Plus className="w-5 h-5" /> Add Funds
            </button>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => onToggleStatus(id, isFrozen ? "ACTIVE" : "FROZEN")}
                    disabled={isLoading}
                    className={cn(
                        "h-14 rounded-full flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border-2",
                        isFrozen 
                            ? "bg-white text-marjane-blue border-white shadow-xl" 
                            : "bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_10px_20px_rgba(239,68,68,0.2)]"
                    )}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFrozen ? <CheckCircle className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />)}
                    {isFrozen ? "Active" : "Freeze"}
                </button>

                <button 
                    onClick={() => setConfirmRegen(true)}
                    className="h-14 rounded-full bg-slate-900 border-2 border-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                    <RefreshCw className="w-4 h-4" /> Rotate
                </button>
            </div>
            
            <button 
                onClick={() => setConfirmDelete(true)}
                className="w-full py-4 text-center text-[9px] font-black uppercase tracking-[0.4em] text-red-500/40 hover:text-red-500 transition-colors"
            >
                Terminate Node Protocol [X]
            </button>
      </div>

      {(confirmDelete || confirmRegen || showRefill) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setConfirmDelete(false); setConfirmRegen(false); setShowRefill(false); }} />
            
            <div className="relative w-full max-w-md bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 text-white">
                {confirmDelete && (
                    <div className="space-y-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Terminate Node</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 leading-relaxed">Permanent disconnection from the asset network. This action is irreversible.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { onDelete(id); setConfirmDelete(false); }} className="w-full h-16 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/20 active:scale-95 transition-all">Confirm Termination</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Abort Sequence</button>
                        </div>
                    </div>
                )}

                {confirmRegen && (
                   <div className="space-y-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-marjane-gold/10 flex items-center justify-center text-marjane-gold mx-auto border border-marjane-gold/20 shadow-[0_0_30px_rgba(251,230,10,0.1)]">
                            <RefreshCw className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Rotate Keys</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 leading-relaxed">Generate new security credentials for this digital asset node.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { onRegenerate(id); setConfirmRegen(false); }} className="w-full h-16 bg-marjane-gold text-marjane-blue rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-marjane-gold/20 active:scale-95 transition-all">Rotate Node</button>
                            <button onClick={() => setConfirmRegen(false)} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Abort</button>
                        </div>
                    </div>
                )}

                {showRefill && (
                    <div className="space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-marjane-gold flex items-center justify-center text-marjane-blue shadow-xl shadow-marjane-gold/20">
                                <Zap className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Injection</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-marjane-gold italic">Add Liquidity to Node</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={refillAmount}
                                    onChange={(e) => setRefillAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-[2rem] px-10 py-10 text-4xl font-black focus:ring-4 focus:ring-marjane-gold/20 transition-all text-white placeholder:text-white/5"
                                />
                                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-marjane-gold font-black text-xs tracking-widest uppercase">MAD</span>
                            </div>
                            
                            <button 
                                disabled={isLoading || !refillAmount || parseFloat(refillAmount) <= 0}
                                onClick={() => {
                                    onRefill(id, parseFloat(refillAmount));
                                    setShowRefill(false);
                                    setRefillAmount("");
                                }}
                                className="w-full h-20 bg-marjane-gold text-marjane-blue rounded-full font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-marjane-gold/30 flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Inject Liquidity"}
                            </button>
                            <button onClick={() => setShowRefill(false)} className="w-full text-center text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Close Protocol</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
}

