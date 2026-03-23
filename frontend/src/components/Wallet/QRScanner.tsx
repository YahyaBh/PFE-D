"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;

    const config = { 
      fps, 
      qrbox: { width: qrbox, height: qrbox },
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config, 
      (decodedText: string) => {
        onScanSuccess(decodedText);
      },
      (errorMessage: string) => {
        if (onScanError) onScanError(errorMessage);
      }
    ).catch((err: any) => {
      console.error("Failed to start scanner:", err);
      if (onScanError) onScanError(err);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Failed to stop scanner:", err);
        });
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2rem] border border-foreground/5 bg-black/5 aspect-square flex items-center justify-center">
        <div id={regionId} className="w-full h-full" />
    </div>
  );
}
