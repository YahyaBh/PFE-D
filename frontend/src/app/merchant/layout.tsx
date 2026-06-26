"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  LayoutDashboard, 
  QrCode, 
  History, 
  ArrowLeftRight, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Store,
  Bell,
  Search,
  ChevronDown,
  User,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AUTH_PAGES = ["/merchant/login", "/merchant/register"];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchantName, setMerchantName] = useState("Loading Business...");
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNameSkeleton, setShowNameSkeleton] = useState(false);

  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isAuthPage) return <>{children}</>;

  const navItems = [
    { name: "Sales Overview", icon: LayoutDashboard, href: "/merchant/dashboard" },
    { name: "My QR Code", icon: QrCode, href: "/merchant/qr" },
    { name: "Transactions", icon: History, href: "/merchant/history" },
    { name: "Settlements", icon: ArrowLeftRight, href: "/merchant/settlements" },
  ];

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await api.get("/merchant/stats");
            const data = await res.json();
            if (res.ok) {
                setMerchantName(data.merchant.merchantName);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchStats();
  }, [router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/merchant/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.count ?? data.length ?? 0);
        }
      } catch {
        // endpoint not available yet
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (merchantName !== "Loading Business...") return;
    const timer = setTimeout(() => setShowNameSkeleton(true), 2000);
    return () => clearTimeout(timer);
  }, [merchantName]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div style={{ background: '#0a0a1a', color: '#ffffff' }} className="flex min-h-screen font-sans transition-colors duration-500">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
          !isSidebarOpen && "-translate-x-full"
        )}
        style={{ 
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div style={{ 
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255,215,0,0.2)'
            }}>
              <Store className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter italic text-white">MARJANE</h1>
              <p style={{ color: '#FFD700' }} className="text-[10px] font-extrabold uppercase tracking-widest leading-none">Merchant Hub</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group"
                )}
                style={{
                  background: pathname === item.href ? '#FFD700' : 'transparent',
                  color: pathname === item.href ? '#000000' : 'rgba(255,255,255,0.5)',
                  boxShadow: pathname === item.href ? '0 0 20px rgba(255,215,0,0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                <item.icon className="w-5 h-5" style={{ 
                  color: pathname === item.href ? '#000000' : 'rgba(255,255,255,0.5)' 
                }} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold rounded-2xl transition-all"
              style={{ color: '#f87171' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
                e.currentTarget.style.border = '1px solid rgba(248,113,113,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
              }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header 
          className="h-20 flex items-center justify-between px-8 sticky top-0 z-40"
          style={{ 
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl transition-all"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div 
              className="hidden md:flex items-center gap-2 rounded-2xl px-4 py-2 w-80"
              style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
                <Search className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input 
                    placeholder="Search payouts, transactions..." 
                    style={{ color: '#ffffff' }}
                    className="bg-transparent border-none text-xs focus:ring-0 placeholder-[rgba(255,255,255,0.3)] w-full outline-none"
                />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              className="relative p-2 rounded-xl transition-all"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <Bell className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                {notificationCount > 0 ? (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black"
                    style={{ background: '#f87171', color: '#ffffff', border: '2px solid rgba(10,10,26,1)' }}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                ) : (
                  <span 
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: '#FFD700', border: '2px solid rgba(10,10,26,1)' }}
                  />
                )}
            </button>
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                {merchantName === "Loading Business..." && showNameSkeleton ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="h-4 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-white leading-none">{merchantName}</p>
                    <p style={{ color: '#FFD700' }} className="text-[10px] font-extrabold uppercase tracking-widest mt-1">Authorized Owner</p>
                  </>
                )}
              </div>
              <div 
                className="w-10 h-10 rounded-xl p-[1px]"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                  <div 
                    className="w-full h-full rounded-[11px] flex items-center justify-center"
                    style={{ background: 'rgba(10,10,26,0.9)' }}
                  >
                    <Store className="w-5 h-5" style={{ color: '#FFD700' }} />
                  </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div key={pathname} className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
