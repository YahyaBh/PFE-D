"use client";

import { api } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Lock, Smartphone, Shield,
  Loader2, CheckCircle2, XCircle, Edit3, Save, Eye, EyeOff,
  LogOut, AlertTriangle, ChevronDown, Activity,
  Fingerprint, ShieldCheck, Zap, Bell, Clock, Monitor
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import NotificationTray from "@/components/Notifications/NotificationTray";
import Link from "next/link";

const SECTIONS = {
  kyc: {
    icon: ShieldCheck,
    title: "ACCOUNT VERIFICATION",
    subtitle: 'STATUS: ACTIONS REQUIRED',
    color: "#FFD700",
    glow: "rgba(255,215,0,0.15)",
  },
  limits: {
    icon: Activity,
    title: "TRANSACTION LIMITS",
    subtitle: "YOUR SPENDING AND TRANSFER LIMITS",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.15)",
  },
  password: {
    icon: Lock,
    title: "SECURITY & PASSWORD",
    subtitle: "KEEP YOUR ACCOUNT SECURE",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.15)",
  },
  sessions: {
    icon: Monitor,
    title: "ACTIVE SESSIONS",
    subtitle: "10 DEVICES CONNECTED",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.15)",
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [hasFaceAuth, setHasFaceAuth] = useState(false);
  const [loadingFace, setLoadingFace] = useState(true);
  const [removingFace, setRemovingFace] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [kycStatus, setKycStatus] = useState("UNVERIFIED");
  const [limitsData, setLimitsData] = useState<any>(null);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, faceRes, sessionsRes, notificationRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/profile/face-status"),
        api.get("/profile/sessions"),
        api.get("/notifications")
      ]);
      const [userData, faceData, sessionsData, notifData] = await Promise.all([
        userRes.json(),
        faceRes.json(),
        sessionsRes.json(),
        notificationRes.json()
      ]);

      setUser(userData);
      setEditName(userData.name || "");
      setEditPhone(userData.phone || "");
      setTwoFactorEnabled(!!userData.twoFactorEnabled);
      setHasFaceAuth(faceData.hasFaceAuth);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);

      try { const kycRes = await api.get("/kyc/status"); const kycData = await kycRes.json(); setKycStatus(kycData.status || "UNVERIFIED"); } catch { }
      try { const limitsRes = await api.get("/limits"); const lData = await limitsRes.json(); setLimitsData(lData); } catch { }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingFace(false);
      setLoadingSessions(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.patch("/profile", { name: editName, phone: editPhone });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ message: "Profile updated.", type: "success" });
      setIsEditing(false);
      fetchAll();
    } catch (err: any) {
      setToast({ message: err.message || "Update failed", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToast({ message: "Password mismatch", type: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.post("/profile/change-password", { currentPassword, newPassword });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ message: "Password updated.", type: "success" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setExpandedSection(null);
    } catch (err: any) {
      setToast({ message: err.message || "Rotation failed", type: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const res = await api.post("/profile/toggle-2fa", { enabled: !twoFactorEnabled });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTwoFactorEnabled(data.twoFactorEnabled);
      setToast({ message: data.twoFactorEnabled ? "2FA enabled" : "2FA disabled", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Toggle failed", type: "error" });
    } finally {
      setToggling2FA(false);
    }
  };

  const handleRemoveFaceAuth = async () => {
    setRemovingFace(true);
    try {
      const res = await api.delete("/profile/face-auth");
      if (!res.ok) throw new Error("Failed to remove biometric data");
      setHasFaceAuth(false);
      setToast({ message: "Biometric data removed.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setRemovingFace(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      const res = await api.post("/profile/logout-all");
      if (!res.ok) throw new Error("Termination failed");
      setSessions([]);
      setShowLogoutConfirm(false);
      setToast({ message: "All devices disconnected.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoggingOutAll(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleMarkNotifRead = async (id: string) => {
    try { await api.patch(`/notifications/${id}/read`); setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); } catch (e) { console.error(e); }
  };
  const handleMarkAllNotifsRead = async () => {
    try { await api.patch(`/notifications/read-all`); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); } catch (e) { console.error(e); }
  };
  const handleDeleteNotif = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); setNotifications(prev => prev.filter(n => n.id !== id)); } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading || !user) return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <div className="w-10 h-10 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#475569" }}>Loading your profile...</p>
      </div>
    </div>
  );

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <style>{`
        @keyframes glow-yellow { 0%,100%{box-shadow:0 0 8px rgba(255,215,0,0.15)} 50%{box-shadow:0 0 20px rgba(255,215,0,0.3)} }
        .glow-yellow { animation: glow-yellow 2s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b" style={{ background: "rgba(10,14,26,0.8)", borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" style={{ background: "rgba(255,255,255,0.04)" }}>
              <img loading="lazy" src="/Marjane-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:block" style={{ color: "#E2E8F0" }}>
              MARJANE <span className="font-light italic" style={{ color: "#FFD700" }}>PROTOCOL</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#FFD700" }}
            >
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>

            <div className="relative">
              <button onClick={() => setIsNotificationTrayOpen(true)} className="relative p-2.5 rounded-full transition-all active:scale-90 hover:bg-white/5">
                <Bell className="w-4 h-4" style={{ color: "#64748B" }} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#FFD700", color: "#0A0E1A" }}>{unreadCount}</span>
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full animate-ping" style={{ background: "#FFD700", opacity: 0.3 }} />
                  </>
                )}
              </button>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>{user.name?.charAt(0) || "U"}</div>

            <button onClick={handleLogout} className="p-2.5 rounded-full transition-all active:scale-90 hover:bg-white/5">
              <LogOut className="w-4 h-4" style={{ color: "#EF4444" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24 space-y-8">

        {/* ═══ PROFILE HEADER ═══ */}
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-10" style={{ background: "rgba(17,17,24,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: "#FFD700", filter: "blur(60px)" }} />
          <div className="absolute -left-24 -bottom-24 w-64 h-64 rounded-full opacity-[0.03]" style={{ background: "#FFD700", filter: "blur(60px)" }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold" style={{ background: "rgba(255,215,0,0.1)", border: "2px solid rgba(255,215,0,0.4)", color: "#FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.15)" }}>
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ background: "#22C55E", borderColor: "#0A0E1A" }}>
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#94A3B8" }}>ACCOUNT OWNER</p>
                <h1 className="text-2xl md:text-3xl font-bold leading-none tracking-tight" style={{ color: "#E2E8F0" }}>{user.name}</h1>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <div className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest" style={{ background: "rgba(255,215,0,0.12)", color: "#0A0E1A", boxShadow: "inset 0 0 0 1px rgba(255,215,0,0.3)" }}>
                  <span style={{ color: "#FFD700" }}>{(user.tier || "Standard") + " MEMBER"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-medium tracking-wider" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B" }}>
                  <Zap className="w-3 h-3" style={{ color: "#FFD700" }} />
                  MEMBER SINCE {new Date(user.createdAt).getFullYear()}
                </div>
              </div>
            </div>

            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="shrink-0 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 inline mr-1.5" /> Save</>}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="shrink-0 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}
              >
                <Edit3 className="w-4 h-4 inline mr-1.5" /> Edit
              </button>
            )}
          </div>

          {isEditing && (
            <div className="relative z-10 mt-6 pt-6 border-t flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Full Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Phone</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══ SETTINGS SECTIONS ═══ */}
        {[
          { key: "kyc", icon: ShieldCheck, title: "ACCOUNT VERIFICATION", subtitle: `STATUS: ${kycStatus === "VERIFIED" ? "VERIFIED" : "ACTIONS REQUIRED"}`, children: (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: kycStatus === "VERIFIED" ? "rgba(34,197,94,0.15)" : kycStatus === "PENDING" ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)" }}>
                    {kycStatus === "VERIFIED" ? <ShieldCheck className="w-6 h-6" style={{ color: "#22C55E" }} /> :
                     kycStatus === "PENDING" ? <Clock className="w-6 h-6" style={{ color: "#FFD700" }} /> :
                     <Shield className="w-6 h-6" style={{ color: "#475569" }} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{kycStatus === "VERIFIED" ? "Verified" : kycStatus === "PENDING" ? "Review In Progress" : "Unverified"}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{kycStatus === "VERIFIED" ? "Your account is fully verified" : "Complete verification to unlock all features"}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: kycStatus === "VERIFIED" ? "rgba(34,197,94,0.12)" : "rgba(255,215,0,0.12)", color: kycStatus === "VERIFIED" ? "#22C55E" : "#FFD700" }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${kycStatus === "VERIFIED" ? "" : "pulse-dot"}`} style={{ background: kycStatus === "VERIFIED" ? "#22C55E" : "#FFD700" }} />
                  {kycStatus || "PENDING"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Email", done: true },
                  { label: "Phone", done: true },
                  { label: "ID", done: kycStatus === "VERIFIED" },
                  { label: "Selfie", done: kycStatus === "VERIFIED" },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: step.done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${step.done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} /> : <XCircle className="w-5 h-5" style={{ color: "#475569" }} />}
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: step.done ? "#22C55E" : "#475569" }}>{step.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/kyc")}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}
              >
                <Fingerprint className="w-4 h-4" />
                {kycStatus === "UNVERIFIED" ? "Start Verification" : "Update Profile"}
              </button>
            </div>
          )},
          { key: "limits", icon: Activity, title: "TRANSACTION LIMITS", subtitle: "YOUR SPENDING AND TRANSFER LIMITS", children: (
            <div className="space-y-5">
              {!limitsData ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#FFD700" }} /></div>
              ) : (
                <>
                  {[
                    { label: "Daily Transfer", usage: limitsData.usage?.transfer?.daily || 0, limit: limitsData.limits?.daily_transfer_limit || 10000 },
                    { label: "Monthly Transfer", usage: limitsData.usage?.transfer?.monthly || 0, limit: limitsData.limits?.monthly_transfer_limit || 50000 },
                    { label: "Daily Withdrawal", usage: limitsData.usage?.withdrawal?.daily || 0, limit: limitsData.limits?.daily_withdrawal_limit || 5000 },
                    { label: "Daily Deposit", usage: limitsData.usage?.deposit?.daily || 0, limit: limitsData.limits?.daily_deposit_limit || 20000 },
                  ].map((item, idx) => {
                    const percent = Math.min(100, (item.usage / item.limit) * 100);
                    return (
                      <div key={idx} className="p-5 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#64748B" }}>{item.label}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: percent > 90 ? "rgba(239,68,68,0.12)" : "rgba(255,215,0,0.12)", color: percent > 90 ? "#EF4444" : "#FFD700" }}>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, background: percent > 90 ? "#EF4444" : "linear-gradient(90deg, #FFD700, #FFE135)" }} />
                        </div>
                        <p className="text-sm font-semibold tabular-nums" style={{ color: "#94A3B8" }}>
                          {item.usage.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: "#475569" }}>/ {parseFloat(item.limit).toLocaleString()} MAD</span>
                        </p>
                      </div>
                    );
                  })}

                  <div className="flex items-start gap-3 p-5 rounded-2xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)" }}>
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FFD700" }} />
                    <p className="text-[10px] font-medium leading-relaxed" style={{ color: "#94A3B8" }}>Unlock higher limits by increasing your verification level.</p>
                  </div>
                </>
              )}
            </div>
          )},
          { key: "password", icon: Lock, title: "SECURITY & PASSWORD", subtitle: "KEEP YOUR ACCOUNT SECURE", children: (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="********"
                    className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                  />
                  <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#475569" }}>
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                    <Smartphone className="w-5 h-5" style={{ color: "#6366F1" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>Two-Factor Authentication</p>
                    <p className="text-[10px]" style={{ color: "#64748B" }}>Add an extra layer of security</p>
                  </div>
                </div>
                <div onClick={toggling2FA ? undefined : handleToggle2FA} className="w-10 h-6 rounded-full relative cursor-pointer transition-all active:scale-90" style={{ background: twoFactorEnabled ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)" }}>
                  {toggling2FA ? (
                    <Loader2 className="absolute top-1 left-1 w-4 h-4 animate-spin" style={{ color: "#94A3B8" }} />
                  ) : (
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${twoFactorEnabled ? 'right-0.5' : 'left-0.5'}`} style={{ background: twoFactorEnabled ? "#22C55E" : "#64748B" }} />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: hasFaceAuth ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)" }}>
                    <ShieldCheck className="w-5 h-5" style={{ color: hasFaceAuth ? "#22C55E" : "#475569" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>Face Authentication</p>
                    <p className="text-[10px]" style={{ color: "#64748B" }}>{hasFaceAuth ? "Biometric data enrolled" : "Not configured"}</p>
                  </div>
                </div>
                {hasFaceAuth ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} /> ENROLLED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "#475569" }}>
                    <XCircle className="w-3 h-3" /> NOT SET
                  </span>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Update Password</>}
              </button>
            </div>
          )},
          { key: "sessions", icon: Monitor, title: "ACTIVE SESSIONS", subtitle: `${sessions.length} DEVICES CONNECTED`, children: (
            <div className="space-y-4">
              {loadingSessions ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#FFD700" }} /></div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: "#475569" }}>No active sessions</div>
              ) : (
                sessions.map((s: any, i: number) => (
                  <div key={s.id || i} className="flex items-center justify-between p-4 rounded-2xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <Monitor className="w-5 h-5" style={{ color: "#64748B" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>{s.device || "Unknown Device"}</p>
                        <p className="text-[10px]" style={{ color: "#64748B" }}>
                          {s.lastLogin ? `Last active: ${new Date(s.lastLogin).toLocaleDateString()}` : 'Active now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {i === 0 && <span className="px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>This Device</span>}
                      <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ color: "#475569" }}>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {sessions.length > 0 && (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
                >
                  <LogOut className="w-4 h-4" /> Sign Out of All Devices
                </button>
              )}
            </div>
          )},
        ].map((section) => {
          const isExpanded = expandedSection === section.key;
          const isHovered = hoveredSection === section.key;
          const SectionIcon = section.icon;
          const k = section.key;

          return (
            <div
              key={k}
              ref={(el) => { sectionRefs.current[k] = el; }}
              className="relative overflow-hidden rounded-2xl transition-all duration-300"
              style={{
                background: "rgba(17,17,24,0.6)",
                border: `1px solid ${isExpanded ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)"}`,
                backdropFilter: "blur(12px)",
                boxShadow: isHovered ? "0 8px 30px rgba(0,0,0,0.3)" : "0 4px 15px rgba(0,0,0,0.2)",
                transform: isHovered ? "translateY(-1px)" : "none",
              }}
              onMouseEnter={() => setHoveredSection(k)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {isExpanded && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "linear-gradient(180deg, #FFD700, #FFE135)", boxShadow: "0 0 8px rgba(255,215,0,0.4)" }} />
              )}

              <button
                onClick={() => toggleSection(k)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isExpanded ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
                      boxShadow: isExpanded ? "0 0 12px rgba(255,215,0,0.15)" : "none",
                    }}
                  >
                    <SectionIcon
                      className="w-5 h-5 transition-all duration-300"
                      style={{ color: isExpanded ? "#FFD700" : "#64748B" }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold tracking-wide" style={{ color: "#E2E8F0" }}>{section.title}</h3>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: k === "kyc" && kycStatus !== "VERIFIED" ? "#FFD700" : "#475569" }}>{section.subtitle}</p>
                  </div>
                </div>

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isExpanded ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                    transform: isExpanded ? "rotate(180deg)" : "none",
                  }}
                >
                  <ChevronDown className="w-4 h-4 transition-all duration-300" style={{ color: isExpanded ? "#FFD700" : "#475569" }} />
                </div>
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isExpanded ? "1000px" : "0",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {section.children}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="h-12" />
      </main>

      {/* ═══ LOGOUT CONFIRMATION ═══ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500" style={{ background: "rgba(17,17,24,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(239,68,68,0.12)" }}>
              <AlertTriangle className="w-7 h-7" style={{ color: "#EF4444" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#E2E8F0" }}>Sign Out All Devices</h3>
            <p className="text-[11px] font-medium mb-6" style={{ color: "#64748B" }}>This will log you out from all other devices and browsers.</p>
            <div className="space-y-3">
              <button
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: "#EF4444", color: "#FFF", boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }}
              >
                {loggingOutAll ? "Ending sessions..." : "Confirm Sign Out"}
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all" style={{ color: "#64748B" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationTray
        isOpen={isNotificationTrayOpen}
        onClose={() => setIsNotificationTrayOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onDelete={handleDeleteNotif}
      />
    </div>
  );
}
