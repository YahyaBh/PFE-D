"use client";

import { useState, useEffect, useRef } from "react";
import { X, ArrowDownUp, CheckCircle2, AlertCircle, Loader2, ChevronDown, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

const CURRENCIES = ["MAD", "USD", "EUR"];

const FEE_PERCENT_MAP: Record<string, number> = {
  "USD-MAD": 1.5,
  "EUR-MAD": 1.5,
  "MAD-USD": 2.5,
  "MAD-EUR": 2.5,
};

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
  wallets?: { currency: string; balance: number }[];
}

export default function ConvertModal({
  isOpen,
  onClose,
  defaultFrom = "USD",
  defaultTo = "MAD",
  wallets = [],
}: ConvertModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fromCur, setFromCur] = useState(defaultFrom);
  const [toCur, setToCur] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRate();
      setStep(1);
      setAmount("");
      setError("");
      setShake(false);
      setTimeout(() => amountRef.current?.focus(), 400);
    }
  }, [isOpen, fromCur, toCur]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) setShowFromDropdown(false);
      if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) setShowToDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showFromDropdown) setShowFromDropdown(false);
        else if (showToDropdown) setShowToDropdown(false);
        else onClose();
      }
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showFromDropdown, showToDropdown, onClose]);

  const fetchRate = async () => {
    try {
      const res = await api.post("/exchange/convert", { amount: 1, from: fromCur, to: toCur });
      const data = await res.json();
      if (res.ok) {
        setRate(data.rate);
        setLastUpdated(data.timestamp);
      }
    } catch { /* fallback */ }
    if (!rate) {
      try {
        const ratesRes = await api.get("/exchange/rates");
        const ratesData = await ratesRes.json();
        if (ratesData?.rates) {
          const fromRate = ratesData.rates.find((r: any) => r.target === fromCur);
          const toRate = ratesData.rates.find((r: any) => r.target === toCur);
          if (fromCur === 'MAD' && toRate) setRate(toRate.buy);
          else if (toCur === 'MAD' && fromRate) setRate(1 / fromRate.sell);
          else if (fromRate && toRate) setRate((1 / fromRate.sell) * toRate.buy);
          if (ratesData.updatedAt) setLastUpdated(ratesData.updatedAt);
        }
      } catch { /* silent */ }
    }
  };

  const feePercentKey = `${fromCur}-${toCur}`;
  const feePercent = FEE_PERCENT_MAP[feePercentKey] || 1.5;
  const liveRate = rate || 1;
  const amountNum = parseFloat(amount) || 0;
  const convertedAmount = amountNum * liveRate;
  const fee = convertedAmount * (feePercent / 100);
  const netAmount = convertedAmount - fee;
  const available = wallets.find(w => w.currency === fromCur)?.balance || 0;
  const insufficient = amountNum > available;

  const handleSwap = () => {
    setSwapping(true);
    setTimeout(() => {
      setFromCur(toCur);
      setToCur(fromCur);
      setAmount(convertedAmount > 0 ? convertedAmount.toFixed(2) : "");
      setSwapping(false);
    }, 150);
  };

  const handleConvert = async () => {
    if (!amountNum || amountNum <= 0) return;
    if (insufficient) {
      setError("Insufficient balance");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/wallet/convert", {
        fromCurrency: fromCur,
        toCurrency: toCur,
        amount: amountNum,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = lastUpdated ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000) : null;

  const CurrencySelect = ({
    value, onChange, dropdownRef, show, setShow, exclude,
  }: {
    value: string; onChange: (v: string) => void;
    dropdownRef: React.RefObject<HTMLDivElement>; show: boolean;
    setShow: (v: boolean) => void; exclude: string;
  }) => (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:bg-white/5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
      >
        <span>{value}</span>
        <ChevronDown className="w-3 h-3" style={{ color: "#475569" }} />
      </button>
      {show && (
        <div className="absolute top-full left-0 mt-2 w-32 rounded-2xl overflow-hidden z-30 shadow-2xl" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { if (c !== value) onChange(c); setShow(false); }}
              disabled={c === exclude}
              style={{
                padding: "12px 20px", width: "100%", textAlign: "left", fontSize: "13px", fontWeight: 600,
                color: c === value ? "#FFD700" : c === exclude ? "rgba(255,255,255,0.15)" : "#94A3B8",
                cursor: c === exclude ? "not-allowed" : "pointer",
                opacity: c === exclude ? 0.3 : 1,
              }}
              className="hover:bg-white/5 transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(24px)" }} />

      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />

        <div className="px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
              <ArrowDownUp className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Convert Currency</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Live exchange rates</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 active:scale-90" style={{ color: "#64748B" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl flex items-center gap-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {/* From */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>From</span>
                  <CurrencySelect value={fromCur} onChange={setFromCur} dropdownRef={fromDropdownRef} show={showFromDropdown} setShow={setShowFromDropdown} exclude={toCur} />
                </div>
                <div
                  className="relative rounded-2xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: insufficient ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <input
                    ref={amountRef}
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-transparent border-none py-5 px-6 text-4xl font-bold text-white focus:outline-none placeholder:text-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium">
                  <span style={{ color: insufficient ? "#EF4444" : "#64748B" }}>
                    {insufficient ? "Insufficient balance" : `Available: ${available.toFixed(2)} ${fromCur}`}
                  </span>
                  <button onClick={fetchRate} className="flex items-center gap-1 transition-all hover:opacity-80" style={{ color: "#475569" }}>
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
              </div>

              {/* Swap */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: "#0A0E1A",
                    transform: swapping ? "rotate(180deg)" : "rotate(0deg)",
                    transitionDuration: "300ms",
                  }}
                >
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              </div>

              {/* To */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>To</span>
                  <CurrencySelect value={toCur} onChange={setToCur} dropdownRef={toDropdownRef} show={showToDropdown} setShow={setShowToDropdown} exclude={fromCur} />
                </div>
                <div className="rounded-2xl py-5 px-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-4xl font-bold" style={{ color: "#94A3B8" }}>
                    {convertedAmount > 0 ? convertedAmount.toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: "#475569" }}>
                  <span>1 {fromCur} = {liveRate.toFixed(6)} {toCur}</span>
                  {timeAgo !== null && <span>· Updated {timeAgo}m ago</span>}
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="rounded-2xl p-5 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between text-[11px]" style={{ color: "#64748B" }}>
                  <span>Conversion amount</span>
                  <span className="text-white">{convertedAmount.toFixed(2)} {toCur}</span>
                </div>
                <div className="flex justify-between text-[11px]" style={{ color: "#64748B" }}>
                  <span>Fee ({feePercent}%)</span>
                  <span style={{ color: "#EF4444" }}>-{fee.toFixed(2)} {toCur}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#E2E8F0" }}>
                  <span>You receive</span>
                  <span className="text-white">{netAmount.toFixed(2)} {toCur}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}>
                  Cancel
                </button>
                <button
                  disabled={!amountNum || amountNum <= 0 || loading || insufficient}
                  onClick={handleConvert}
                  className="flex-[2] rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  style={{
                    background: !amountNum || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                    color: !amountNum || loading ? "#475569" : "#0A0E1A",
                    boxShadow: !amountNum || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Convert"}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 2 && (
            <div className="text-center py-12 px-4 space-y-6 animate-in zoom-in-95 duration-700">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(255,215,0,0.15)", filter: "blur(20px)" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#FFD700" }} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Converted Successfully</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  {amountNum.toFixed(2)} {fromCur} → {netAmount.toFixed(2)} {toCur}
                </p>
              </div>
              <button onClick={onClose} className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95" style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
