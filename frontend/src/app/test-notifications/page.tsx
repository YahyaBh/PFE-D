"use client";

import { useState } from "react";
import NotificationTray from "@/components/Notifications/NotificationTray";
import Toast from "@/components/ui/Toast";

export default function TestNotificationsPage() {
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const mockNotifications = [
    {
      id: "1",
      type: "PAYMENT",
      title: "Payment Received",
      message: "You have received 500 MAD from Ahmad.",
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      type: "SECURITY",
      title: "New Login Detected",
      message: "A new login was detected from Casablanca, Morocco.",
      isRead: true,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-background p-20 space-y-10">
      <h1 className="text-6xl font-black tracking-tighter uppercase">Design <span className="text-primary">Staging</span></h1>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setIsTrayOpen(true)}
          className="px-10 py-5 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          Open Notification Tray
        </button>

        <button 
          onClick={() => setToast({ message: "Transaction successful!", type: "success" })}
          className="px-10 py-5 bg-secondary text-primary rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-secondary/20"
        >
          Trigger Success Toast
        </button>

        <button 
          onClick={() => setToast({ message: "Security Alert: Unauthorized access attempt.", type: "error" })}
          className="px-10 py-5 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-red-500/20"
        >
          Trigger Error Toast
        </button>
      </div>

      <NotificationTray 
        isOpen={isTrayOpen}
        onClose={() => setIsTrayOpen(false)}
        notifications={mockNotifications}
        onMarkRead={() => {}}
        onMarkAllRead={() => {}}
        onDelete={() => {}}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type as any} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
