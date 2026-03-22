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

  const getBrandConfig = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return { 
        name: 'Visa', 
        type: 'DEBIT',
        gradient: 'from-[#1a1c2c] to-[#4a192c]', 
        accent: 'text-blue-400' 
    };
    if (cleanNumber.startsWith('5')) return { 
        name: 'Mastercard', 
        type: 'VIRTUAL',
        gradient: 'from-[#0f172a] to-[#334155]',
        accent: 'text-orange-400' 
    };
    return { 
        name: 'Marjane', 
        type: 'NODE',
        gradient: 'from-[#111111] to-[#222222]',
        accent: 'text-secondary' 
    };
  };

  const brandConfig = getBrandConfig(cardNumber);

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[420px] transition-all duration-700 group perspective-mid">
      {/* Visual Card - Premium Fluid Design */}
      <div className={cn(
        "relative rounded-[2.5rem] aspect-[1.586/1] transition-all duration-700 overflow-hidden shadow-2xl group-hover:shadow-primary/40",
        isFrozen ? "opacity-60 grayscale scale-95" : "hover:-translate-y-4 hover:rotate-1",
        "bg-gradient-to-br text-white border border-white/10",
        brandConfig.gradient
      )}>
        {/* Professional Textures */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 h-full p-8 flex flex-col justify-between">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/50">{brandConfig.type} NODE ACTIVE</p>
              </div>
              <h3 className="text-xl font-black tracking-tighter uppercase leading-none opacity-90">{cardName}</h3>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 p-2">
                    <img src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                </div>
            </div>
          </div>

          {/* Asset Chip & Wireless */}
          <div className="flex items-center justify-between mt-2">
             <div className="flex items-center gap-4">
                {/* SIM Chip Visual */}
                <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 opacity-20 border-[0.5px] border-black/50 grid grid-cols-3 grid-rows-2" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-6 border-[1px] border-black/20 rounded-sm" />
                </div>
                {/* Wireless Icon */}
                <div className="rotate-90 opacity-40">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 8a10 10 0 0 1 14 0" /><path d="M8.5 11.5a5 5 0 0 1 7 0" /><path d="M12 15v.01" />
                    </svg>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black tracking-[0.2em] text-white/30 uppercase">Balance</p>
                <p className="text-xl font-black tracking-tighter">{balance.toLocaleString()} <span className="text-[10px] text-secondary italic">MAD</span></p>
             </div>
          </div>

          {/* Identity String (Card Number) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-black/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/5">
              <span className="text-xl md:text-2xl font-black tracking-[0.15em] drop-shadow-xl font-mono text-white/90">
                {showDetails ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : `••••  ••••  ••••  ${cardNumber.slice(-4)}`}
              </span>
              <div className="flex gap-2">
                  <button 
                      onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                      {showDetails ? <EyeOff className="w-3.5 h-3.5 text-white/60" /> : <Eye className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                  <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                      {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                  </button>
              </div>
            </div>

            {/* Footer Data */}
            <div className="flex items-end justify-between">
               <div className="flex gap-10">
                  <div className="space-y-0.5">
                    <p className="text-[6px] font-black uppercase tracking-[0.4em] text-white/30">Holder</p>
                    <p className="text-[10px] font-black tracking-widest uppercase truncate max-w-[120px]">{cardHolder || "MARJANE USER"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[6px] font-black uppercase tracking-[0.4em] text-white/30">Expires</p>
                    <p className="text-[10px] font-black tracking-widest">{expiryDate}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[6px] font-black uppercase tracking-[0.4em] text-white/30">CVV</p>
                    <p className="text-[10px] font-black tracking-widest">{showDetails ? cvv : "•••"}</p>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 leading-none mb-1">{brandConfig.name}</p>
                <div className="w-8 h-5 bg-white/10 rounded-sm flex items-center justify-center border border-white/5">
                    <div className="w-4 h-4 rounded-full bg-red-500/80 -mr-1.5" />
                    <div className="w-4 h-4 rounded-full bg-yellow-500/80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4 text-white scale-110">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Snowflake className="w-8 h-8 animate-pulse text-blue-400" />
              </div>
              <span className="font-black tracking-[0.5em] uppercase text-[10px]">Security Locked</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Surface - Premium Style */}
      <div className="mt-8 flex flex-wrap gap-4 px-2">
            <button 
                onClick={() => onToggleStatus(id, isFrozen ? "ACTIVE" : "FROZEN")}
                disabled={isLoading}
                className={cn(
                    "flex-1 h-16 rounded-full border border-foreground/5 flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95",
                    isFrozen ? "bg-primary text-white" : "bg-white dark:bg-card text-foreground hover:bg-secondary/10"
                )}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFrozen ? <CheckCircle className="w-4 h-4" /> : <Snowflake className="w-4 h-4 text-blue-400" />)}
                {isFrozen ? "Unfreeze" : "Freeze Card"}
            </button>
  
            <button 
                onClick={() => setConfirmRegen(true)}
                className="w-16 h-16 rounded-full border border-foreground/5 bg-white dark:bg-card flex items-center justify-center hover:bg-secondary/10 transition-all shadow-lg active:scale-95"
                title="Replace Card"
            >
                <RefreshCw className="w-5 h-5 text-foreground/40" />
            </button>
  
            <button 
                onClick={() => setShowRefill(!showRefill)}
                className="px-10 h-16 rounded-full bg-secondary text-primary font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-secondary/10 flex items-center gap-3"
            >
                <Plus className="w-4 h-4" /> Add Funds
            </button>
            
            <button 
                onClick={() => setConfirmDelete(true)}
                className="w-16 h-16 rounded-full border border-red-500/10 bg-red-500/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 group/del"
                title="Delete Card"
            >
                <Trash2 className="w-5 h-5 text-red-500 group-hover/del:text-white transition-colors" />
            </button>
      </div>

      {/* Premium Modals */}
      {(confirmDelete || confirmRegen || showRefill) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" onClick={() => { setConfirmDelete(false); setConfirmRegen(false); setShowRefill(false); }} />
            
            <div className="relative w-full max-w-lg bg-white dark:bg-card rounded-[3rem] shadow-2xl p-12 space-y-10 animate-in zoom-in-95 duration-500">
                {confirmDelete && (
                    <div className="space-y-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black uppercase tracking-tighter">Delete Card</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 leading-relaxed">This card will be permanently removed from your wallet. This action cannot be undone.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { onDelete(id); setConfirmDelete(false); }} className="w-full h-16 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20 active:scale-95 transition-all">Confirm Delete</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {confirmRegen && (
                   <div className="space-y-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                            <RefreshCw className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black uppercase tracking-tighter">Replace Card</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 leading-relaxed">Your current card will be replaced with a new number. All security details will be updated.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { onRegenerate(id); setConfirmRegen(false); }} className="w-full h-16 bg-primary text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all">Confirm Replacement</button>
                            <button onClick={() => setConfirmRegen(false)} className="text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {showRefill && (
                    <div className="space-y-10">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-primary shadow-xl shadow-secondary/20">
                                <Zap className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-4xl font-black uppercase tracking-tighter">Add Funds</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">Top up your virtual card balance</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={refillAmount}
                                    onChange={(e) => setRefillAmount(e.target.value)}
                                    className="w-full bg-secondary/20 border-none rounded-[2rem] px-10 py-8 text-4xl font-black focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/5"
                                />
                                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-primary font-black text-xs tracking-widest uppercase italic">MAD</span>
                            </div>
                            
                            <button 
                                disabled={isLoading || !refillAmount || parseFloat(refillAmount) <= 0}
                                onClick={() => {
                                    onRefill(id, parseFloat(refillAmount));
                                    setShowRefill(false);
                                    setRefillAmount("");
                                }}
                                className="w-full h-20 bg-primary text-white rounded-full font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Confirm Top Up</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
}

