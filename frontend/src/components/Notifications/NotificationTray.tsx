"use client";

import { useState } from "react";
import { X, Bell, Check, Trash2, ShieldAlert, CreditCard, Sparkles, MessageSquare, Clock, Settings, ArrowLeftRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationTrayProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

export default function NotificationTray({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead, 
  onMarkAllRead,
  onDelete 
}: NotificationTrayProps) {
  
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'REQUEST': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'SECURITY': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'REWARD': return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'SYSTEM': return <Settings className="w-5 h-5 text-slate-400" />;
      case 'TRANSACTION': return <ArrowLeftRight className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };


  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Backdrop - Deeper blur for premium feel */}
      <div 
        className="absolute inset-0 bg-background/40 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Sidebar Tray - Glassmorphism & Fluid Curvature */}
      <div className="relative w-full max-w-lg fluid-glass rounded-l-[3rem] shadow-2xl animate-in slide-in-from-right duration-700 flex flex-col h-full overflow-hidden border-l border-white/10">
        
        {/* Header - Airy and Modern */}
        <div className="px-10 py-12 flex items-center justify-between border-b border-foreground/5 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center gap-4">
              Alerts <span className="text-secondary italic">Hub</span>
            </h2>
            <div className="flex items-center gap-3">
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                    {notifications.filter(n => !n.isRead).length} NEW_MESSAGES
                </span>
              )}
              <p className="text-foreground/20 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Stream Active
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground hover:text-background transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Actions Bar - Minimalist */}
        <div className="px-10 py-6 flex justify-between items-center border-b border-foreground/5">
            <button 
                onClick={onMarkAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors flex items-center gap-2 group"
            >
                <Check className="w-4 h-4 group-hover:scale-125 transition-transform" /> 
                Mark all as read
            </button>
        </div>

        {/* List - Spaced and Organic */}
        <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6 custom-scrollbar bg-transparent">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
              <div className="w-32 h-32 rounded-full bg-foreground/5 flex items-center justify-center mb-10 animate-fluid-float">
                <Bell className="w-12 h-12 text-foreground/40" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/40 leading-relaxed">
                Void // Zero Records <br/>
                <span className="font-medium lowercase tracking-normal opacity-50">your stream is currently empty</span>
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={cn(
                  "group relative p-8 rounded-3xl transition-all duration-500 border overflow-hidden",
                  n.isRead 
                    ? "bg-transparent border-foreground/5 opacity-60 grayscale-[0.5]" 
                    : "bg-white/50 dark:bg-card/50 backdrop-blur-md border-white/20 shadow-xl shadow-primary/5 hover:-translate-y-1 hover:shadow-2xl"
                )}
                onMouseEnter={() => !n.isRead && onMarkRead(n.id)}
              >
                {/* Visual Accent for Unread */}
                {!n.isRead && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                )}

                <div className="flex gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                    !n.isRead ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/20"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">{n.title}</h3>
                        {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-lg shadow-secondary/50 mt-1.5" />}
                    </div>
                    <p className="text-sm font-medium text-foreground/60 leading-relaxed mb-4">{n.message}</p>
                    <div className="flex items-center gap-2 text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em] bg-foreground/5 px-2 py-1 rounded-sm inline-flex">
                        <Clock className="w-3 h-3 text-primary/40" />
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Delete Trigger - Revealed on hover */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                        className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
