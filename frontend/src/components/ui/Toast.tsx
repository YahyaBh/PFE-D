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
    error: <AlertCircle className="w-8 h-8 text-white" />,
    success: <CheckCircle className="w-8 h-8 text-foreground" />,
    info: <Info className="w-8 h-8 text-white" />,
  };

  const colors = {
    error: "border-foreground bg-red-600 text-white shadow-[8px_8px_0_0_rgba(220,38,38,0.3)]",
    success: "border-foreground bg-secondary text-foreground shadow-[8px_8px_0_0_rgba(251,230,10,0.3)]",
    info: "border-foreground bg-primary text-white shadow-[8px_8px_0_0_rgba(22,73,141,0.3)]",
  };

  return (
    <div className={cn(
      "fixed top-10 right-10 z-[200] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <div className={cn(
        "flex items-center gap-6 px-10 py-6 border-4 min-w-[400px] shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_white]",
        colors[type]
      )}>
        <div className="flex-shrink-0 animate-bounce">
          {icons[type]}
        </div>
        <div className="flex-grow">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">{type}_FEEDBACK</p>
            <p className="text-sm font-black uppercase tracking-tight leading-tight">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
          }}
          className="w-10 h-10 border-2 border-current flex items-center justify-center hover:bg-white hover:text-black transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
