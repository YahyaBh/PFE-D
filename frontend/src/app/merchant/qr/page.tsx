"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Store,
  Printer,
  Info,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  Plus,
  FileText
} from "lucide-react";
import dynamic from "next/dynamic";
const QRCodeSVG = dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG), { ssr: false }) as any;
const QRCodeCanvas = dynamic(() => import("qrcode.react").then(m => m.QRCodeCanvas), { ssr: false }) as any;

export default function MerchantQR() {
  const [merchant, setMerchant] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const qrDownloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/merchant/stats");
        const data = await res.json();
        setMerchant(data.merchant);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const qrValue = merchant ? `marjane:merchant:${merchant.merchant_id}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const canvas = qrDownloadRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marjane-merchant-qr-${merchant?.merchantName || "business"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Marjane Wallet QR", text: qrValue });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const customQrValue = merchant
    ? `marjane:merchant:${merchant.merchant_id}:amount:${customAmount || "0"}:desc:${customDesc || ""}`
    : "";

  const handleGenerateCustom = () => {
    setShowModal(false);
    setCustomAmount("");
    setCustomDesc("");
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="text-center">
        <div className="skeleton h-8 w-64 rounded-full mb-3 mx-auto" />
        <div className="skeleton h-4 w-80 rounded-full mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div
          className="p-12 rounded-[3rem] flex flex-col items-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="skeleton w-full aspect-square rounded-[2rem] mb-8" />
          <div className="skeleton h-6 w-48 rounded-full mx-auto" />
          <div className="skeleton h-4 w-32 rounded-full mx-auto mt-3" />
        </div>
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4 p-2">
              <div className="skeleton w-12 h-12 rounded-2xl shrink-0" style={{ background: 'rgba(255,215,0,0.05)' }} />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="skeleton h-3 w-48 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style jsx global>{`
        @media print {
            aside, header, nav, .no-print { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; }
            .print-only { display: block !important; }
            body { background: white !important; color: black !important; }
        }
        .print-only { display: none; }
      `}</style>
      
      {/* Header */}
      <div className="text-center no-print">
         <h1 className="text-4xl font-black text-white mb-2 italic tracking-tight">Your Business QR Code</h1>
         <p className="max-w-lg mx-auto font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Customers can scan this code using the Marjane Wallet app to pay instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
         {/* QR Display */}
         <div className="relative group no-print">
            <div className="absolute -inset-1 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}></div>
            <div 
              className="relative p-12 rounded-[3rem] shadow-2xl flex flex-col items-center"
              style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
                <div 
                  className="w-full aspect-square flex items-center justify-center p-4 rounded-[2rem] mb-8"
                  style={{ 
                    background: 'rgba(255,255,255,0.02)',
                    border: '2px solid rgba(255,255,255,0.06)'
                  }}
                >
                    <QRCodeSVG 
                        value={qrValue} 
                        size={280} 
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                            src: "/logo.png",
                            x: undefined,
                            y: undefined,
                            height: 48,
                            width: 48,
                            excavate: true,
                        }}
                    />
                </div>
                <div className="text-center">
                    <p className="text-white font-black text-2xl tracking-tighter italic uppercase">{merchant?.merchantName}</p>
                    <div 
                      className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full"
                      style={{ 
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.2)'
                      }}
                    >
                        <ShieldCheck className="w-4 h-4" style={{ color: '#22c55e' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: '#22c55e' }}>Verified Merchant</span>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button 
                   onClick={handlePrint}
                   className="p-4 rounded-2xl shadow-xl hover:scale-110 transition-all group"
                   style={{ 
                     background: 'rgba(15,15,40,0.95)',
                     border: '1px solid rgba(255,255,255,0.06)',
                     backdropFilter: 'blur(16px)'
                   }}
                >
                    <Printer className="w-5 h-5 text-white" />
                </button>
                <button 
                   onClick={handleDownload}
                   className="p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"
                   style={{ 
                     background: 'rgba(15,15,40,0.95)',
                     border: '1px solid rgba(255,255,255,0.06)',
                     backdropFilter: 'blur(16px)'
                   }}
                >
                    <Download className="w-5 h-5 text-white" />
                </button>
                <button 
                   onClick={handleShare}
                   className="p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"
                   style={{ 
                     background: 'rgba(15,15,40,0.95)',
                     border: '1px solid rgba(255,255,255,0.06)',
                     backdropFilter: 'blur(16px)'
                   }}
                >
                    <Share2 className="w-5 h-5 text-white" />
                </button>
                <button 
                   onClick={handleCopy}
                   className="p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"
                   style={{ 
                     background: 'rgba(15,15,40,0.95)',
                     border: '1px solid rgba(255,255,255,0.06)',
                     backdropFilter: 'blur(16px)'
                   }}
                >
                    {copied ? <Check className="w-5 h-5" style={{ color: '#22c55e' }} /> : <Copy className="w-5 h-5 text-white" />}
                </button>
            </div>
         </div>

         {/* Hidden canvas for download */}
         <div ref={qrDownloadRef} className="hidden">
           <QRCodeCanvas value={qrValue} size={280} level="H" includeMargin={true} />
         </div>

         {/* Information & Actions */}
         <div className="space-y-8 no-print">
             <div className="space-y-6">
                 <FeatureItem 
                    icon={Smartphone}
                    title="Instant Acceptance"
                    desc="No hardware terminal required. Use your phone or print this QR for checkout."
                 />
                 <FeatureItem 
                    icon={RefreshCw}
                    title="Real-time Settlements"
                    desc="Revenue is credited to your wallet instantly and is ready for payout request."
                 />
                 <FeatureItem 
                    icon={CheckCircle2}
                    title="Secure & Fraud-Proof"
                    desc="Every transaction is encrypted and verified through our advanced ledger system."
                 />
             </div>

             <div 
               className="p-8 rounded-[2.5rem] space-y-4"
               style={{ 
                 background: 'rgba(255,255,255,0.02)',
                 border: '1px solid rgba(255,255,255,0.06)'
               }}
             >
                 <div className="flex items-start gap-4">
                    <Info className="w-5 h-5 shrink-0 mt-1" style={{ color: '#FFD700' }} />
                    <div>
                        <p className="text-sm font-bold text-white mb-1">Static QR vs Dynamic QR</p>
                        <p className="text-xs leading-relaxed font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>This is your permanent Business QR. Customers enter the amount manually. For specific price codes, use the Mobile POS feature.</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowModal(true)}
                   className="w-full py-4 text-black font-black rounded-2xl transition-all active:scale-95"
                   style={{ 
                     background: '#FFD700',
                     boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                   }}
                 >
                    GENERATE CUSTOM AMOUNT QR
                 </button>
             </div>
         </div>

         {/* Print Only Version */}
         <div className="print-only col-span-2">
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <div className="mb-12">
                   <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-4" style={{ background: '#FFD700' }}>
                      <Store className="w-12 h-12 text-black" />
                   </div>
                   <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">MARJANE WALLET</h1>
                   <p className="text-sm font-bold uppercase tracking-[0.4em]" style={{ color: '#FFD700' }}>Official Merchant Partner</p>
                </div>

                <div className="border-[12px] border-slate-900 p-16 rounded-[4rem] mb-12">
                     <QRCodeSVG value={qrValue} size={450} level="H" includeMargin={true} />
                </div>

                <div className="space-y-4">
                   <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-900">{merchant?.merchantName}</h2>
                   <p className="text-2xl text-slate-500 font-bold max-w-xl mx-auto">Pay securely with Marjane Wallet Scan this QR to start payment</p>
                </div>
                
                <div className="mt-20 pt-10 border-t border-slate-200 w-full max-w-3xl flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    <span>POWERED BY LEDGER TECH</span>
                    <span>HTTPS://MARJANE.MA/WALLET</span>
                </div>
            </div>
         </div>
      </div>

      {/* Custom Amount QR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setShowModal(false)} />
          <div 
            className="relative w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ 
              background: 'rgba(15,15,40,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Custom Amount QR</h2>
                  <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Generate a QR with a predefined amount.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Form */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount (MAD)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-3xl py-4 px-6 text-xl font-black text-white focus:outline-none transition-all"
                        style={{ 
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Description (optional)</label>
                    <input 
                      type="text"
                      value={customDesc}
                      onChange={e => setCustomDesc(e.target.value)}
                      placeholder="e.g. Menu Item #1"
                      className="w-full rounded-3xl py-4 px-6 text-sm font-bold text-white focus:outline-none transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    />
                  </div>

                  <button 
                    onClick={handleGenerateCustom}
                    disabled={!customAmount || parseFloat(customAmount) <= 0}
                    className="w-full py-4 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                    style={{ 
                      background: '#FFD700',
                      boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    GENERATE QR
                  </button>

                  <div 
                    className="p-4 rounded-2xl"
                    style={{ 
                      background: 'rgba(255,215,0,0.05)',
                      border: '1px solid rgba(255,215,0,0.1)'
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FFD700' }}>
                      <FileText className="w-3 h-3 inline mr-1" />
                      QR Value Preview
                    </p>
                    <p className="text-[10px] font-mono mt-1 break-all" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {customQrValue}
                    </p>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-full aspect-square flex items-center justify-center p-6 rounded-[2rem]"
                    style={{ 
                      background: 'rgba(255,255,255,0.02)',
                      border: '2px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {customAmount && parseFloat(customAmount) > 0 ? (
                      <QRCodeSVG 
                        value={customQrValue} 
                        size={220} 
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                            src: "/logo.png",
                            x: undefined,
                            y: undefined,
                            height: 40,
                            width: 40,
                            excavate: true,
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <QrCode className="w-16 h-16 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                        <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>Enter an amount to preview</p>
                      </div>
                    )}
                  </div>
                  {customAmount && parseFloat(customAmount) > 0 && (
                    <div className="mt-4 text-center">
                      <p className="text-2xl font-black text-white">{parseFloat(customAmount).toFixed(2)} <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</span></p>
                      {customDesc && (
                        <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{customDesc}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-4 p-2">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,215,0,0.1)' }}
            >
                <Icon className="w-6 h-6" style={{ color: '#FFD700' }} />
            </div>
            <div>
                <h4 className="text-sm font-black text-white">{title}</h4>
                <p className="text-xs mt-1 leading-relaxed font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
            </div>
        </div>
    );
}
