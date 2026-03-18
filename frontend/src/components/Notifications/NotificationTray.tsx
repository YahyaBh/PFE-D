"use client";

import { useState } from "react";
import { X, Bell, Check, Trash2, ShieldAlert, CreditCard, Sparkles, MessageSquare, Clock } from "lucide-react";
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
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bg-blue-500/10';
      case 'REQUEST': return 'bg-indigo-500/10';
      case 'SECURITY': return 'bg-red-500/10';
      case 'REWARD': return 'bg-amber-500/10';
      default: return 'bg-slate-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-grayscale animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar Tray */}
      <div className="relative w-full max-w-lg bg-background border-l-8 border-foreground shadow-[-16px_0_0_0_rgba(0,0,0,1)] dark:shadow-[-16px_0_0_0_white] animate-in slide-in-from-right duration-500 flex flex-col h-full">
        
        {/* Header */}
        <div className="px-10 py-10 flex items-center justify-between border-b-8 border-foreground bg-primary text-white">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
              NOTIFICATIONS
            </h2>
            <div className="flex items-center gap-3 mt-4">
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-secondary text-foreground text-[10px] font-black px-3 py-1 border-2 border-foreground uppercase tracking-widest">
                    {notifications.filter(n => !n.isRead).length} NEW_LOGS
                </span>
              )}
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">SYSTEM_STREAM_ACTIVE</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-white hover:text-primary transition-all"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="px-10 py-6 bg-secondary flex justify-between items-center border-b-4 border-foreground">
            <button 
                onClick={onMarkAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-primary hover:text-white px-4 py-2 border-2 border-foreground transition-all flex items-center gap-3"
            >
                <Check className="w-4 h-4" /> CLEAR_ALL_INDICATORS
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-6 custom-scrollbar bg-background">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20">
              <div className="w-24 h-24 border-4 border-foreground flex items-center justify-center mb-8 rotate-12">
                <Bell className="w-12 h-12 text-foreground" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">ARCHIVE_VOID // NO_RECORDS_FOUND</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={cn(
                  "group relative p-8 border-4 transition-all duration-300",
                  n.isRead 
                    ? "bg-background border-foreground/10 grayscale-[0.8] opacity-40 shadow-none" 
                    : "bg-background border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_white]"
                )}
                onMouseEnter={() => !n.isRead && onMarkRead(n.id)}
              >
                <div className="flex gap-6">
                  <div className={cn("w-16 h-16 border-2 border-foreground flex items-center justify-center shrink-0", !n.isRead ? "bg-secondary" : "bg-foreground/5")}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">{n.title}</h3>
                        {!n.isRead && <div className="w-3 h-3 border-2 border-foreground bg-primary mt-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" />}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60 leading-relaxed mb-4">{n.message}</p>
                    <div className="flex items-center gap-2 text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em] bg-foreground/5 px-2 py-1 inline-flex border border-foreground/5">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="absolute top-6 right-6 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onDelete(n.id)}
                        className="w-10 h-10 border-2 border-foreground bg-red-600 text-white flex items-center justify-center hover:bg-background hover:text-red-600 transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        title="Delete Alert"
                    >
                        <Trash2 className="w-5 h-5" />
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
