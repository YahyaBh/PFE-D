"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FaceAuthProps {
  onCapture: (descriptor: number[]) => void;
  mode: "register" | "login";
}

export default function FaceAuth({ onCapture, mode }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceapiRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "detecting" | "success" | "error">("loading");
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);

  // ── Stop camera helper ──
  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // ── 1. Load face-api models (runs once) ──
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const mod = await import("face-api.js");
        if (cancelled) return;
        faceapiRef.current = mod;

        const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        await Promise.all([
          mod.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          mod.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          mod.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
          setStatus("idle"); // Ready — waiting for user to click Start
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        if (!cancelled) {
          setError("Security modules could not be initialized.");
          setStatus("error");
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── 2. Start camera — called by user click, NOT on mount ──
  const startCamera = async () => {
    try {
      stopCamera();
      setError(null);
      setStatus("loading");

      // Give the browser time to fully release any prior camera lock
      await new Promise(r => setTimeout(r, 300));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("detecting");
    } catch (err: any) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow permissions in your browser settings and refresh.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Connect a camera and try again.");
      } else if (err.name === "NotReadableError") {
        setError("Camera busy. Please close other apps using the camera, then click 'Try Again'.");
      } else {
        setError(`Camera error: ${err.message || "Unknown"}`);
      }
      setStatus("error");
    }
  };

  // ── 3. Face detection loop (runs while status === detecting) ──
  useEffect(() => {
    if (status !== "detecting" || !faceapiRef.current) return;

    const faceapi = faceapiRef.current;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const det = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (det) {
          setFaceDescriptor(det.descriptor);
          if (mode === "login") {
            stopCamera();
            setStatus("success");
            onCapture(Array.from(det.descriptor));
          }
        }
      } catch {
        // detection can fail transiently, just continue
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, mode, onCapture]);

  // ── 4. Cleanup on unmount ──
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ── Manual capture handler (register mode) ──
  const handleCapture = () => {
    if (!faceDescriptor) return;
    stopCamera();
    setStatus("success");
    onCapture(Array.from(faceDescriptor));
  };

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <div className={cn(
        "relative rounded-[2.5rem] overflow-hidden bg-slate-900 border-2 transition-all duration-500 aspect-square flex items-center justify-center shadow-2xl",
        status === "detecting" && "border-blue-500 shadow-blue-500/20",
        status === "success" && "border-green-500 shadow-green-500/20",
        status === "error" && "border-red-500 shadow-red-500/10",
        (status === "idle" || status === "loading") && "border-slate-800"
      )}>
        {/* Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500",
            status === "detecting" ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />

        {/* Loading models */}
        {status === "loading" && (
          <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">
              {modelsLoaded ? "Starting camera..." : "Loading security modules..."}
            </p>
          </div>
        )}

        {/* Ready to scan — user clicks to start */}
        {status === "idle" && modelsLoaded && (
          <div className="relative z-10 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <button
              type="button"
              onClick={startCamera}
              className="group flex flex-col items-center gap-4 transition-all cursor-pointer"
            >
              <div className="bg-blue-500/10 p-6 rounded-full border-2 border-blue-500/30 group-hover:border-blue-500/60 group-hover:bg-blue-500/20 transition-all">
                <Camera className="w-16 h-16 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-white font-bold text-lg">Start Face Scan</span>
              <span className="text-slate-500 text-xs">Tap to activate camera</span>
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="relative z-10 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-white font-bold mb-4">{error}</p>
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="bg-green-500/20 p-6 rounded-full border border-green-500/30 mb-4 animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-green-500 font-bold tracking-widest uppercase text-sm">Identity Scanned</p>
          </div>
        )}

        {/* Scan Line Animation */}
        {status === "detecting" && (
          <div className="absolute inset-x-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 animate-scan" />
        )}

        {/* Viewfinder Brackets */}
        {status === "detecting" && (
          <div className="absolute inset-10 border-2 border-white/5 rounded-3xl pointer-events-none">
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl" />
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl" />
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl" />
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl" />
          </div>
        )}
      </div>

      <div className="text-center">
        {mode === "register" && status === "detecting" && (
          <button
            onClick={handleCapture}
            disabled={!faceDescriptor}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
          >
            <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Capture Biometric Data
          </button>
        )}

        {status === "detecting" && (
          <p className="mt-4 text-slate-500 text-xs font-medium uppercase tracking-widest animate-pulse">
            {faceDescriptor ? "Face Lock-on Successful" : "Position face in viewfinder"}
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
