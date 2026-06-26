"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, HelpCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  shakeOnDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  shakeOnDanger = true,
}: ConfirmModalProps) {
  const [shaking, setShaking] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  useEffect(() => {
    setShaking(false);
  }, [isOpen]);

  const handleConfirmHover = () => {
    if (variant === "danger" && shakeOnDanger && !shaking) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />

      <div
        className={cn(
          "relative w-full max-w-[380px] bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[1.5rem] shadow-2xl scale-95 opacity-0 animate-in zoom-in-95 fade-in duration-300 fill-mode-forwards overflow-hidden",
          shaking && "animate-shake"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/20 transition-all z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-8 pt-10 pb-8 text-center space-y-5">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center mx-auto",
            variant === "danger" ? "bg-red-500/10" : "bg-blue-500/10"
          )}>
            {variant === "danger" ? (
              <AlertTriangle className="w-7 h-7 text-red-500" />
            ) : (
              <HelpCircle className="w-7 h-7 text-blue-500" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground leading-tight">{title}</h3>

          {/* Message */}
          <p className="text-sm text-foreground/60 leading-relaxed">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-12 rounded-full bg-foreground/5 text-sm font-bold text-foreground/80 hover:bg-foreground/10 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              onMouseEnter={handleConfirmHover}
              className={cn(
                "flex-1 h-12 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95",
                variant === "danger"
                  ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                  : "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
