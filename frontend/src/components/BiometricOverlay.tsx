"use client";

import { useState, useEffect } from "react";
import { Fingerprint, ScanFace, Loader2 } from "lucide-react";

interface BiometricOverlayProps {
  type: "face" | "fingerprint";
  onComplete: () => void;
}

export default function BiometricOverlay({ type, onComplete }: BiometricOverlayProps) {
  const [status, setStatus] = useState<"scanning" | "success" | "error">("scanning");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus("success");
    }, 2500);
    const timer2 = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-500">
      <div className="relative p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-900 overflow-hidden">
            {status === "scanning" && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent h-full w-full animate-scan" />
            )}
            
            {type === "face" ? (
              <ScanFace className={`w-12 h-12 transition-colors duration-500 ${status === "success" ? "text-green-500" : "text-blue-500"}`} />
            ) : (
              <Fingerprint className={`w-12 h-12 transition-colors duration-500 ${status === "success" ? "text-green-500" : "text-blue-500"}`} />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {status === "scanning" ? `Verifying ${type === "face" ? "Face ID" : "Fingerprint"}` : "Identity Verified"}
        </h2>
        
        <p className="text-slate-400 text-center text-sm max-w-[200px]">
          {status === "scanning" ? "Please keep your device still while we secure your session." : "Access granted. Redirecting to your wallet..."}
        </p>

        {status === "scanning" && (
          <div className="mt-8">
            <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
