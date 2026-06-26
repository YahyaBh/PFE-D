"use client";

import { useState, useEffect, useRef } from "react";
import { X, Copy, Share2, CheckCircle2, ChevronDown, Clock, CheckCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dynamic from "next/dynamic";
const QRCodeSVG = dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG), { ssr: false }) as any;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FLAGS: Record<string, string> = {
  MAD: "\uD83C\uDDF2\uD83C\uDDE6",
  USD: "\uD83C\uDDFA\uD83C\uDDF8",
  EUR: "\uD83C\uDDEA\uD83C\uDDFA",
};

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  userName?: string;
  balance?: Record<string, number>;
  recentRequests?: Array<{
    id: string;
    from: string;
    amount: number;
    currency: string;
    status: "pending" | "fulfilled";
    createdAt: string;
  }>;
}

export default function ReceiveModal({
  isOpen,
  onClose,
  walletAddress = "0x7f8a3b2c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
  userName = "Yahya",
  recentRequests = [],
}: ReceiveModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [requestAmount, setRequestAmount] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MAD");
  const [showCurDropdown, setShowCurDropdown] = useState(false);

  const curDropdownRef = useRef<HTMLDivElement>(null!);

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const paymentLink = `marjane.wallet/pay/${userName.toLowerCase()}`;

  const qrValue = requestAmount && amount
    ? `${paymentLink}?amount=${parseFloat(amount || "0").toFixed(2)}&currency=${currency}`
    : paymentLink;

  useEffect(() => {
    if (isOpen) {
      setCopiedAddress(false);
      setCopiedLink(false);
      setRequestAmount(false);
      setAmount("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (curDropdownRef.current && !curDropdownRef.current.contains(e.target as Node)) setShowCurDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Pay me with Marjane Wallet",
      text: `Send me money via Marjane Wallet: ${paymentLink}`,
      url: paymentLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      copyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div
        className="relative w-full max-w-[400px] bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-2xl scale-95 opacity-0 animate-in zoom-in-95 fade-in duration-300 fill-mode-forwards overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Receive Money"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <h2 className="text-xl font-bold tracking-tight">Receive Money</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/20 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute -inset-3 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
                  <path d="M8,0 L0,0 L0,8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                  <path d="M92,0 L100,0 L100,8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
                  <path d="M8,100 L0,100 L0,92" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-pulse" style={{ animationDelay: "1s" }} />
                  <path d="M92,100 L100,100 L100,92" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" className="animate-pulse" style={{ animationDelay: "1.5s" }} />
                </svg>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-lg">
                <QRCodeSVG value={qrValue} size={200} />
              </div>
            </div>
            <p className="text-xs font-medium text-foreground/40 mt-4 tracking-wider">Scan to pay</p>
          </div>

          {/* Wallet Address */}
          <div className="flex items-center gap-2 bg-foreground/5 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0" title={walletAddress}>
              <p className="text-xs font-mono font-bold text-foreground/80 truncate">{truncatedAddress}</p>
            </div>
            <button
              onClick={copyAddress}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90",
                copiedAddress ? "bg-green-500/10 text-green-500" : "bg-foreground/5 text-foreground/40 hover:text-foreground"
              )}
              aria-label="Copy wallet address"
            >
              {copiedAddress ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-lg bg-foreground/5 text-foreground/40 hover:text-foreground flex items-center justify-center transition-all active:scale-90"
              aria-label="Share payment link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Request Amount Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={requestAmount}
              onChange={() => setRequestAmount(!requestAmount)}
              className="sr-only"
            />
            <div className={cn(
              "w-10 h-6 rounded-full transition-all relative",
              requestAmount ? "bg-primary" : "bg-foreground/10"
            )}>
              <div className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                requestAmount && "translate-x-4"
              )} />
            </div>
            <span className="text-sm font-medium text-foreground/60 group-hover:text-foreground transition-colors">Request specific amount</span>
          </label>

          {/* Amount Input */}
          {requestAmount && (
            <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-foreground/5 rounded-xl px-5 py-3.5 text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-foreground/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="relative" ref={curDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCurDropdown(!showCurDropdown)}
                    className="h-full px-4 bg-foreground/5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-foreground/10 transition-all"
                  >
                    <span>{FLAGS[currency]}</span>
                    <span>{currency}</span>
                    <ChevronDown className="w-3 h-3 text-foreground/40" />
                  </button>
                  {showCurDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-28 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden">
                      {["MAD", "USD", "EUR"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCurrency(c); setShowCurDropdown(false); }}
                          className={cn(
                            "w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all hover:bg-foreground/5",
                            c === currency ? "text-primary" : "text-foreground/60"
                          )}
                        >
                          <span>{FLAGS[c]}</span>
                          <span>{c}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Link */}
          <div className="bg-foreground/5 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Payment Link</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs font-mono font-medium text-foreground/60 truncate">{paymentLink}</p>
              <button
                onClick={copyLink}
                className={cn(
                  "text-xs font-bold flex items-center gap-1 transition-all",
                  copiedLink ? "text-green-500" : "text-primary hover:text-primary/80"
                )}
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Recent Requests */}
          {recentRequests.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Recent Requests</p>
              {recentRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-center gap-3 bg-foreground/5 rounded-xl px-4 py-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    req.status === "fulfilled" ? "bg-green-500/10" : "bg-amber-500/10"
                  )}>
                    {req.status === "fulfilled" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">From {req.from}</p>
                    <p className="text-[10px] font-medium text-foreground/40">{req.amount.toFixed(2)} {req.currency}</p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    req.status === "fulfilled" ? "text-green-500" : "text-amber-500"
                  )}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
