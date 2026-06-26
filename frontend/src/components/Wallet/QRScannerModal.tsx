"use client";

import { useState } from "react";
import { X, ArrowRight, Loader2, CheckCircle2, AlertCircle, Scan, User } from "lucide-react";
import { api } from "@/lib/api";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderBalance: number;
  onSuccess: () => void;
  wallets?: { id: string; currency: string; balance: number; type?: string }[];
}

import QRScanner from "./QRScanner";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QRScannerModal({ isOpen, onClose, senderBalance, onSuccess, wallets = [] }: QRScannerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [cryptoWallet, setCryptoWallet] = useState<any>(null);
  const [sendCurrency, setSendCurrency] = useState("");

  const handleScanSuccess = async (decodedText: string) => {
    setLoading(true);
    setError("");
    setCryptoWallet(null);
    try {
      let scannedData: any;

      const merchantMatch = decodedText.match(/^marjane:merchant:(.+)$/);
      if (merchantMatch) {
        const merchantRes = await api.get(`/merchant/qr-lookup?merchantId=${merchantMatch[1]}`);
        if (!merchantRes.ok) {
          setError("Merchant not found");
          setTimeout(() => onClose(), 2000);
          return;
        }
        const merchantData = await merchantRes.json();
        scannedData = { id: merchantData.ownerId, name: merchantData.businessName, type: "merchant" };
      } else {
        try {
          scannedData = JSON.parse(decodedText);
        } catch {
          scannedData = { id: decodedText };
        }
        if (!scannedData.id) throw new Error("Invalid QR Code: ID missing");
      }

      const rawId = scannedData.id;

      // Check if scanned ID is a wallet_accounts UUID (crypto vault address)
      if (UUID_REGEX.test(rawId)) {
        const walletRes = await api.get(`/wallet/lookup/${rawId}`);
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          if (walletData.type === 'crypto') {
            setCryptoWallet(walletData);
            setStep(3);
            setLoading(false);
            return;
          }
          scannedData = { id: walletData.user_id, name: walletData.userName, email: walletData.userEmail };
        }
      }

      if (!scannedData.name) {
        const res = await api.get(`/transactions/search?query=${rawId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Recipient not found");
          setTimeout(() => onClose(), 2000);
          return;
        }
        setRecipient(data);
      } else {
        setRecipient(scannedData);
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > senderBalance && !cryptoWallet) {
        setError("Insufficient liquidity");
        return;
    }

    setLoading(true);
    setError("");

    try {
      if (cryptoWallet) {
        const senderVault = wallets.find((w: any) => w.currency === sendCurrency && w.type === 'crypto');
        if (!senderVault) throw new Error("No crypto vault for selected currency");
        if (parseFloat(amount) > (senderVault.balance || 0)) throw new Error("Insufficient crypto balance");
        const res = await api.post("/transactions/transfer", {
          amount: parseFloat(amount),
          currency: cryptoWallet.currency,
          sourceCurrency: sendCurrency,
          recipientWalletId: cryptoWallet.id,
          senderWalletId: senderVault.id,
          type: 'P2P_TRANSFER'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transfer failed");
      } else {
        const res = await api.post("/transactions/qr-payment", { 
          receiverId: recipient.id, 
          amount: parseFloat(amount)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Payment synchronization failed");
      }
      
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
        className="fixed inset-0 animate-in fade-in duration-700"
        onClick={reset}
        style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(24px)" }}
      />
      
      {/* Modal Card — dark glassmorphism matching dashboard widgets */}
      <div
        className="relative w-full max-w-lg rounded-3xl animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top glow accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />
        
        {/* Header */}
        <div className="px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
              <Scan className="w-5 h-5" style={{ color: "#FFD700" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Scan & Pay</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Instant Payment Protocol</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
            style={{ color: "#64748B" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* Step 1: Real QR Scanning */}
          {step === 1 && (
            <div className="flex flex-col items-center py-4 animate-in fade-in duration-700">
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
                <div className="absolute inset-0 pointer-events-none rounded-2xl m-2" style={{ border: "1px solid rgba(255,215,0,0.15)" }} />
              </div>

              <div className="mt-8 space-y-2 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest animate-pulse" style={{ color: "#94A3B8" }}>Scanning QR Code</p>
                <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#475569" }}>Establish Secure Connection</p>
              </div>
              
              {loading && (
                <div className="mt-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest animate-pulse" style={{ color: "#FFD700" }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Scan...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Recipient Found & Confirm */}
          {(step === 2 || step === 3) && (recipient || cryptoWallet) && (
            <div className="space-y-6 animate-in fade-in duration-700">
              {cryptoWallet ? (
                <>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: cryptoWallet.currency === 'BTC' ? 'rgba(247,147,26,0.2)' : cryptoWallet.currency === 'ETH' ? 'rgba(98,126,234,0.2)' : 'rgba(38,161,123,0.2)' }}>
                      <span className="text-2xl font-bold" style={{ color: cryptoWallet.currency === 'BTC' ? '#F7931A' : cryptoWallet.currency === 'ETH' ? '#627EEA' : '#26A17B' }}>
                        {cryptoWallet.currency === 'BTC' ? '₿' : cryptoWallet.currency === 'ETH' ? 'Ξ' : '₮'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Send {cryptoWallet.currency}</h3>
                      <p className="text-[10px] font-mono mt-1" style={{ color: "#64748B" }}>{cryptoWallet.id}</p>
                      {cryptoWallet.userName && <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>{cryptoWallet.userName}</p>}
                    </div>
                  </div>

                  {/* Crypto currency selector */}
                  {wallets.filter((w: any) => w.type === 'crypto').length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>From your vault</label>
                      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {wallets.filter((w: any) => w.type === 'crypto').map((vw: any) => (
                          <button
                            key={vw.currency}
                            onClick={() => setSendCurrency(vw.currency)}
                            className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                            style={{
                              background: sendCurrency === vw.currency ? "linear-gradient(135deg, #FFD700, #FFE135)" : "transparent",
                              color: sendCurrency === vw.currency ? "#0A0E1A" : "#475569",
                            }}
                          >
                            {vw.currency} <span className="block text-[8px] font-normal">{(vw.balance || 0).toFixed(4)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Amount</label>
                      <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Available: {(wallets.find((w: any) => w.currency === sendCurrency && w.type === 'crypto')?.balance || 0).toFixed(8)} {sendCurrency}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>{sendCurrency || cryptoWallet.currency}</span>
                      <input
                        autoFocus
                        type="number"
                        placeholder="0.00"
                        className="w-full rounded-2xl py-5 pl-20 pr-5 text-3xl font-bold text-right outline-none transition-all placeholder:text-sm"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                        }}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-5">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,215,0,0.08)", filter: "blur(20px)" }} />
                      <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.15)" }}>
                        <User className="w-9 h-9" style={{ color: "#FFD700" }} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{recipient.name}</h3>
                      <p className="text-[11px] mt-1" style={{ color: "#64748B" }}>{recipient.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Payment Amount</label>
                      <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Balance: {senderBalance.toFixed(0)} MAD</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#475569" }}>MAD</span>
                      <input
                        autoFocus
                        type="number"
                        placeholder="0.00"
                        className="w-full rounded-2xl py-5 pl-16 pr-5 text-3xl font-bold text-right outline-none transition-all placeholder:text-sm"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                        }}
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setStep(3);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                disabled={!amount || loading || parseFloat(amount) <= 0 || (cryptoWallet ? (!sendCurrency || parseFloat(amount) > (wallets.find((w: any) => w.currency === sendCurrency && w.type === 'crypto')?.balance || 0)) : parseFloat(amount) > senderBalance)}
                onClick={handlePay}
                className="w-full rounded-2xl py-5 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                style={{
                  background: !amount || loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: !amount || loading ? "#475569" : "#0A0E1A",
                  boxShadow: !amount || loading ? "none" : "0 4px 15px rgba(255,215,0,0.25)",
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{cryptoWallet ? 'Send Crypto' : 'Confirm Payment'} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-12 px-4 space-y-6 animate-in zoom-in-95 duration-700">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(255,215,0,0.15)", filter: "blur(20px)" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#FFD700" }} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{cryptoWallet ? 'Crypto Sent' : 'Payment Complete'}</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  {cryptoWallet
                    ? <>Sent <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} {sendCurrency || cryptoWallet.currency}</span> to vault <span className="font-mono text-[10px] text-white">{cryptoWallet.id.slice(0,8)}...</span>.</>
                    : <>Sent <span className="font-semibold" style={{ color: "#FFD700" }}>{parseFloat(amount).toLocaleString()} MAD</span> to <span className="font-semibold text-white">{recipient.name.toUpperCase()}</span>.</>
                  }
                </p>
              </div>
              <button
                onClick={reset}
                className="w-full rounded-2xl py-4 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: "#0A0E1A",
                  boxShadow: "0 4px 15px rgba(255,215,0,0.25)",
                }}
              >
                Close Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
