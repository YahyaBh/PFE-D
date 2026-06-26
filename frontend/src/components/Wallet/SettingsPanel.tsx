"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, User, Shield, Bell, SlidersHorizontal, Camera, CheckCircle2,
  Smartphone, Monitor, Laptop, LogOut, Eye, EyeOff,
  Download, Trash2, Loader2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "@/lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "profile" | "security" | "notifications" | "preferences";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    phone: string;
    dob?: string;
    avatar?: string;
  };
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-foreground/5 border border-transparent focus:border-primary/30 rounded-xl px-5 py-3.5 text-sm font-medium text-foreground focus:outline-none transition-all placeholder:text-foreground/20"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/30">{title}</p>
      <div className="bg-foreground/5 rounded-2xl p-5 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10 h-6 rounded-full transition-all relative shrink-0",
        checked ? "bg-primary" : "bg-foreground/10"
      )}
    >
      <div className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
        checked && "translate-x-4"
      )} />
    </button>
  );
}

export default function SettingsPanel({
  isOpen,
  onClose,
  user = { name: "Yahya", email: "yahya@marjane.ma", phone: "+212 6 12 34 56 78", dob: "1995-06-15" },
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState(user);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [lang, setLang] = useState<"EN" | "FR" | "AR">("EN");
  const [defCur, setDefCur] = useState("MAD");
  const [showCurDropdown, setShowCurDropdown] = useState(false);
  const curDropdownRef = useRef<HTMLDivElement>(null);

  const [notifSettings, setNotifSettings] = useState({
    transactions: { email: true, push: true },
    promotions: { email: false, push: true },
    security: { email: true, push: true },
    priceAlerts: { email: false, push: false },
  });

  const sessions = [
    { id: "1", device: "iPhone 15 Pro", location: "Casablanca, MA", lastActive: "Now", isCurrent: true, icon: Smartphone },
    { id: "2", device: "Chrome on macOS", location: "Rabat, MA", lastActive: "2 hours ago", isCurrent: false, icon: Monitor },
    { id: "3", device: "Safari on macOS", location: "Marrakech, MA", lastActive: "3 days ago", isCurrent: false, icon: Laptop },
  ];

  const [paused, setPaused] = useState(false);
  const [exiting, setExiting] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  ];

  useEffect(() => {
    if (isOpen) { setExiting(false); setActiveTab("profile"); setDirty(false); }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (curDropdownRef.current && !curDropdownRef.current.contains(e.target as Node)) setShowCurDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showPasswordModal) setShowPasswordModal(false);
        else handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, showPasswordModal]);

  const handleClose = () => { setExiting(true); setTimeout(onClose, 300); };

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/profile", { name: profile.name, email: profile.email, phone: profile.phone, dob: profile.dob });
      setDirty(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className={cn("fixed inset-0 z-[150] bg-background/40 backdrop-blur-sm transition-opacity duration-300", exiting ? "opacity-0" : "opacity-100")}
          onClick={handleClose}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[420px] z-[160] bg-card/80 backdrop-blur-2xl border-l border-border/50 shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isOpen && !exiting ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border/30 shrink-0">
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          <button onClick={handleClose} className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/20 transition-all" aria-label="Close settings">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-border/30 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                activeTab === tab.id ? "text-primary" : "text-foreground/30 hover:text-foreground/60"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4 pt-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" aria-label="Upload avatar">
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground">{profile.name}</p>
              </div>
              <Field label="Full Name" value={profile.name} onChange={(v) => handleProfileChange("name", v)} />
              <Field label="Email" value={profile.email} onChange={(v) => handleProfileChange("email", v)} type="email" />
              <Field label="Phone" value={profile.phone} onChange={(v) => handleProfileChange("phone", v)} type="tel" />
              <Field label="Date of Birth" value={profile.dob || ""} onChange={(v) => handleProfileChange("dob", v)} type="date" />
              <button
                onClick={handleSaveProfile}
                disabled={!dirty || saving}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Section title="Password">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono font-bold text-foreground/60 tracking-widest">••••••••</p>
                  <button onClick={() => setShowPasswordModal(true)} className="text-xs font-bold text-primary hover:text-primary/80 transition-all">Change</button>
                </div>
              </Section>

              <Section title="Two-Factor Authentication">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Authenticator App</p>
                    <p className={cn("text-xs font-medium", twoFactor ? "text-green-500" : "text-foreground/40")}>{twoFactor ? "Enabled" : "Disabled"}</p>
                  </div>
                  <Toggle checked={twoFactor} onChange={setTwoFactor} />
                </div>
              </Section>

              <Section title="Biometric">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Face ID / Fingerprint</p>
                    <p className={cn("text-xs font-medium flex items-center gap-1", biometric ? "text-green-500" : "text-foreground/40")}>
                      {biometric && <CheckCircle2 className="w-3 h-3" />}{biometric ? "Enrolled" : "Not enrolled"}
                    </p>
                  </div>
                  <Toggle checked={biometric} onChange={setBiometric} />
                </div>
              </Section>

              <Section title="Active Sessions">
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 bg-foreground/5 rounded-xl px-4 py-3">
                      <s.icon className="w-4 h-4 text-foreground/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate flex items-center gap-2">
                          {s.device}{s.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                        </p>
                        <p className="text-[10px] text-foreground/40">{s.location} · {s.lastActive}</p>
                      </div>
                      {!s.isCurrent && (
                        <button className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-all">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={async () => { try { await api.post("/profile/logout-all"); } catch {} }} className="text-xs font-bold text-red-400 hover:text-red-500 transition-all flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" />Logout all devices
                </button>
              </Section>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {([
                { key: "transactions" as const, label: "Transactions", desc: "Payment confirmations, transfers, deposits" },
                { key: "promotions" as const, label: "Promotions", desc: "Deals, offers, and promotional messages" },
                { key: "security" as const, label: "Security Alerts", desc: "Login attempts, password changes, suspicious activity" },
                { key: "priceAlerts" as const, label: "Price Alerts", desc: "Exchange rate changes and market updates" },
              ]).map((cat) => {
                const settings = notifSettings[cat.key];
                return (
                  <Section key={cat.key} title={cat.label}>
                    <p className="text-xs text-foreground/40 mb-3">{cat.desc}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">Email</span>
                      <Toggle checked={settings.email} onChange={(v) => setNotifSettings((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], email: v } }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">Push</span>
                      <Toggle checked={settings.push} onChange={(v) => setNotifSettings((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], push: v } }))} />
                    </div>
                  </Section>
                );
              })}
              <button
                onClick={() => setPaused(!paused)}
                className={cn("w-full h-11 rounded-full text-sm font-bold transition-all active:scale-95",
                  paused ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}
              >
                {paused ? "Resume All Notifications" : "Pause All Notifications"}
              </button>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Section title="Language">
                <div className="flex gap-2">
                  {(["EN", "FR", "AR"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
                        lang === l ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-foreground/5 text-foreground/40 hover:text-foreground"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Default Currency">
                <div className="relative" ref={curDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCurDropdown(!showCurDropdown)}
                    className="w-full flex items-center justify-between bg-foreground/5 rounded-xl px-5 py-3.5 text-sm font-bold hover:bg-foreground/10 transition-all"
                  >
                    <span>{defCur}</span>
                    <span className="text-foreground/40">▼</span>
                  </button>
                  {showCurDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden">
                      {["MAD", "USD", "EUR"].map((c) => (
                        <button key={c} type="button" onClick={() => { setDefCur(c); setShowCurDropdown(false); }}
                          className={cn("w-full flex items-center px-5 py-3 text-sm font-bold transition-all hover:bg-foreground/5",
                            c === defCur ? "text-primary" : "text-foreground/60"
                          )}
                        >{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Theme">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-foreground/40">More themes coming soon</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-primary relative opacity-50 cursor-not-allowed">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow translate-x-4" />
                  </div>
                </div>
              </Section>

              <button onClick={() => { try { api.get("/profile/export").then(r => r.blob()).then(blob => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "marjane-data.json"; a.click(); URL.revokeObjectURL(url); }); } catch {} }} className="flex items-center gap-2 text-xs font-bold text-foreground/40 hover:text-foreground transition-all">
                <Download className="w-3.5 h-3.5" />Export Data
              </button>

              <button onClick={async () => { if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) { try { await api.delete("/profile"); localStorage.clear(); window.location.href = "/login"; } catch {} } }} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-500 transition-all">
                <Trash2 className="w-3.5 h-3.5" />Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative w-full max-w-sm bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[1.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/20" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPw ? "text" : "password"} placeholder="Enter current password" className="w-full bg-foreground/5 border border-transparent focus:border-primary/30 rounded-xl px-5 py-3.5 text-sm focus:outline-none pr-12"
                    value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground transition-all" aria-label={showCurrentPw ? "Hide password" : "Show password"}>
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} placeholder="Enter new password" className="w-full bg-foreground/5 border border-transparent focus:border-primary/30 rounded-xl px-5 py-3.5 text-sm focus:outline-none pr-12"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground transition-all" aria-label={showNewPw ? "Hide password" : "Show password"}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 h-11 rounded-full bg-foreground/5 text-sm font-bold hover:bg-foreground/10 transition-all">Cancel</button>
              <button onClick={async () => {
                  try {
                    await api.post("/profile/change-password", { currentPassword, newPassword });
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                  } catch {}
                }}
                disabled={!currentPassword || !newPassword}
                className="flex-[2] h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale"
              >Update Password</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
