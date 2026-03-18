"use client";

import { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MerchantQR() {
  const [merchant, setMerchant] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/merchant/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
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

  if (loading) return null;

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
         <h1 className="text-4xl font-black text-foreground mb-2 italic tracking-tight">Your Business QR Code</h1>
         <p className="text-muted-foreground max-w-lg mx-auto font-medium">Customers can scan this code using the Marjane Wallet app to pay instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
         {/* QR Display */}
         <div className="relative group no-print">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center">
                <div className="w-full aspect-square flex items-center justify-center p-4 bg-slate-50/50 rounded-[2rem] mb-8 border-2 border-slate-100/50">
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
                    <p className="text-slate-900 font-black text-2xl tracking-tighter italic uppercase">{merchant?.merchantName}</p>
                    <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-100 text-green-600">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Verified Merchant</span>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button 
                   onClick={handlePrint}
                   className="p-4 bg-card text-foreground rounded-2xl shadow-xl hover:scale-110 transition-all border border-border group"
                >
                    <Printer className="w-5 h-5" />
                </button>
                <button 
                   onClick={handleCopy}
                   className="p-4 bg-card text-foreground rounded-2xl shadow-xl hover:scale-110 transition-all border border-border"
                >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>
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

             <div className="p-8 bg-card border border-border rounded-[2.5rem] shadow-sm space-y-4">
                 <div className="flex items-start gap-4">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                        <p className="text-sm font-bold text-foreground mb-1">Static QR vs Dynamic QR</p>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">This is your permanent Business QR. Customers enter the amount manually. For specific price codes, use the Mobile POS feature.</p>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                    GENERATE CUSTOM AMOUNT QR
                 </button>
             </div>
         </div>

         {/* Print Only Version */}
         <div className="print-only col-span-2">
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <div className="mb-12">
                   <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                      <Store className="w-12 h-12 text-white" />
                   </div>
                   <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">MARJANE WALLET</h1>
                   <p className="text-sm font-bold uppercase tracking-[0.4em] text-primary">Official Merchant Partner</p>
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
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-4 p-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h4 className="text-sm font-black text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
    );
}
