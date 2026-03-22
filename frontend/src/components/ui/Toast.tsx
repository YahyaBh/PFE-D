"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToastType = "error" | "success" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "error", onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    error: <AlertCircle className="w-6 h-6" />,
    success: <CheckCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />,
  };


  return (
    <div className={cn(
      "fixed top-12 right-12 z-[200] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform",
      isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-90"
    )}>
      <div className={cn(
        "flex items-center gap-6 px-10 py-5 rounded-full fluid-glass border border-white/10 organic-shadow min-w-[420px] relative overflow-hidden group",
        type === 'error' ? "shadow-red-500/10" : type === 'success' ? "shadow-secondary/20" : "shadow-primary/20"
      )}>
        {/* Animated Background Pulse */}
        <div className={cn(
            "absolute inset-0 opacity-[0.03] animate-pulse pointer-events-none",
            type === 'error' ? "bg-red-500" : type === 'success' ? "bg-secondary" : "bg-primary"
        )} />

        <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12",
            type === 'error' ? "bg-red-500 text-white" : type === 'success' ? "bg-secondary text-primary" : "bg-primary text-white"
        )}>
          {icons[type]}
        </div>
        
        <div className="flex-grow py-1">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/30 mb-0.5">{type}_SIGNAL</p>
            <p className="text-sm font-bold text-foreground leading-tight tracking-tight">{message}</p>
        </div>

        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
          className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground hover:text-background transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
