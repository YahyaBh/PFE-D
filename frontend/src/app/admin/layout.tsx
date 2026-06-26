"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, ArrowLeftRight, Store, Megaphone, LayoutDashboard,
  LogOut, ChevronRight, ShieldCheck, Search, Bell, Menu, X,
  BookOpen, ShieldAlert, Fingerprint, User, Settings, ChevronDown,
  CheckCheck, X as XIcon, Loader2, Info, AlertTriangle, AlertCircle,
  Clock, MessageSquare, UserCheck, CreditCard
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const NOTIF_ICONS: Record<string, any> = {
  SYSTEM_ANNOUNCEMENT: Info,
  SECURITY_ALERT: AlertTriangle,
  KYC: UserCheck,
  DISPUTE: MessageSquare,
  TRANSACTION: CreditCard,
  REWARD: CreditCard,
};

const NOTIF_COLORS: Record<string, string> = {
  SYSTEM_ANNOUNCEMENT: '#3b82f6',
  SECURITY_ALERT: '#f59e0b',
  KYC: '#10b981',
  DISPUTE: '#ef4444',
  TRANSACTION: '#8b5cf6',
  REWARD: '#f59e0b',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checked, setChecked] = useState(false);
  const [adminName, setAdminName] = useState("AD");
  const [adminFull, setAdminFull] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isLoginPage = pathname === "/admin/login";
    if (isLoginPage) { setChecked(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setAdminFull(u);
        setAdminName(u.name?.charAt(0).toUpperCase() + (u.name?.charAt(1)?.toUpperCase() || 'D'));
      } catch {}
    }
    setChecked(true);
  }, [router, pathname]);

  // Fetch notifications
  const fetchNotifs = async () => {
    try {
      const res = await api.get("/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // SSE for admin notifications
  useEffect(() => {
    if (!checked) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const sseUrl = `${baseUrl}/admin/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    es.addEventListener('unread_count', () => fetchNotifs());
    es.addEventListener('error', () => {});
    return () => es.close();
  }, [checked]);

  // Initial fetch & poll fallback
  useEffect(() => {
    if (!checked) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [checked]);

  // Click outside close for notif dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!checked) return null;

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const handleMarkRead = async (id: string) => {
    await api.patch(`/admin/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.patch("/admin/notifications/read-all");
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/admin" },
    { name: "Users", icon: Users, href: "/admin/users" },
    { name: "Transactions", icon: ArrowLeftRight, href: "/admin/transactions" },
    { name: "Merchant Requests", icon: Store, href: "/admin/merchant-requests" },
    { name: "Broadcast", icon: Megaphone, href: "/admin/broadcast" },
    { name: "Audit Logs", icon: ShieldCheck, href: "/admin/audit" },
    { name: "General Ledger", icon: BookOpen, href: "/admin/ledger" },
    { name: "Disputes", icon: ShieldAlert, href: "/admin/disputes" },
    { name: "KYC Reviews", icon: Fingerprint, href: "/admin/kyc" },
  ];

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900/50 backdrop-blur-3xl border-r border-slate-800 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-black text-sm">MW</span>
              </div>
              <div>
                <h1 className="text-white font-black text-sm tracking-tight">Marjane Wallet</h1>
                <p className="text-[10px] font-bold text-blue-400/60 tracking-widest uppercase">Admin Panel</p>
              </div>
            </div>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-8 pt-0">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all group border border-slate-800/50">
              <LogOut className="w-5 h-5" /><span className="font-bold text-sm">Exit Admin</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-medium">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3 opacity-30" />
              <span className="text-white capitalize">{pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global search..."
                className="bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all w-64" />
            </form>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifs(); }}
                className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-blue-500 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-white"
                    style={{ minWidth: '18px', minHeight: '18px' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50"
                  style={{ background: '#111118' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        style={{ color: '#3b82f6' }}>
                        <CheckCheck className="w-3 h-3" /> Mark All Read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n: any) => {
                        const Icon = NOTIF_ICONS[n.type] || Info;
                        const color = NOTIF_COLORS[n.type] || '#3b82f6';
                        return (
                          <div key={n.id} onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                            className="px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            style={{ background: !n.is_read ? 'rgba(59,130,246,0.03)' : 'transparent' }}>
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: `${color}15` }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{n.title}</p>
                                <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{n.message}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    {n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                  {!n.is_read && (
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 20 && (
                    <div className="p-3 text-center border-t border-white/5">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Showing 20 of {notifications.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-inner">{adminName}</div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50" style={{ background: '#111118' }}>
                  <div className="p-5 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">{adminFull?.name || 'Admin'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{adminFull?.email || ''}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setAvatarOpen(false); router.push('/admin/profile'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                      <User className="w-4 h-4" /><span className="font-medium">Profile</span>
                    </button>
                    <button onClick={() => { setAvatarOpen(false); router.push('/admin/settings'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                      <Settings className="w-4 h-4" /><span className="font-medium">Settings</span>
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button onClick={() => { setAvatarOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                      <LogOut className="w-4 h-4" /><span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </main>
    </div>
  );
}
