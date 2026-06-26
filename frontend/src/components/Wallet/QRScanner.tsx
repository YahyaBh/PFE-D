"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number;
}

export default function QRScanner({ 
  onScanSuccess, 
  onScanError, 
  fps = 10, 
  qrbox = 250 
}: QRScannerProps) {
  const pausedRef = useRef(false);
  const regionId = useRef(`qr-reader-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    let mounted = true;
    let started = false;

    const el = document.getElementById(regionId);
    if (!el) return;
    el.innerHTML = "";

    const scanner = new Html5Qrcode(regionId);

    scanner.start(
      { facingMode: "environment" },
      { fps, qrbox: { width: qrbox, height: qrbox } },
      (decodedText: string) => {
        if (mounted && !pausedRef.current) {
          pausedRef.current = true;
          onScanSuccess(decodedText);
        }
      },
      () => {}
    ).then(() => {
      started = true;
    }).catch((err: any) => {
      if (mounted) {
        console.error("Failed to start scanner:", err);
        if (onScanError) onScanError(err?.toString?.() || "Camera access denied");
      }
    });

    return () => {
      mounted = false;
      pausedRef.current = false;

      // Only attempt stop if scanner actually started — stop() throws
      // synchronously OR rejects if called before start completes.
      if (started) {
        try {
          const p = scanner.stop();
          if (p && typeof p.catch === "function") {
            p.catch(() => {});
          }
        } catch {
          // Scanner state changed between the check and stop call
        }
      }

      const container = document.getElementById(regionId);
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2rem] border border-foreground/5 bg-black/5 aspect-square flex items-center justify-center">
      <style>{`
        #${regionId} {
          position: relative;
          width: 100%;
          height: 100%;
        }
        #${regionId} video {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${regionId} canvas, #${regionId} img {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <div id={regionId} className="w-full h-full" />
    </div>
  );
}
