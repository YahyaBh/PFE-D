"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Lock, Smartphone, ScanFace, Shield,
  Loader2, CheckCircle2, XCircle, Edit3, Save, Eye, EyeOff,
  LogOut, Trash2, AlertTriangle, ChevronDown, ChevronUp, BadgeCheck, Clock, Activity,
  Moon, Sun, Sparkles, Fingerprint, ShieldCheck, Zap, Bell
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useTheme } from "@/components/ThemeProvider";
import NotificationTray from "@/components/Notifications/NotificationTray";
import Link from "next/link";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Face Auth
  const [hasFaceAuth, setHasFaceAuth] = useState(false);
  const [loadingFace, setLoadingFace] = useState(true);
  const [removingFace, setRemovingFace] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // KYC
  const [kycStatus, setKycStatus] = useState("UNVERIFIED");

  // Limits
  const [limitsData, setLimitsData] = useState<any>(null);

  // Expandable sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, faceRes, sessionsRes, notificationRes] = await Promise.all([
        fetch("http://localhost:5000/api/auth/me", { headers }),
        fetch("http://localhost:5000/api/profile/face-status", { headers }),
        fetch("http://localhost:5000/api/profile/sessions", { headers }),
        fetch("http://localhost:5000/api/notifications", { headers })
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
      setHasFaceAuth(faceData.hasFaceAuth);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);

      try {
        const kycRes = await fetch("http://localhost:5000/api/kyc/status", { headers });
        const kycData = await kycRes.json();
        setKycStatus(kycData.status || "UNVERIFIED");
      } catch { }

      try {
        const limitsRes = await fetch("http://localhost:5000/api/limits", { headers });
        const lData = await limitsRes.json();
        setLimitsData(lData);
      } catch { }
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
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PATCH", headers,
        body: JSON.stringify({ name: editName, phone: editPhone })
      });
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
      const res = await fetch("http://localhost:5000/api/profile/change-password", {
        method: "POST", headers,
        body: JSON.stringify({ currentPassword, newPassword })
      });
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

  const handleRemoveFaceAuth = async () => {
    setRemovingFace(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile/face-auth", {
        method: "DELETE", headers
      });
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
      const res = await fetch("http://localhost:5000/api/profile/logout-all", {
        method: "POST", headers
      });
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
    try {
        await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
        console.error(e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
        await fetch(`http://localhost:5000/api/notifications/read-all`, {
            method: 'PATCH',
            headers
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
        console.error(e);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
        await fetch(`http://localhost:5000/api/notifications/${id}`, {
            method: 'DELETE',
            headers
        });
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
        console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20">Loading your profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-1000 bg-zellige-soft">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ───── Fluid Navigation ───── */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-4xl no-print">
        <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 group-hover:rotate-[360deg] transition-all duration-1000 shadow-xl">
                    <img src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block">
                    <span className="font-display font-bold text-lg tracking-tight text-foreground uppercase flex flex-col leading-none">
                        MARJANE <span className="text-primary italic text-xs tracking-[0.2em]">PROTOCOL</span>
                    </span>
                </div>
            </Link>

            <div className="h-8 w-[1px] bg-foreground/10 hidden md:block" />
            
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 px-6 py-2 bg-secondary text-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                <ArrowLeft className="w-3 h-3" /> Dashboard
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {[
                { icon: Bell, onClick: () => setIsNotificationTrayOpen(true), badge: notifications.filter(n => !n.isRead).length },
                { icon: User, onClick: () => router.push("/profile") },
                { icon: LogOut, onClick: handleLogout, variant: 'destructive' }
            ].map((btn, i) => (
                <button 
                    key={i}
                    onClick={btn.onClick}
                    className={cn(
                        "relative p-4 rounded-full hover:bg-foreground/5 transition-all active:scale-90",
                        btn.variant === 'destructive' ? "text-red-500" : "text-foreground"
                    )}
                >
                    <btn.icon className="w-6 h-6" />
                    {typeof btn.badge === 'number' && btn.badge > 0 && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                            {btn.badge}
                        </span>
                    )}
                </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-44 pb-24 space-y-12">

        {/* ───── Profile Header (Hero) ───── */}
        <div className="relative p-12 fluid-card bg-primary text-primary-foreground overflow-hidden group transition-all hover:scale-[1.01]">
          <div className="absolute -right-20 -top-20 w-[30rem] h-[30rem] bg-white opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.05] transition-opacity duration-1000" />
          <div className="absolute -left-20 -bottom-20 w-[30rem] h-[30rem] bg-secondary opacity-10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-40 h-40 rounded-full border-4 border-white/20 bg-white flex items-center justify-center shadow-2xl relative overflow-hidden group p-8">
                <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary-foreground/40">Account Owner</p>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none truncate max-w-[400px]">
                        {user.name}
                    </h2>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                    <div className="px-6 py-2 bg-secondary text-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/10">
                        {user.tier || "Standard"} Member
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-3.5 h-3.5" />
                        Member since {new Date(user.createdAt).getFullYear()}
                    </div>
                </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-48 h-48" />
          </div>
        </div>

        {/* ───── Appearance (Theme) ───── */}
        <FluidSection
          icon={<Zap className="w-6 h-6 text-primary" />}
          title="Appearance"
          subtitle={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'}`}
          expanded={expandedSection === "appearance"}
          onToggle={() => toggleSection("appearance")}
        >
          <div className="pt-8">
            <div className="flex items-center justify-between p-8 bg-white dark:bg-card border border-foreground/5 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  theme === 'dark' ? "bg-primary text-white" : "bg-secondary text-primary"
                )}>
                  {theme === 'dark' ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
                </div>
                <div>
                  <p className="font-display font-black text-xl tracking-tight text-foreground uppercase leading-none mb-1">Dark Mode</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Adjust the app's appearance</p>
                </div>
              </div>
              
              <button 
                onClick={toggleTheme}
                className={cn(
                  "relative inline-flex h-12 w-24 items-center rounded-full transition-all focus:outline-none shadow-inner",
                  theme === 'dark' ? "bg-primary" : "bg-secondary"
                )}
              >
                <div className={cn(
                  "inline-block h-8 w-8 rounded-full bg-white shadow-xl transition-transform",
                  theme === 'dark' ? "translate-x-14" : "translate-x-2"
                )} />
              </button>
            </div>
          </div>
        </FluidSection>

        {/* ───── Account Verification (KYC) ───── */}
        <FluidSection
          icon={<BadgeCheck className="w-6 h-6 text-primary" />}
          title="Account Verification"
          subtitle={kycStatus === "VERIFIED" ? "Status: Verified" : "Status: Actions required"}
          expanded={expandedSection === "kyc"}
          onToggle={() => toggleSection("kyc")}
        >
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between p-8 bg-white dark:bg-card border border-foreground/5 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center gap-8">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all",
                  kycStatus === "VERIFIED" ? "bg-primary text-white" :
                  kycStatus === "PENDING" ? "bg-secondary text-primary" :
                  kycStatus === "REJECTED" ? "bg-red-500 text-white" : "bg-card text-foreground/20"
                )}>
                  {kycStatus === "VERIFIED" ? <ShieldCheck className="w-10 h-10" /> :
                   kycStatus === "PENDING" ? <Clock className="w-10 h-10" /> :
                   kycStatus === "REJECTED" ? <XCircle className="w-10 h-10" /> :
                   <Shield className="w-10 h-10" />}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-2xl tracking-tighter text-foreground uppercase leading-none">
                    {kycStatus === "VERIFIED" ? "Verified" :
                     kycStatus === "PENDING" ? "Review In Progress" :
                     kycStatus === "REJECTED" ? "Verification Failed" : "Unverified"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                    {kycStatus === "VERIFIED" ? "Your account is fully verified" : "Complete verification to unlock all features"}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push("/kyc")}
              className="w-full bg-foreground text-background dark:bg-white dark:text-black rounded-[2rem] font-black py-8 transition-all hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 shadow-2xl active:scale-95"
            >
              <Fingerprint className="w-6 h-6" />
              {kycStatus === "UNVERIFIED" ? "Start Verification" : "Update Profile"}
            </button>
          </div>
        </FluidSection>

        {/* ───── Transaction Limits ───── */}
        <FluidSection
          icon={<Activity className="w-6 h-6 text-primary" />}
          title="Transaction Limits"
          subtitle="Your spending and transfer limits"
          expanded={expandedSection === "limits"}
          onToggle={() => toggleSection("limits")}
        >
          <div className="pt-8 space-y-10">
            {!limitsData ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: "Daily Transfer", usage: limitsData.usage.transfer.daily, limit: limitsData.limits.daily_transfer_limit },
                      { label: "Monthly Transfer", usage: limitsData.usage.transfer.monthly, limit: limitsData.limits.monthly_transfer_limit },
                      { label: "Daily Withdrawal", usage: limitsData.usage.withdrawal.daily, limit: limitsData.limits.daily_withdrawal_limit },
                      { label: "Daily Deposit", usage: limitsData.usage.deposit.daily, limit: limitsData.limits.daily_deposit_limit },
                    ].map((item, idx) => {
                      const percent = Math.min(100, (item.usage / item.limit) * 100);
                      return (
                        <div key={idx} className="p-8 bg-white dark:bg-card border border-foreground/5 rounded-[2.5rem] shadow-xl space-y-6">
                          <div className="flex justify-between items-start">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">{item.label}</p>
                            <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full">{percent.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-1000", percent > 90 ? "bg-red-500" : "bg-primary")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xl font-black tracking-tighter text-foreground">
                            {item.usage.toLocaleString()} <span className="text-xs text-foreground/20 italic">/ {parseFloat(item.limit).toLocaleString()} {limitsData.limits.currency}</span>
                          </p>
                        </div>
                      );
                    })}
                </div>
                <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-6 items-center">
                  <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                  <p className="text-[10px] text-foreground/60 font-medium uppercase tracking-[0.2em] leading-relaxed">
                    Unlock higher limits by increasing your verification level.
                  </p>
                </div>
              </>
            )}
          </div>
        </FluidSection>

        {/* ───── Security & Password ───── */}
        <FluidSection
          icon={<Lock className="w-6 h-6 text-primary" />}
          title="Security & Password"
          subtitle="Keep your account secure"
          expanded={expandedSection === "password"}
          onToggle={() => toggleSection("password")}
        >
          <div className="space-y-8 pt-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-8">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-white dark:bg-card border-none rounded-full px-10 py-6 text-lg font-bold shadow-lg focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-foreground/5"
                />
                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-8 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-primary">
                  {showCurrentPw ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-8">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white dark:bg-card border-none rounded-full px-10 py-6 text-lg font-bold shadow-lg focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-8">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-white dark:bg-card border-none rounded-full px-10 py-6 text-lg font-bold shadow-lg focus:ring-4 focus:ring-primary/10"
                  />
                </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full bg-primary text-white rounded-full font-black py-8 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-4"
            >
              {savingPassword ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Lock className="w-6 h-6" /> Update Password</>}
            </button>
          </div>
        </FluidSection>

        {/* ───── Active Sessions ───── */}
        <FluidSection
          icon={<Smartphone className="w-6 h-6 text-primary" />}
          title="Active Sessions"
          subtitle={`${sessions.length} devices connected`}
          expanded={expandedSection === "sessions"}
          onToggle={() => toggleSection("sessions")}
        >
          <div className="pt-8 space-y-6">
            {loadingSessions ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              sessions.map((s: any, i: number) => (
                <div key={s.id || i} className="flex items-center justify-between p-8 bg-white dark:bg-card border border-foreground/5 rounded-[2.5rem] shadow-xl group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-xl text-foreground uppercase tracking-tight">{s.device}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                        {s.lastLogin ? `Last active: ${new Date(s.lastLogin).toLocaleDateString()}` : 'Active now'}
                      </p>
                    </div>
                  </div>
                  {i === 0 && <span className="px-4 py-2 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest">This Device</span>}
                </div>
              ))
            )}
            
            <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full mt-6 py-6 text-red-500 font-black uppercase tracking-[0.4em] text-[10px] hover:text-red-600 transition-colors"
            >
                Sign out of all other devices
            </button>
          </div>
        </FluidSection>

        {/* ───── Sign Out Confirmation ───── */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl" onClick={() => setShowLogoutConfirm(false)} />
            <div className="relative w-full max-w-xl bg-white dark:bg-card rounded-[4rem] shadow-2xl p-16 space-y-12 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                    <AlertTriangle className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                    <h3 className="text-4xl font-black uppercase tracking-tighter">Sign Out All Devices</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 max-w-[300px] mx-auto">
                        This will log you out from all other devices and web browsers.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleLogoutAll} 
                        disabled={loggingOutAll}
                        className="w-full bg-red-500 text-white rounded-full font-black py-6 uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-red-500/20"
                    >
                        {loggingOutAll ? "Ending sessions..." : "Confirm Sign Out"}
                    </button>
                    <button onClick={() => setShowLogoutConfirm(false)} className="py-4 text-foreground/40 font-black uppercase tracking-widest text-[10px] hover:text-foreground">
                        Cancel
                    </button>
                </div>
            </div>
          </div>
        )}

        <div className="h-20" />
      </main>

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

function FluidSection({ icon, title, subtitle, expanded, onToggle, children }: any) {
  return (
    <div className={cn(
      "fluid-card bg-transparent border-none transition-all duration-500",
      expanded ? "bg-white/50 dark:bg-card/50" : ""
    )}>
      <button
        onClick={onToggle}
        className="w-full px-12 py-10 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-card shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-foreground uppercase tracking-tighter text-3xl leading-none">{title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">{subtitle}</p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-full border border-foreground/5 flex items-center justify-center group-hover:bg-foreground/5 transition-all">
          {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </button>
      {expanded && (
        <div className="px-12 pb-12 animate-in slide-in-from-top-8 duration-700 ease-out">
          {children}
        </div>
      )}
    </div>
  );
}
