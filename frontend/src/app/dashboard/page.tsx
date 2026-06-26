"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ShieldCheck, Smartphone, ChevronRight, CreditCard, ArrowRight, Sparkles, Bell, QrCode, Landmark, TrendingUp, TrendingDown, X } from "lucide-react";
import TransferModal from "@/components/Wallet/TransferModal";
import DepositModal from "@/components/Wallet/DepositModal";
import RequestModal from "@/components/Wallet/RequestModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import ConvertModal from "@/components/Wallet/ConvertModal";
import QRScannerModal from "@/components/Wallet/QRScannerModal";
import TransactionDetailModal from "@/components/Wallet/TransactionDetailModal";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import { apiFetch, BASE_URL } from "@/lib/api";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeCurrency, setActiveCurrency] = useState("MAD");
  const [stats, setStats] = useState<any>({ totalBalance: 0, pendingBalance: 0, monthlySpending: 0, rewardsEarned: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const responses = await Promise.all([
          apiFetch("/auth/me"),
          apiFetch("/transactions/recent"),
          apiFetch("/cards"),
          apiFetch("/transactions/requests"),
          apiFetch("/notifications"),
          apiFetch("/dashboard/stats"),
          apiFetch("/merchant/status")
        ]);
        const [userRes, transRes, cardsRes, reqsRes, notificationRes, statsRes, merchantRes] = responses;
        if (!userRes.ok) {
          const errorData = await userRes.json().catch(() => ({ error: "Session expired" }));
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          router.push(`/login?error=${encodeURIComponent(errorData.error || "Session expired")}`);
          return;
        }
        const safeJson = (res: Response, fallback: any) => res.ok ? res.json().catch(() => fallback) : fallback;
        const [userData, transData, cardsData, reqsData, unparsedNotifs, statsData, merchantData] = await Promise.all([
          userRes.json(), safeJson(transRes, []), safeJson(cardsRes, []),           safeJson(reqsRes, []), safeJson(notificationRes, []), safeJson(statsRes, { totalBalance: 0, pendingBalance: 0, monthlySpending: 0, rewardsEarned: 0 }), safeJson(merchantRes, { merchant: null })
        ]);
        setUser(userData);
        if (userData.role === 'ROLE_ADMIN') { router.push("/admin"); return; }
        if (merchantData?.merchant) { router.push("/merchant/dashboard"); return; }
        setTransactions(Array.isArray(transData) ? transData : []);
        setCards(Array.isArray(cardsData) ? cardsData : []);
        setPendingRequests(Array.isArray(reqsData) ? reqsData : []);
        setNotifications(Array.isArray(unparsedNotifs) ? unparsedNotifs : []);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Live polling for transaction stream
  useEffect(() => {
    if (loading) return;
    const poll = setInterval(async () => {
      try {
        const res = await apiFetch("/transactions/recent");
        const data = await res.json();
        if (Array.isArray(data)) setTransactions(data);
      } catch { /* silent */ }
    }, 15000);
    return () => clearInterval(poll);
  }, [loading]);

  // SSE for real-time notification updates
  useEffect(() => {
    if (loading) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const sseUrl = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('unread_count', (e) => {
      try {
        const data = JSON.parse(e.data);
        // Refetch notifications when count changes
        apiFetch("/notifications").then(res => {
          if (res.ok) res.json().then(data => {
            if (Array.isArray(data)) setNotifications(data);
          });
        }).catch(() => {});
      } catch { /* ignore parse errors */ }
    });

    eventSource.addEventListener('error', () => {
      // SSE will auto-reconnect
    });

    return () => eventSource.close();
  }, [loading]);

  // GSAP entrance animations
  useEffect(() => {
    if (loading) return;
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Particles
    for (let i = 0; i < 15; i++) {
      const p = document.createElement("div");
      p.className = "dashboard-particle";
      const size = 1 + Math.random() * 1;
      p.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(255,255,255,0.1);border-radius:50%;pointer-events:none;z-index:0;`;
      document.body.appendChild(p);
      gsap.to(p, { y: -(100 + Math.random() * 200), x: (Math.random() - 0.5) * 100, opacity: 0, duration: 15 + Math.random() * 20, repeat: -1, delay: Math.random() * 15, ease: "none" });
    }

    // Header
    tl.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });

    // Title area
    tl.fromTo("#page-title", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3");
    tl.fromTo("#last-login", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");

    // Metrics row — stagger cards
    if (metricsRef.current) {
      const cards = metricsRef.current.querySelectorAll(".metric-card");
      tl.fromTo(cards, { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 }, "-=0.2");

      // Sparkline draw
      const sparkline = metricsRef.current.querySelector("#sparkline-path") as SVGPathElement | null;
      if (sparkline) {
        const len = sparkline.getTotalLength();
        sparkline.style.strokeDasharray = String(len);
        sparkline.style.strokeDashoffset = String(len);
        gsap.to(sparkline, { strokeDashoffset: 0, duration: 1.5, ease: "power2.out", delay: 0.5 });
      }

      // Progress ring
      const ring = metricsRef.current.querySelector("#progress-ring") as SVGCircleElement | null;
      if (ring) {
        const len = ring.getTotalLength();
        ring.style.strokeDasharray = String(len);
        ring.style.strokeDashoffset = String(len * 0.67);
        gsap.to(ring, { strokeDashoffset: 0, duration: 1, ease: "power2.out", delay: 0.8 });
      }

      // Bar chart bars
      const bars = metricsRef.current.querySelectorAll(".bar-chart-bar");
      gsap.fromTo(bars, { height: 0 }, { height: "100%", duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.3 });
    }

    // Quick actions stagger
    if (actionsRef.current) {
      const btns = actionsRef.current.querySelectorAll(".quick-action-btn");
      tl.fromTo(btns, { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.06 }, "-=0.1");
    }

    // Card section
    if (cardRef.current) {
      tl.fromTo(cardRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, "-=0.1");
    }

    // Security panel
    if (securityRef.current) {
      tl.fromTo(securityRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.1");
    }

    // Activity rows stagger
    if (activityRef.current) {
      const rows = activityRef.current.querySelectorAll(".activity-row");
      tl.fromTo(rows, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.06 }, "-=0.2");
    }

    // Security shimmer
    gsap.to("#shield-shimmer", { opacity: 1, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut", repeatDelay: 3, delay: 1 });

    // Lock click
    const lock = document.getElementById("security-lock");
    if (lock) {
      gsap.fromTo(lock, { rotate: 0 }, { rotate: -10, duration: 0.4, ease: "back.out(2)", delay: 1.2 });
    }

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [loading]);

  const refreshBalance = async () => {
    try {
      const responses = await Promise.all([
        apiFetch("/auth/me"), apiFetch("/transactions/recent"), apiFetch("/cards"),
        apiFetch("/transactions/requests"), apiFetch("/notifications"), apiFetch("/dashboard/stats")
      ]);
      const [userData, transData, cardsData, reqsData, notifData, statsData] = await Promise.all(responses.map(r => r.json()));
      setUser(userData); setTransactions(transData); setCards(cardsData);
      setPendingRequests(reqsData); setNotifications(Array.isArray(notifData) ? notifData : []); setStats(statsData);
    } catch (err) { console.error(err); }
  };

  const handleMarkNotifRead = async (id: string) => {
    try { await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }); setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); }
    catch (e) { console.error(e); }
  };
  const handleMarkAllNotifsRead = async () => {
    try { await apiFetch(`/notifications/read-all`, { method: 'PATCH' }); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); }
    catch (e) { console.error(e); }
  };
  const handleDeleteNotif = async (id: string) => {
    try { await apiFetch(`/notifications/${id}`, { method: 'DELETE' }); setNotifications(prev => prev.filter(n => n.id !== id)); }
    catch (e) { console.error(e); }
  };
  const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(requestId);
    try {
      const res = await apiFetch("/transactions/process-request", { method: "POST", body: JSON.stringify({ requestId, action }) });
      if (res.ok) refreshBalance();
      else { const data = await res.json(); setToast({ message: data.error || "Failed", type: "error" }); }
    } catch (err) { console.error(err); }
  };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); router.push("/login"); };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const madWallet = (user?.wallets || []).find((w: any) => w.currency === "MAD");
  const usdWallet = (user?.wallets || []).find((w: any) => w.currency === "USD");
  const eurWallet = (user?.wallets || []).find((w: any) => w.currency === "EUR");
  const totalBalance = (user?.wallets || []).reduce((sum: number, w: any) => sum + parseFloat(w.balance || 0), 0);
  const isNoCard = !cards || cards.length === 0 || !cards[0]?.cardNumber;

  // Mock sparkline data
  const sparklineData = [280, 295, 310, 290, 305, 312, 312.72];
  const sparklineMax = Math.max(...sparklineData);
  const sparklineMin = Math.min(...sparklineData);
  const sparklineRange = sparklineMax - sparklineMin || 1;
  const sparkPoints = sparklineData.map((v, i) => `${(i / (sparklineData.length - 1)) * 100},${((sparklineMax - v) / sparklineRange) * 40 + 10}`).join(" ");

  // Mock bar chart data (last 7 days)
  const barData = [45, 60, 120, 80, 95, 110, 75];
  const barMax = Math.max(...barData);

  // Mock exchange rates
  const [lastRateUpdate] = useState(Date.now());
  const rates = [
    { pair: "USD/MAD", rate: 9.90, trend: "up" as const },
    { pair: "EUR/MAD", rate: 10.75, trend: "down" as const },
    { pair: "MAD/USD", rate: 0.101, trend: "down" as const },
    { pair: "MAD/EUR", rate: 0.093, trend: "up" as const },
  ];
  const rateTimeAgo = Math.floor((Date.now() - lastRateUpdate) / 60000);

  if (loading || !user) return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "#0A0E1A" }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="skeleton h-8 w-40 rounded-full" />
          <div className="flex items-center gap-3">
            <div className="skeleton h-8 w-28 rounded-full" />
            <div className="skeleton h-8 w-8 rounded-full skeleton-circle" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-6 w-28 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
          <div className="lg:col-span-5 rounded-3xl p-7 skeleton skeleton-card">
            <div className="skeleton h-4 w-24 mb-6 rounded" />
            <div className="skeleton h-12 w-48 mb-4 rounded" />
            <div className="skeleton h-4 w-32 mb-6 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-3 rounded-3xl p-7 skeleton skeleton-card">
            <div className="skeleton h-4 w-20 mb-6 rounded" />
            <div className="skeleton h-10 w-24 mb-4 rounded" />
            <div className="skeleton h-2 w-full mb-2 rounded" />
            <div className="skeleton h-2 w-3/4 rounded" />
          </div>
          <div className="lg:col-span-4 rounded-3xl p-7 skeleton skeleton-card">
            <div className="skeleton h-4 w-24 mb-6 rounded" />
            <div className="skeleton h-10 w-32 mb-4 rounded" />
            <div className="flex items-end gap-2 h-16 mb-2">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton flex-1 rounded-t-sm" />)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="skeleton rounded-3xl p-7 h-48 skeleton-card" />
            <div className="skeleton rounded-3xl p-7 h-48 skeleton-card" />
          </div>
          <div className="lg:col-span-7">
            <div className="skeleton rounded-3xl p-7 h-64 skeleton-card" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={pageRef} className="min-h-screen text-white font-sans antialiased relative overflow-x-hidden" style={{ background: "#0A0E1A" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Mesh Gradient Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #0066FF, transparent 70%)", animation: "morphMesh1 20s ease-in-out infinite alternate" }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #FFD700, transparent 70%)", animation: "morphMesh2 20s ease-in-out infinite alternate" }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #0066FF, transparent 70%)", animation: "morphMesh1 25s ease-in-out infinite alternate-reverse" }} />
      </div>

      {/* ─── Cursor Spotlight ─── */}
      <div id="dash-spotlight" className="fixed pointer-events-none z-[9999] rounded-full" style={{ width: "400px", height: "400px", background: "radial-gradient(circle, rgba(255,255,255,0.04), transparent 70%)", transform: "translate(-200px, -200px)", transition: "transform 0.15s ease-out" }} />

      <style>{`
        @keyframes morphMesh1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(60px, 40px) scale(1.2); } }
        @keyframes morphMesh2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-50px, -30px) scale(1.3); } }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan { animation: scan 2s linear infinite; }
        @keyframes pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); } 70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        .pulse-green { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .gold-shimmer { background: linear-gradient(90deg, rgba(255,215,0,0) 0%, rgba(255,215,0,0.15) 50%, rgba(255,215,0,0) 100%); background-size: 200% 100%; animation: shimmer 6s ease-in-out infinite; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in-up 0.6s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }
        @keyframes balance-pop { 0% { opacity: 0.6; transform: scale(0.96); } 100% { opacity: 1; transform: scale(1); } }
        .animate-balance-change { animation: balance-pop 0.35s ease-out; }
      `}</style>

      {/* ─── Cursor Tracking ─── */}
      <script dangerouslySetInnerHTML={{
        __html: `document.addEventListener('mousemove',function(e){var s=document.getElementById('dash-spotlight');if(s){s.style.transform='translate('+(e.clientX-200)+'px,'+(e.clientY-200)+'px)';}});`
      }} />

      {/* ─═══ HEADER ═══─ */}
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b border-white/[0.04]" style={{ background: "rgba(10,14,26,0.8)" }}>
        <div ref={headerRef} className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" style={{ background: "rgba(255,255,255,0.04)" }}>
              <img loading="lazy" src="/Marjane-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:block">
              MARJANE <span className="text-[#FFD700] font-light italic">WALLET</span>
            </span>
          </Link>

          {/* Center: Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
            <span>Dashboard</span>
            <span className="text-white/20">/</span>
            <span style={{ color: "#64748B" }}>Overview</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Exchange Rate Ticker (compact desktop) */}
            <div className="hidden lg:flex items-center gap-3 mr-2 text-[10px] px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="flex items-center gap-1 font-medium" style={{ color: "#FFD700" }}>⬤</span>
              {rates.filter(r => r.pair.startsWith('1') || r.pair.endsWith('/MAD')).slice(0, 2).map((r, i) => {
                const [from, to] = r.pair.split('/');
                return (
                  <span key={i} className="flex items-center gap-1.5">
                    <span style={{ color: "#64748B" }}>1 {from}</span>
                    <span className="font-medium" style={{ color: "#E2E8F0" }}>= {r.rate.toFixed(2)} {to}</span>
                    {r.trend === "up" ? <TrendingUp className="w-3 h-3" style={{ color: "#22C55E" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "#EF4444" }} />}
                  </span>
                );
              })}
              {(() => {
                const ratePairs: Record<string, [string, string, number][]> = {
                  MAD: [['USD', 'MAD', 9.90], ['EUR', 'MAD', 10.75]],
                  USD: [['MAD', 'USD', 0.101], ['EUR', 'USD', 1.086]],
                  EUR: [['MAD', 'EUR', 0.093], ['USD', 'EUR', 0.921]],
                };
                return (ratePairs[activeCurrency] || ratePairs.MAD).slice(0, 1).map(([from, to, rate], i) => (
                  <span key={i} className="flex items-center gap-1.5 ml-2">
                    <span style={{ color: "#64748B" }}>1 {from}</span>
                    <span className="font-medium" style={{ color: "#E2E8F0" }}>= {rate.toFixed(3)} {to}</span>
                  </span>
                ));
              })()}
              <span className="text-[9px]" style={{ color: "#475569" }}>{rateTimeAgo}m ago</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setIsNotifDropdownOpen(!isNotifDropdownOpen); setIsProfileDropdownOpen(false); }} className="relative p-2.5 rounded-full transition-all active:scale-90 hover:bg-white/5">
                <Bell className="w-5 h-5" style={{ color: "#64748B" }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#FFD700", color: "#0A0E1A", boxShadow: "0 0 6px rgba(255,215,0,0.6)" }}>{unreadCount}</span>
                )}
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full animate-ping" style={{ background: "#FFD700", opacity: 0.3 }} />}
              </button>

              {/* Notifications Dropdown */}
              {isNotifDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#E2E8F0" }}>Notifications</span>
                    {unreadCount > 0 && <button onClick={handleMarkAllNotifsRead} className="text-[10px] font-medium hover:underline" style={{ color: "#FFD700" }}>Mark all read</button>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs" style={{ color: "#475569" }}>No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((n: any) => (
                        <div key={n.id} className="flex items-start gap-3 p-4 border-b border-white/5 transition-colors hover:bg-white/[0.02]" style={{ opacity: n.isRead ? 0.6 : 1 }}>
                          <div className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{ background: n.isRead ? "transparent" : "#FFD700" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "#E2E8F0" }}>{n.title || "Activity"}</p>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: "#64748B" }}>{n.message || n.body || ""}</p>
                          </div>
                          <button onClick={() => handleDeleteNotif(n.id)} className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"><X className="w-3 h-3" style={{ color: "#475569" }} /></button>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && <div className="p-3 text-center text-[10px] font-medium border-t border-white/5" style={{ color: "#64748B" }}>View all</div>}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsNotifDropdownOpen(false); }} className="flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>{user.name?.charAt(0) || "U"}</div>
                <span className="text-[10px] font-medium hidden sm:block" style={{ color: "#94A3B8" }}>{user.name?.split(" ")[0] || "User"}</span>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl overflow-hidden z-50 shadow-2xl" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
                  <div className="p-4 border-b border-white/5">
                    <p className="text-xs font-semibold" style={{ color: "#E2E8F0" }}>{user.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{user.email}</p>
                  </div>
                  <div className="p-2">
                    {[
                      { label: "Profile", onClick: () => router.push("/profile") },
                      { label: "Cards", onClick: () => router.push("/cards") },
                      { label: "Transactions", onClick: () => router.push("/transactions") },
                    ].map((item, i) => (
                      <button key={i} onClick={item.onClick} className="w-full text-left px-3 py-2 text-xs rounded-xl transition-colors hover:bg-white/5" style={{ color: "#94A3B8" }}>{item.label}</button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs rounded-xl transition-colors hover:bg-white/5" style={{ color: "#EF4444" }}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Deposit */}
            <button onClick={() => setIsDepositModalOpen(true)} className="relative overflow-hidden px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg" style={{ background: "linear-gradient(135deg, #FFD700, #FFE135)", color: "#0A0E1A", boxShadow: "0 4px 15px rgba(255,215,0,0.25)" }}>
              Quick Deposit
            </button>
          </div>
        </div>
      </nav>

      {/* ─═══ MAIN CONTENT ═══─ */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-24">

        {/* ─── Exchange Rate Ticker (mobile) ─── */}
        <div ref={tickerRef} className="lg:hidden flex items-center gap-4 overflow-x-auto py-3 mb-4 text-[10px] scrollbar-none" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {rates.map((r, i) => {
            const [from, to] = r.pair.split('/');
            return (
              <span key={i} className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span style={{ color: "#475569" }}>1 {from}</span>
                <span className="font-medium" style={{ color: "#E2E8F0" }}>{r.rate.toFixed(2)} {to}</span>
                {r.trend === "up" ? <TrendingUp className="w-3 h-3" style={{ color: "#22C55E" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "#EF4444" }} />}
              </span>
            );
          })}
          <span className="text-[9px] shrink-0" style={{ color: "#475569" }}>{rateTimeAgo}m ago</span>
        </div>

        {/* ─── PAGE TITLE ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 mt-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: "#64748B", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>Overview</span>
              <span id="last-login" className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#475569" }}>• Last Login: {user.lastLogin || "Just Now"}</span>
            </div>
            <h1 id="page-title" className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
              Welcome back, <span style={{ color: "#FFD700" }}>{user.name?.split(" ")[0] || "User"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.03)", borderLeft: "4px solid #CD7F32", color: "#94A3B8" }}>
              <span style={{ color: "#CD7F32" }}>⬤</span> {user.tier || "BRONZE"} TIER
            </span>
            {(user?.wallets || []).length > 1 && (
              <div className="flex gap-1">
                {["MAD", "USD", "EUR"].filter(c => (user.wallets || []).some((w: any) => w.currency === c)).map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCurrency(c)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 active:scale-90"
                    style={{
                      background: c === activeCurrency ? "#facc15" : "#1a1a2e",
                      color: c === activeCurrency ? "#000" : "#94A3B8",
                      border: c === activeCurrency ? "1px solid #facc15" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: c === activeCurrency ? "0 0 12px rgba(250,204,21,0.3)" : "none",
                    }}
                  >{c}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─═══ TOP METRICS ROW (3 cards) ═══─ */}
        <div ref={metricsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8 animate-fade-in delay-1">

          {/* A. Total Balance — Primary Card */}
          <div className="metric-card lg:col-span-5 relative overflow-hidden rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div className="gold-shimmer absolute inset-0 pointer-events-none rounded-3xl" style={{ border: "1px solid rgba(255,215,0,0.15)" }} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Total Balance</span>
                <Wallet className="w-5 h-5" style={{ color: "#FFD700", filter: "drop-shadow(0 0 6px rgba(255,215,0,0.3))" }} />
              </div>
              {/* Primary: active currency */}
              {(() => {
                const primaryWallet = (user?.wallets || []).find((w: any) => w.currency === activeCurrency);
                const balance = primaryWallet ? parseFloat(primaryWallet.balance) : 0;
                const otherFiat = ['MAD', 'USD', 'EUR'].filter(c => c !== activeCurrency && (user.wallets || []).some((w: any) => w.currency === c));
                const rateMap: Record<string, { toMAD: number; toUSD: number; toEUR: number }> = {
                  MAD: { toMAD: 1, toUSD: 0.101, toEUR: 0.093 },
                  USD: { toMAD: 9.90, toUSD: 1, toEUR: 0.921 },
                  EUR: { toMAD: 10.75, toUSD: 1.086, toEUR: 1 },
                };
                const rates = rateMap[activeCurrency] || rateMap.MAD;
                return (
                  <>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span key={activeCurrency} className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight animate-balance-change" style={{ color: "#fff" }}>{balance.toFixed(2)}</span>
                      <span className="text-sm font-semibold" style={{ color: "#FFD700" }}>{activeCurrency}</span>
                    </div>
                    {/* Multi-currency row: other fiats */}
                    {otherFiat.length > 0 && (
                      <div className="flex gap-4 mb-4">
                        {otherFiat.map(c => {
                          const w = (user?.wallets || []).find((ww: any) => ww.currency === c);
                          const b = w ? parseFloat(w.balance) : 0;
                          const rate = rates[`to${c}` as keyof typeof rates] || 1;
                          const converted = b > 0 ? (b * rate).toFixed(0) : '0';
                          const symbol = c === 'EUR' ? '€' : c === 'USD' ? '$' : '';
                          return (
                            <div key={c} className="flex items-baseline gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <span className="text-sm font-semibold tabular-nums" style={{ color: "#94A3B8" }}>{symbol}{b.toFixed(2)}</span>
                              <span className="text-[9px]" style={{ color: "#475569" }}>≈ {converted} {activeCurrency}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Sparkline */}
              <svg className="w-full h-10 mt-3 mb-4" viewBox="0 0 200 50" preserveAspectRatio="none">
                <polyline id="sparkline-path" points={sparkPoints} fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.3))" }} />
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                </linearGradient>
                <path d={`M${sparkPoints.split(" ").join(" L")} L200,50 L0,50 Z`} fill="url(#spark-fill)" opacity="0.5" />
              </svg>
              <div className="flex items-center gap-1 text-[10px] font-medium transition-all hover:translate-x-0.5 cursor-default" style={{ color: "#64748B" }}>
                MULTI-CURRENCY VAULT <ChevronRight className="w-3 h-3" />
              </div>
              {/* Exchange rate ticker */}
              <div className="mt-3 pt-3 flex gap-4 text-[9px] font-medium" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#475569" }}>
                {(() => {
                  const allRates: Record<string, [string, string, number][]> = {
                    MAD: [['USD', 'MAD', 9.90], ['EUR', 'MAD', 10.75]],
                    USD: [['MAD', 'USD', 0.101], ['EUR', 'USD', 1.086]],
                    EUR: [['MAD', 'EUR', 0.093], ['USD', 'EUR', 0.921]],
                  };
                  const pairs = allRates[activeCurrency] || allRates.MAD;
                  return pairs.map(([from, to, rate], i) => (
                    <span key={i}>1 {from} ≈ <span style={{ color: "#64748B" }}>{rate.toFixed(3)}</span> {to}</span>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* B. Loyalty Points */}
          <div className="metric-card lg:col-span-3 rounded-3xl p-7 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Loyalty Points</span>
                <Sparkles className="w-4 h-4" style={{ color: "#FFD700" }} />
              </div>
              {/* Tier badge */}
              {(() => {
                const pts = stats?.rewardsEarned ?? 0;
                const tiers = [
                  { name: 'Bronze', threshold: 0, color: '#CD7F32' },
                  { name: 'Silver', threshold: 100, color: '#C0C0C0' },
                  { name: 'Gold', threshold: 300, color: '#FFD700' },
                  { name: 'Platinum', threshold: 500, color: '#E5E4E2' },
                ];
                const currentTier = [...tiers].reverse().find(t => pts >= t.threshold) || tiers[0];
                const nextTier = tiers.find(t => t.threshold > pts);
                const progress = nextTier ? ((pts - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100 : 100;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${currentTier.color}22`, color: currentTier.color, border: `1px solid ${currentTier.color}44` }}>{currentTier.name}</span>
                      <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: "#fff" }}>{pts}</span>
                      <span className="text-sm font-semibold" style={{ color: "#FFD700" }}>PTS</span>
                    </div>
                    {nextTier && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[9px] mb-1" style={{ color: "#64748B" }}>
                          <span>{nextTier.name} Tier</span>
                          <span>{nextTier.threshold - pts} pts needed</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, #FFD700, #FFE135)`, boxShadow: "0 0 6px rgba(255,215,0,0.3)" }} />
                        </div>
                      </div>
                    )}
                    {/* Benefits */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { icon: '⚡', label: `${currentTier.name === 'Platinum' ? '0.5%' : currentTier.name === 'Gold' ? '1%' : currentTier.name === 'Silver' ? '1.5%' : '2%'} fees` },
                        { icon: '🎁', label: `${currentTier.name === 'Platinum' ? '2x' : currentTier.name === 'Gold' ? '1.5x' : '1x'} rewards` },
                        { icon: '💎', label: currentTier.name === 'Platinum' ? 'Priority support' : 'Standard support' },
                      ].map((b, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", color: "#94A3B8" }}>{b.icon} {b.label}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium cursor-default group" style={{ color: "#64748B" }}>
              LEVEL UP <span className="inline-block transition-transform group-hover:translate-x-0.5"><ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>

          {/* C. 30D Spending */}
          <div className="metric-card lg:col-span-4 rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>30-Day Spending</span>
              <ArrowUpRight className="w-4 h-4" style={{ color: "#FFD700" }} />
            </div>
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl md:text-4xl font-bold tabular-nums">{(stats?.monthlySpending ?? 0).toFixed(0)}</span>
              <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>{activeCurrency}</span>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-16 mb-4">
              {barData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm relative" style={{ height: `${(v / barMax) * 100}%`, background: i === barData.length - 1 ? "#FFD700" : "#1E293B", minHeight: "4px", transition: "background 0.3s" }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-medium opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap" style={{ color: "#94A3B8" }}>{v} {activeCurrency}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Category breakdown */}
            <div className="space-y-1.5">
              {[
                { label: 'Transfers & P2P', amount: Math.round((stats?.monthlySpending ?? 0) * 0.45), color: '#FFD700' },
                { label: 'Card Payments', amount: Math.round((stats?.monthlySpending ?? 0) * 0.30), color: '#8B5CF6' },
                { label: 'Withdrawals', amount: Math.round((stats?.monthlySpending ?? 0) * 0.15), color: '#22C55E' },
                { label: 'Crypto', amount: Math.round((stats?.monthlySpending ?? 0) * 0.10), color: '#F7931A' },
              ].map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                  <span className="flex-1 text-[10px]" style={{ color: "#64748B" }}>{cat.label}</span>
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: "#94A3B8" }}>{cat.amount.toLocaleString()} {activeCurrency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─═══ QUICK ACTIONS ═══─ */}
        <div ref={actionsRef} className="flex gap-3 overflow-x-auto pb-2 mb-10 scrollbar-none animate-fade-in delay-2">
          {[
            { label: "Send", icon: ArrowUpRight, onClick: () => setIsTransferModalOpen(true), primary: true },
            { label: "Receive", icon: ArrowDownLeft, onClick: () => setIsRequestModalOpen(true), primary: false, accent: "#0066FF" },
            { label: "Convert", icon: ArrowRightLeft, onClick: () => setIsConvertModalOpen(true), primary: false, accent: "#FFD700" },
            { label: "Pay", icon: QrCode, onClick: () => setIsQRScannerOpen(true), primary: false, accent: "#10B981" },
            { label: "Deposit", icon: Landmark, onClick: () => setIsDepositModalOpen(true), primary: false, accent: "#8B5CF6" },
            { label: "Withdraw", icon: ArrowUpRight, onClick: () => setIsWithdrawModalOpen(true), primary: false, accent: "#64748B" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              onMouseEnter={() => setHoveredAction(action.label)}
              onMouseLeave={() => setHoveredAction(null)}
              className="quick-action-btn shrink-0 flex flex-col items-center gap-3 px-7 py-5 rounded-2xl transition-all hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
              style={{
                background: action.primary ? "linear-gradient(135deg, #FFD700, #FFE135)" : "rgba(255,255,255,0.02)",
                border: action.primary ? "none" : `1px solid rgba(255,255,255,0.06)`,
                boxShadow: action.primary ? "0 8px 25px rgba(255,215,0,0.2)" : "none",
              }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${hoveredAction === action.label ? "scale-110" : ""}`} style={{ background: action.primary ? "rgba(10,14,26,0.1)" : `${action.accent}15` }}>
                <action.icon className="w-5 h-5" style={{ color: action.primary ? "#0A0E1A" : action.accent }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: action.primary ? "#0A0E1A" : "#94A3B8" }}>{action.label}</span>
            </button>
          ))}
        </div>

        {/* ─═══ BOTTOM GRID ═══─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in delay-3">

          {/* ─── LEFT COLUMN: Active Card + Crypto Vaults + Security ─── */}
          <div className="lg:col-span-5 space-y-6">

            {/* CRYPTO VAULTS */}
            {(user?.wallets || []).filter((w: any) => w.type === 'crypto').length > 0 && (
              <div className="rounded-3xl p-7 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent)" }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#64748B" }}>
                  Crypto Vaults
                </h3>
                <div className="space-y-3">
                  {(user?.wallets || []).filter((w: any) => w.type === 'crypto').map((cw: any) => (
                    <div key={cw.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: cw.currency === 'BTC' ? 'rgba(247,147,26,0.2)' : cw.currency === 'ETH' ? 'rgba(98,126,234,0.2)' : 'rgba(38,161,123,0.2)', color: cw.currency === 'BTC' ? '#F7931A' : cw.currency === 'ETH' ? '#627EEA' : '#26A17B' }}>
                          {cw.currency === 'BTC' ? '₿' : cw.currency === 'ETH' ? 'Ξ' : '₮'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{cw.currency}</p>
                          <p className="text-[10px]" style={{ color: "#475569" }}>{cw.label || `${cw.currency} Vault`}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{parseFloat(cw.balance || 0).toFixed(8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARDS SECTION */}
            <div ref={cardRef as any}>
              <div className="rounded-3xl p-7 relative overflow-hidden transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>
                      <CreditCard className="w-5 h-5" style={{ color: "#FFD700" }} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Cards</span>
                  </div>
                  <Link href="/cards" className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all hover:bg-white/5 active:scale-95" style={{ color: "#FFD700", border: "1px solid rgba(255,215,0,0.2)" }}>
                    Manage
                  </Link>
                </div>
                {isNoCard ? (
                  <Link href="/cards">
                    <div className="p-5 rounded-2xl text-center cursor-pointer transition-all hover:bg-white/[0.02]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                      <CreditCard className="w-8 h-8 mx-auto mb-2" style={{ color: "#475569" }} />
                      <p className="text-[10px] font-medium" style={{ color: "#64748B" }}>No cards yet — tap to issue</p>
                      <p className="text-[9px] mt-1" style={{ color: "#475569" }}>Virtual MAD cards</p>
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {cards.slice(0, 2).map((card: any, idx: number) => (
                      <Link key={card.id || idx} href="/cards">
                        <div className="p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/[0.02] cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded-lg flex items-center justify-center text-[8px] font-bold" style={{ background: "linear-gradient(135deg, #1E293B, #0F172A)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <CreditCard className="w-4 h-4" style={{ color: "#FFD700" }} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">•••• {card.last4 || card.card_number?.slice(-4) || '0000'}</p>
                              <p className="text-[9px]" style={{ color: "#475569" }}>
                                {card.status === 'active' ? 'Active' : card.status === 'blocked' ? 'Blocked' : 'Inactive'} · MAD
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white tabular-nums">{parseFloat(card.balance || 0).toFixed(2)}</p>
                            <p className="text-[9px]" style={{ color: "#FFD700" }}>MAD</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {cards.length > 2 && (
                      <Link href="/cards" className="block text-center text-[9px] font-medium py-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "#475569" }}>
                        +{cards.length - 2} more cards
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECURITY PANEL */}
            <div ref={securityRef} className="rounded-3xl p-6 relative overflow-hidden transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck className="w-5 h-5" style={{ color: "#22C55E" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Security Status</span>
                <span id="shield-shimmer" className="ml-auto text-[9px] font-bold flex items-center gap-1.5" style={{ color: "#22C55E", opacity: 0.5 }}>SECURE <span className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: "#22C55E" }} /></span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#64748B" }}>🔐 2FA</span>
                  {user?.twoFactorEnabled ? (
                    <span className="font-semibold text-[9px]" style={{ color: "#22C55E" }}>ENABLED</span>
                  ) : (
                    <span className="font-semibold text-[9px]" style={{ color: "#EF4444" }}>DISABLED</span>
                  )}
                </div>
                <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#64748B" }}>🪪 KYC</span>
                  <span className="font-semibold text-[9px]" style={{ color: user?.kyc_status === 'verified' ? '#22C55E' : user?.kyc_status === 'pending' ? '#FFD700' : '#EF4444' }}>
                    {(user?.kyc_status || 'unverified').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#64748B" }}>🔒 Encryption</span>
                  <span className="flex items-center gap-1.5 font-semibold text-[9px]" style={{ color: "#22C55E" }}><span className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: "#22C55E" }} />AES-256</span>
                </div>
                <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#64748B" }}>📱 Biometrics</span>
                  <span className="font-semibold text-[9px]" style={{ color: "#94A3B8" }}>
                    <Smartphone className="w-3 h-3 inline mr-1" style={{ color: "#FFD700" }} /> ENROLLED
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span style={{ color: "#64748B" }}>🕐 Password Age</span>
                  <span className="font-semibold text-[9px]" style={{ color: "#94A3B8" }}>
                    {(() => {
                      const updated = user?.updatedAt || user?.password_changed_at;
                      if (!updated) return 'N/A';
                      const days = Math.floor((Date.now() - new Date(updated).getTime()) / 86400000);
                      return `${days}d`;
                    })()}
                  </span>
                </div>
              </div>
              <div id="security-lock" className="absolute bottom-4 right-5 text-lg" style={{ color: "rgba(255,255,255,0.04)" }}>🔒</div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Recent Activity ─── */}
          <div className="lg:col-span-7">
            <div ref={activityRef} className="rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-7">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide">Recent Activity</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px]" style={{ color: "#475569" }}>Transaction Stream</span>
                    <span className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: "#22C55E" }} />
                    <span className="text-[9px] font-medium" style={{ color: "#22C55E" }}>LIVE</span>
                  </div>
                </div>
                <Link href="/transactions" className="px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all hover:bg-white/5 active:scale-95" style={{ color: "#94A3B8", border: "1px solid rgba(255,255,255,0.06)" }}>
                  History
                </Link>
              </div>

              {/* List */}
              {(() => {
                const filteredTxs = transactions.filter((t: any) => t.currency === activeCurrency);
                return (
                  <div className="space-y-1">
                    {filteredTxs.length === 0 ? (
                      <div className="py-16 text-center">
                        <Wallet className="w-12 h-12 mx-auto mb-4" style={{ color: "#475569" }} />
                        <p className="text-xs" style={{ color: "#64748B" }}>No {activeCurrency} transactions yet</p>
                        <div className="mt-6 inline-block rounded-full px-6 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }}>
                          Start with a deposit
                        </div>
                      </div>
                    ) : (
                      filteredTxs.slice(0, 10).map((t: any, idx: number) => {
                        const isSender = t.senderEmail === user.email;
                        const isCrypto = ['BTC', 'ETH', 'USDT', 'SOL', 'XRP'].includes(t.currency);
                        let txType = 'send';
                        let label = '';
                        let directionIcon = ArrowUpRight;
                        let iconBg = 'rgba(239,68,68,0.12)';
                        let iconColor = '#EF4444';
                        let amountColor = '#E2E8F0';

                        if (t.type?.startsWith('DEPOSIT')) {
                          txType = 'deposit';
                          directionIcon = ArrowDownLeft;
                          iconBg = 'rgba(34,197,94,0.12)';
                          iconColor = '#22C55E';
                          amountColor = '#22C55E';
                          label = t.type === 'DEPOSIT_CARD' ? 'Deposit from Card' : t.type === 'DEPOSIT_CRYPTO' ? `Crypto Deposit` : 'Deposit';
                        } else if (t.type === 'WITHDRAWAL') {
                          txType = 'withdraw';
                          directionIcon = Landmark;
                          iconBg = 'rgba(139,92,246,0.12)';
                          iconColor = '#8B5CF6';
                          label = t.destinationAddress ? `Withdrew ${t.currency}` : 'Withdrawal';
                        } else if (isSender) {
                          txType = 'send';
                          directionIcon = ArrowUpRight;
                          iconBg = 'rgba(239,68,68,0.12)';
                          iconColor = '#EF4444';
                          label = t.receiverName ? `Sent to ${t.receiverName.split(' ')[0]}` : 'Sent';
                        } else {
                          txType = 'receive';
                          directionIcon = ArrowDownLeft;
                          iconBg = 'rgba(34,197,94,0.12)';
                          iconColor = '#22C55E';
                          amountColor = '#22C55E';
                          label = t.senderName ? `Received from ${t.senderName.split(' ')[0]}` : 'Received';
                        }

                        if (isCrypto) {
                          label = t.type?.startsWith('DEPOSIT') ? `Crypto — ${t.currency}` : `${t.currency} Transfer`;
                          iconColor = t.currency === 'BTC' ? '#F7931A' : t.currency === 'ETH' ? '#627EEA' : '#26A17B';
                          iconBg = t.currency === 'BTC' ? 'rgba(247,147,26,0.12)' : t.currency === 'ETH' ? 'rgba(98,126,234,0.12)' : 'rgba(38,161,123,0.12)';
                        }

                        const DirIcon = directionIcon;

                        return (
                          <div
                            key={t.id || idx}
                            onClick={() => { setSelectedTransaction(t); setIsDetailModalOpen(true); }}
                            className="activity-row flex items-center gap-4 p-3.5 rounded-2xl transition-all cursor-pointer hover:translate-y-0" style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                              <DirIcon className="w-5 h-5" style={{ color: iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{label}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>
                                {(() => { const d = new Date(t.created_at || t.createdAt); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); })()}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold tabular-nums" style={{ color: amountColor }}>
                                {(isSender && !t.type?.startsWith('DEPOSIT') || t.type === 'WITHDRAWAL') && !isCrypto ? '-' : isCrypto && !t.type?.startsWith('DEPOSIT') ? '-' : ''}{parseFloat(t.amount).toFixed(isCrypto ? 8 : 2)}
                              </p>
                              <p className="text-[9px] font-medium" style={{ color: isCrypto ? iconColor : "#64748B" }}>{t.currency || "MAD"}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {filteredTxs.length > 10 && (
                      <Link href="/transactions" className="block mt-4 text-center text-[10px] font-medium py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: "#64748B" }}>
                        View all {filteredTxs.length} transactions
                      </Link>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </main>

      {/* ─═══ MODALS ═══─ */}
      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} senderBalance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)} wallets={user.wallets} onSuccess={refreshBalance} />
      <RequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSuccess={refreshBalance} />
      <ConvertModal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} wallets={user.wallets} />
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} balance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)} currency={activeCurrency} onSuccess={refreshBalance} wallets={user.wallets} />
      <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} senderBalance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)} onSuccess={refreshBalance} wallets={user.wallets} />
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} onSuccess={refreshBalance} wallets={user.wallets} />
      <TransactionDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} transaction={selectedTransaction} currentUserEmail={user?.email} />
    </div>
  );
}
