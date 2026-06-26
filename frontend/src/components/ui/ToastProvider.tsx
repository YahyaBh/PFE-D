"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  paused: boolean;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const MAX_VISIBLE = 5;
const DEFAULT_DURATION = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;
function genId() {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}-${Date.now()}`;
}

const typeConfig: Record<ToastType, { border: string; bg: string; icon: React.ElementType }> = {
  success: { border: "border-l-green-500", bg: "bg-green-500", icon: CheckCircle2 },
  error: { border: "border-l-red-500", bg: "bg-red-500", icon: AlertCircle },
  info: { border: "border-l-blue-500", bg: "bg-blue-500", icon: Info },
  warning: { border: "border-l-amber-500", bg: "bg-amber-500", icon: AlertTriangle },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const startRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      if (toast.paused) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startRef.current;
      const newProgress = Math.max(0, ((remainingRef.current - elapsed) / toast.duration) * 100);
      setProgress(newProgress);
      if (newProgress <= 0) {
        handleClose();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [toast.paused]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative w-[360px] bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
        "border-l-4",
        config.border,
        exiting ? "opacity-0 translate-x-full" : "opacity-100 translate-y-0"
      )}
      onMouseEnter={() => { toast.paused = true; }}
      onMouseLeave={() => {
        toast.paused = false;
        startRef.current = Date.now();
        remainingRef.current = Math.max(0, (progress / 100) * toast.duration);
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-foreground/20 transition-all shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3 text-foreground/40" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-foreground/5">
        <div
          className={cn("h-full transition-[width] duration-100 linear", config.bg.replace("bg-", "bg-").replace("-500", "-500/60"))}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration: number = DEFAULT_DURATION) => {
      const id = genId();
      const toast: ToastData = { id, type, title, message, duration, paused: false };
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), toast]);
    },
    []
  );

  const success = useCallback((title: string, message?: string) => addToast("success", title, message), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast("error", title, message), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast("info", title, message), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast("warning", title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
