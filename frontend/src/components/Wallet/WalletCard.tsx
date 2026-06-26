"use client";

import { Eye, EyeOff, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WalletCardProps {
  balance: number;
  currency: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  name: string;
  onIssue?: () => void;
  isNoCard?: boolean;
}

export default function WalletCard({ balance, currency, cardNumber, expiryDate, cvv, name, onIssue, isNoCard }: WalletCardProps) {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(false);

  if (isNoCard || !cardNumber) {
    return (
      <div className="relative w-full aspect-[1.6/1] fluid-card p-8 md:p-10 flex flex-col items-center justify-center text-center gap-6 group overflow-hidden">
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />

        <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto group-hover:bg-primary group-hover:text-white transition-all duration-700">
                <Plus className="w-8 h-8 transition-transform group-hover:rotate-90 duration-500" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground">New Virtual Card</h3>
            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.4em] max-w-[200px] mx-auto leading-relaxed">
                Secure your online payments with a dedicated virtual card.
            </p>
        </div>

        <button 
          onClick={onIssue}
          className="relative z-10 px-10 py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl hover:shadow-primary/30 active:scale-95"
        >
          Create Card
        </button>
      </div>
    );
  }

  const getCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return { name: 'VISA_PROTOCOL', color: 'text-blue-400' };
    if (cleanNumber.startsWith('5')) return { name: 'MASTERCARD_NODE', color: 'text-orange-400' };
    return { name: 'MARJANE_TOKEN', color: 'text-primary' };
  };

  const brand = getCardBrand(cardNumber);

  return (
    <div 
      onClick={() => setShowBalance(!showBalance)}
      className="relative w-full aspect-[1.6/1] fluid-card p-8 md:p-10 bg-primary text-primary-foreground overflow-hidden group hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] cursor-pointer"
    >
      <div className="absolute -right-20 -top-20 w-[30rem] h-[30rem] bg-white opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.05] transition-opacity duration-1000" />
      <div className="absolute -left-20 -bottom-20 w-[30rem] h-[30rem] bg-secondary opacity-10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center backdrop-blur-md border border-white/5 p-2.5 shadow-xl shadow-black/20">
                <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary-foreground/40 mb-0.5">Marjane Wallet</p>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">{name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
              showBalance ? "bg-secondary text-primary shadow-lg" : "bg-white/10 text-white/40"
            )}>
              {showBalance ? "Unlocked" : "Encrypted"}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {showBalance ? <EyeOff className="w-4 h-4 text-primary-foreground/60" /> : <Eye className="w-4 h-4 text-primary-foreground/60" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-foreground/30 mb-1">Available Assets</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
                {showBalance ? balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "••••••"}
              </h2>
              <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-black text-secondary italic tracking-tighter">{currency}</span>
                  {showBalance && <span className="text-[10px] text-primary-foreground/20 -mt-1 font-bold">.{(balance % 1).toFixed(2).split('.')[1]}</span>}
              </div>
            </div>
          </div>
          
          {showBalance ? (
            <div className="flex gap-6">
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary-foreground/30 mb-1">EXP</p>
                  <p className="text-base font-black font-mono">{expiryDate || "MM/YY"}</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary-foreground/30 mb-1">CVV</p>
                  <p className="text-base font-black font-mono">{cvv || "•••"}</p>
               </div>
            </div>
          ) : (
            <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 relative overflow-hidden shadow-inner opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 opacity-20 border-[0.5px] border-black/50 grid grid-cols-3 grid-rows-2" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-6 border-[1px] border-black/20 rounded-sm" />
            </div>
          )}
        </div>

        <div className="flex items-end justify-between border-t border-white/5 pt-4 mt-auto">
          <div>
            <p className="text-primary-foreground/20 text-[8px] font-black uppercase tracking-[0.5em] mb-1">Card Number</p>
            <p className="text-lg md:text-xl font-black tracking-[0.15em] text-primary-foreground/90 drop-shadow-lg font-mono">
                {showBalance 
                    ? cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() 
                    : `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="px-5 py-1.5 bg-secondary text-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/10">
                {brand.name === 'VISA_PROTOCOL' ? 'Visa' : brand.name === 'MASTERCARD_NODE' ? 'Mastercard' : 'Marjane'}
            </div>
            <div className="w-8 h-5 bg-white/10 rounded-sm flex items-center justify-center border border-white/5">
                <div className="w-4 h-4 rounded-full bg-red-500/80 -mr-1.5" />
                <div className="w-4 h-4 rounded-full bg-yellow-500/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-zellige-soft opacity-[0.02] pointer-events-none" />
    </div>
  );
}
