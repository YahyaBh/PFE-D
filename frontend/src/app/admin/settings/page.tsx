"use client";

import { useState } from "react";
import { Settings, Moon, Sun, Bell, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Configure your admin preferences</p>
      </div>

      <div className="rounded-2xl p-8 space-y-6" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Moon className="w-4 h-4" style={{ color: '#3b82f6' }} /> Appearance
        </h2>

        <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5" style={{ color: '#3b82f6' }} /> : <Sun className="w-5 h-5" style={{ color: '#f59e0b' }} />}
            <div>
              <p className="text-sm font-medium text-white">Dark Mode</p>
              <p className="text-xs" style={{ color: '#64748B' }}>Toggle dark/light theme</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: darkMode ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
              style={{ left: darkMode ? '22px' : '2px' }}
            />
          </button>
        </div>

        <h2 className="text-sm font-bold text-white flex items-center gap-2 pt-4">
          <Bell className="w-4 h-4" style={{ color: '#3b82f6' }} /> Notifications
        </h2>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" style={{ color: '#64748B' }} />
            <div>
              <p className="text-sm font-medium text-white">Email Alerts</p>
              <p className="text-xs" style={{ color: '#64748B' }}>Receive admin notifications via email</p>
            </div>
          </div>
          <button
            onClick={() => setEmailNotifs(!emailNotifs)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: emailNotifs ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
              style={{ left: emailNotifs ? '22px' : '2px' }}
            />
          </button>
        </div>

        <h2 className="text-sm font-bold text-white flex items-center gap-2 pt-4">
          <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} /> Session
        </h2>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Admin Panel
        </button>
      </div>
    </div>
  );
}
