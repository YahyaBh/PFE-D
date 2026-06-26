"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FaceAuthProps {
  onCapture: (descriptor: number[] | null) => void;
  mode: "register" | "login";
}

export default function FaceAuth({ onCapture, mode }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceapiRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number>(0);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "detecting" | "success" | "error">("loading");
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const consecutiveDetectionsRef = useRef(0);

  // ── Stop everything ──
  const stopAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  // ── 1. Load models (sequential, with timeout) ──
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      console.log("[FaceAuth] Loading face-api.js...");
      try {
        const mod = await import("face-api.js");
        if (cancelled) return;
        faceapiRef.current = mod;
        console.log("[FaceAuth] face-api.js loaded");

        const MODEL_URL = "/weights";
        const TIMEOUT_MS = 20000;

        const withTimeout = <T,>(p: Promise<T>, label: string): Promise<T> =>
          Promise.race([
            p,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error(`${label} timed out`)), TIMEOUT_MS)
            ),
          ]);

        console.log("[FaceAuth] Loading TinyFaceDetector...");
        await withTimeout(mod.nets.tinyFaceDetector.loadFromUri(MODEL_URL), "TinyFaceDetector");
        if (cancelled) return;
        console.log("[FaceAuth] TinyFaceDetector OK");

        console.log("[FaceAuth] Loading FaceLandmark68Net...");
        await withTimeout(mod.nets.faceLandmark68Net.loadFromUri(MODEL_URL), "FaceLandmark68Net");
        if (cancelled) return;
        console.log("[FaceAuth] FaceLandmark68Net OK");

        console.log("[FaceAuth] Loading FaceRecognitionNet...");
        await withTimeout(mod.nets.faceRecognitionNet.loadFromUri(MODEL_URL), "FaceRecognitionNet");
        if (cancelled) return;

        if (!mod.nets.faceRecognitionNet.isLoaded) {
          throw new Error("FaceRecognitionNet not loaded after loadFromUri");
        }
        console.log("[FaceAuth] FaceRecognitionNet OK");
        console.log("[FaceAuth] All models loaded successfully");

        if (!cancelled) {
          setModelsLoaded(true);
          setModelLoading(false);
          setStatus("idle");
        }
      } catch (err) {
        console.error("[FaceAuth] Model loading failed:", err);
        if (!cancelled) {
          setModelLoading(false);
          setError(
            err instanceof Error && err.message.includes("timed out")
              ? "Security modules timed out. Check your connection and refresh."
              : "Security modules failed to load. Please refresh."
          );
          setStatus("error");
        }
      }
    };

    load();
    return () => { cancelled = true; stopAll(); };
  }, [stopAll]);

  // ── 2. Start camera ──
  const startCamera = useCallback(async () => {
    if (!modelsLoaded || !faceapiRef.current) {
      console.warn("[FaceAuth] Cannot start camera — models not loaded");
      return;
    }
    console.log("[FaceAuth] Starting camera...");
    stopAll();
    setError(null);
    setStatus("loading");

    try {
      await new Promise(r => setTimeout(r, 300));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      console.log("[FaceAuth] Camera stream obtained");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("[FaceAuth] Video playing, readyState:", videoRef.current.readyState);
      }

      // Wait for actual video data
      for (let i = 0; i < 30; i++) {
        await new Promise(r => requestAnimationFrame(r));
        if (videoRef.current && videoRef.current.readyState >= 2) {
          console.log("[FaceAuth] Video data available after", (i + 1) * 16, "ms");
          break;
        }
      }

      // Size canvas to video
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth || 320;
        canvasRef.current.height = videoRef.current.videoHeight || 240;
        console.log("[FaceAuth] Canvas sized to", canvasRef.current.width, "x", canvasRef.current.height);
      }

      setStatus("detecting");
      console.log("[FaceAuth] Detection started");
    } catch (err: any) {
      console.error("[FaceAuth] Camera error:", err.name, err.message);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Allow camera permissions and refresh.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Connect a camera.");
      } else if (err.name === "NotReadableError") {
        setError("Camera busy. Close other apps using the camera.");
      } else {
        setError(`Camera error: ${err.message || "Unknown"}`);
      }
      setStatus("error");
    }
  }, [modelsLoaded, stopAll]);

  // ── 3. Face detection loop ──
  useEffect(() => {
    if (status !== "detecting" || !faceapiRef.current) return;

    const faceapi = faceapiRef.current;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 });
    consecutiveDetectionsRef.current = 0;
    let locked = false;

    console.log("[FaceAuth] Detection loop starting (", mode, "mode )");

    const detect = async () => {
      if (locked || !videoRef.current || !canvasRef.current) return;
      locked = true;

      try {
        const det = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        if (det) {
          console.log("[FaceAuth] Face detected — score:", det.detection.score.toFixed(3));
          consecutiveDetectionsRef.current += 1;
          setFaceDescriptor(det.descriptor);

          // Draw face box + landmarks
          const box = det.detection.box;
          const { x, y, width, height } = box;
          if (ctx) {
            ctx.strokeStyle = "#00FF88";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#00FF88";
            ctx.shadowBlur = 12;
            ctx.strokeRect(x, y, width, height);
            ctx.shadowBlur = 0;

            // Corners
            const cLen = 16;
            ctx.strokeStyle = "#00FF88";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y + cLen); ctx.lineTo(x, y); ctx.lineTo(x + cLen, y);
            ctx.moveTo(x + width - cLen, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cLen);
            ctx.moveTo(x + width, y + height - cLen); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - cLen, y + height);
            ctx.moveTo(x + cLen, y + height); ctx.lineTo(x, y + height); ctx.lineTo(x, y + height - cLen);
            ctx.stroke();

            // Score label
            ctx.fillStyle = "#00FF88";
            ctx.font = "bold 14px monospace";
            ctx.fillText(`${(det.detection.score * 100).toFixed(0)}%`, x + 6, y - 8);

            // Landmarks
            const landmarks = det.landmarks;
            if (landmarks) {
              const positions = landmarks.positions;
              ctx.fillStyle = "#00FF88";
              ctx.shadowColor = "#00FF88";
              ctx.shadowBlur = 6;
              for (const p of positions) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.shadowBlur = 0;
            }
          }

          if (mode === "login" && consecutiveDetectionsRef.current >= 3) {
            console.log("[FaceAuth] Login mode — 3 stable detections, capturing");
            stopAll();
            setStatus("success");
            onCapture(Array.from(det.descriptor));
            locked = false;
            return;
          }
        } else {
          if (consecutiveDetectionsRef.current > 0) {
            console.log("[FaceAuth] Detection lost after", consecutiveDetectionsRef.current, "frames");
          }
          consecutiveDetectionsRef.current = 0;
        }
      } catch (err) {
        console.error("[FaceAuth] Detection error:", err);
        consecutiveDetectionsRef.current = 0;
      }

      locked = false;
    };

    intervalRef.current = setInterval(detect, 200);

    return () => {
      console.log("[FaceAuth] Detection loop cleanup");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, mode, onCapture, stopAll]);

  // ── 4. Cleanup on unmount ──
  useEffect(() => {
    return () => {
      console.log("[FaceAuth] Component unmount — stopping all");
      stopAll();
    };
  }, [stopAll]);

  // ── Manual capture (register mode) ──
  const handleCapture = useCallback(() => {
    if (!faceDescriptor) return;
    console.log("[FaceAuth] Manual capture, descriptor length:", faceDescriptor.length);
    stopAll();
    setStatus("success");
    onCapture(Array.from(faceDescriptor));
  }, [faceDescriptor, onCapture, stopAll]);

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

        {/* Detection Canvas (overlaid on video) */}
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none z-20",
            status === "detecting" ? "block" : "hidden"
          )}
        />

        {/* Loading models */}
        {(status === "loading" || modelLoading) && (
          <div className="relative z-30 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">
              {modelsLoaded ? "Starting camera..." : "Loading security modules..."}
            </p>
          </div>
        )}

        {/* Ready to scan */}
        {status === "idle" && modelsLoaded && (
          <div className="relative z-30 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300">
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
          <div className="relative z-30 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-white font-bold mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              {mode === "register" && (
                <button
                  type="button"
                  onClick={() => { stopAll(); setStatus("success"); onCapture(null as any); }}
                  className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white px-6 py-3 rounded-2xl transition-all cursor-pointer text-sm"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="relative z-30 flex flex-col items-center animate-in zoom-in duration-500">
            <div className="bg-green-500/20 p-6 rounded-full border border-green-500/30 mb-4 animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-green-500 font-bold tracking-widest uppercase text-sm">Identity Scanned</p>
          </div>
        )}

        {/* Scan Line */}
        {status === "detecting" && (
          <div className="absolute inset-x-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 animate-scan" />
        )}

        {/* Viewfinder Brackets */}
        {status === "detecting" && (
          <div className="absolute inset-10 border-2 border-white/5 rounded-3xl pointer-events-none z-10">
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
            {faceDescriptor ? "✓ Face Locked" : "Position face in viewfinder"}
          </p>
        )}

        {status === "success" && mode === "register" && (
          <p className="mt-4 text-green-500 text-xs font-medium uppercase tracking-widest">
            ✓ Biometric data captured
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
