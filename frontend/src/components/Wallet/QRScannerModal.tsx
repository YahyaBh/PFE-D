"use client";

import { useState, useEffect } from "react";
import { X, QrCode, ArrowRight, Loader2, CheckCircle2, AlertCircle, Scan, User, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderBalance: number;
  onSuccess: () => void;
}

import QRScanner from "./QRScanner";

export default function QRScannerModal({ isOpen, onClose, senderBalance, onSuccess }: QRScannerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Scanning, 2: Found, 3: Confirm, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<any>(null);

  const handleScanSuccess = async (decodedText: string) => {
    setLoading(true);
    setError("");
    try {
      // Logic to handle different QR formats (JSON or plain ID)
      let scannedData: any;
      try {
        scannedData = JSON.parse(decodedText);
      } catch {
        scannedData = { id: decodedText };
      }

      if (!scannedData.id) throw new Error("Invalid QR Code: ID missing");

      // Fetch full recipient details from backend if not in QR
      if (!scannedData.name) {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/transactions/search?query=${scannedData.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Recipient not found");
        setRecipient(data);
      } else {
        setRecipient(scannedData);
      }

      setStep(3); // Advance to amount input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > senderBalance) {
        setError("Insufficient liquidity");
        return;
    }

    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/transactions/qr-pay", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          receiverId: recipient.id, 
          amount: parseFloat(amount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment synchronization failed");
      
      setStep(4);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setRecipient(null);
    setAmount("");
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
                <Scan className="w-8 h-8 text-secondary" />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Scan & Pay</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mt-1">Instant Payment Protocol</p>
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

          {/* Step 1: Real QR Scanning */}
          {step === 1 && (
            <div className="flex flex-col items-center py-8 animate-in fade-in duration-700">
              <div className="relative w-full max-w-sm">
                <QRScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={(msg) => {
                    if (!msg.includes("No QR code found")) {
                      console.log("Scan error:", msg);
                    }
                  }}
                />
                
                {/* Decorative Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-primary/20 rounded-[2rem] m-2" />
              </div>

              <div className="mt-12 space-y-3 text-center">
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-foreground animate-pulse">Scanning QR Code</p>
                <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.4em]">Establish Secure Connection</p>
              </div>
              
              {loading && (
                <div className="mt-6 flex items-center gap-3 text-primary font-black uppercase tracking-widest text-[10px] animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Scan...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Recipient Found & Confirm */}
          {(step === 2 || step === 3) && recipient && (
            <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-700 ease-out">
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-[30px]" />
                    <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-card bg-secondary flex items-center justify-center shadow-xl">
                        <User className="w-14 h-14 text-primary" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-4">
                        <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground">{recipient.name}</h3>
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">{recipient.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end px-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/20">Payment Amount</label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">Balance: {senderBalance.toFixed(0)} MAD</span>
                </div>
                <div className="relative">
                  <span className="absolute left-12 top-1/2 -translate-y-1/2 text-4xl font-black text-foreground/5 tracking-tighter italic">MAD</span>
                  <input 
                    autoFocus
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-foreground/5 border-none rounded-[3.5rem] py-12 pl-36 pr-12 text-7xl font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all text-right placeholder:text-foreground/5 shadow-inner"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        setStep(3);
                    }}
                  />
                </div>
              </div>

              <button 
                disabled={!amount || loading || parseFloat(amount) <= 0 || parseFloat(amount) > senderBalance}
                onClick={handlePay}
                className="w-full h-24 bg-primary text-white rounded-full font-black flex items-center justify-center gap-6 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 uppercase tracking-[0.3em] text-sm group disabled:grayscale disabled:opacity-30"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Confirm Payment <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" /></>}
              </button>
            </div>
          )}

          {/* Step 4: Success Screen */}
          {step === 4 && (
            <div className="text-center py-20 px-8 space-y-12 animate-in zoom-in-95 duration-700">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
                    <div className="relative w-40 h-40 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                        <CheckCircle2 className="w-20 h-20 text-white" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-5xl font-black uppercase tracking-tighter">Payment Complete</h3>
                    <p className="text-foreground/40 font-medium uppercase tracking-[0.3em] text-[11px] leading-relaxed max-w-sm mx-auto">
                        Sent <span className="text-primary font-black italic">{parseFloat(amount).toLocaleString()} MAD</span> to <span className="text-foreground font-black">{recipient.name.toUpperCase()}</span>.
                    </p>
                </div>

                <div className="pt-8">
                    <button 
                        onClick={reset}
                        className="w-full bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black h-20 uppercase tracking-[0.4em] text-xs hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Close Session
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
