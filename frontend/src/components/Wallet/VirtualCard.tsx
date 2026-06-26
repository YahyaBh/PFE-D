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
      <div className="w-full flex justify-center py-6">
        <div className={cn(
          "relative w-full aspect-[1.586/1] rounded-[2rem] overflow-hidden transition-all duration-500",
          "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800",
          "border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          !isFrozen && "group-hover:shadow-[0_20px_60px_rgba(255,215,0,0.08)]",
          isFrozen && "opacity-40 grayscale"
        )}>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 h-full p-8 md:p-10 flex flex-col justify-between gap-3">
              <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", isFrozen ? "bg-red-500 shadow-red-500/50" : "bg-primary shadow-primary/50")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                            Node {status}
                        </span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2 border border-white/10">
                    <img loading="lazy" src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Available Liquidity</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-white">{balance.toLocaleString()}</span>
                    <span className="text-sm font-black text-primary tracking-widest uppercase mb-1">MAD</span>
                </div>
              </div>

              <div className="flex items-center justify-between group/number">
                <span className="text-xl md:text-2xl font-mono font-bold tracking-[0.2em] text-white/90 drop-shadow-lg">
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
                        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                    </button>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/5 pt-5 mt-auto">
                <div>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Entity Identity</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{cardHolder || "MARJANE USER"}</p>
                </div>
                <div className="flex gap-6 text-right">
                    <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Expiry</p>
                        <p className="text-[10px] font-black tracking-widest text-white/80">{expiryDate}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Security</p>
                        <p className="text-[10px] font-black tracking-widest text-white/80">{showDetails ? cvv : "•••"}</p>
                    </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 w-full px-4">
            <button 
                onClick={(e) => { e.stopPropagation(); setShowRefill(!showRefill); }}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <Plus className="w-5 h-5" /> Add Funds
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => onToggleStatus(id, isFrozen ? "ACTIVE" : "FROZEN")}
                    disabled={isLoading}
                    className={cn(
                        "h-14 rounded-full flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border-2",
                        isFrozen 
                            ? "bg-white text-foreground dark:text-background border-white shadow-xl" 
                            : "bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                    )}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFrozen ? <CheckCircle className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />)}
                    {isFrozen ? "Active" : "Freeze"}
                </button>

                <button 
                    onClick={() => setConfirmRegen(true)}
                    className="h-14 rounded-full bg-card border-2 border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-card/80 hover:text-foreground transition-all flex items-center justify-center gap-3"
                >
                    <RefreshCw className="w-4 h-4" /> Rotate
                </button>
            </div>
            
            <button 
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 text-center text-[9px] font-black uppercase tracking-[0.4em] text-red-500/40 hover:text-red-500 transition-colors"
            >
                Terminate Node Protocol [X]
            </button>
      </div>

      {(confirmDelete || confirmRegen || showRefill) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setConfirmDelete(false); setConfirmRegen(false); setShowRefill(false); }} />
            
            <div className="relative w-full max-w-md bg-card border border-border/60 rounded-[2.5rem] shadow-2xl p-8 md:p-10 space-y-8">
                {confirmDelete && (
                    <div className="space-y-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Terminate Node</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground leading-relaxed">Permanent disconnection from the asset network. This action is irreversible.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { onDelete(id); setConfirmDelete(false); }} className="w-full h-14 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Confirm Termination</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Abort Sequence</button>
                        </div>
                    </div>
                )}

                {confirmRegen && (
                   <div className="space-y-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20">
                            <RefreshCw className="w-10 h-10" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Rotate Keys</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground leading-relaxed">Generate new security credentials for this digital asset node.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { onRegenerate(id); setConfirmRegen(false); }} className="w-full h-14 bg-primary text-primary-foreground rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Rotate Node</button>
                            <button onClick={() => setConfirmRegen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Abort</button>
                        </div>
                    </div>
                )}

                {showRefill && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Injection</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">Add Liquidity to Node</p>
                            </div>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={refillAmount}
                                    onChange={(e) => setRefillAmount(e.target.value)}
                                    className="w-full bg-background/50 border border-border/60 rounded-[2rem] px-8 py-8 text-3xl font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20"
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-primary font-black text-xs tracking-widest uppercase">MAD</span>
                            </div>
                            
                            <button 
                                disabled={isLoading || !refillAmount || parseFloat(refillAmount) <= 0}
                                onClick={() => {
                                    onRefill(id, parseFloat(refillAmount));
                                    setShowRefill(false);
                                    setRefillAmount("");
                                }}
                                className="w-full h-16 bg-primary text-primary-foreground rounded-full font-black uppercase tracking-[0.3em] text-[12px] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inject Liquidity"}
                            </button>
                            <button onClick={() => setShowRefill(false)} className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Close Protocol</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
}
