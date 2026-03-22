"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, LogOut, ArrowUpRight, ArrowDownLeft, ShieldCheck, Smartphone, ChevronRight, Plus, Search, CreditCard, ArrowRight, ArrowLeft, Sparkles, Loader2, User } from "lucide-react";
import WalletCard from "@/components/Wallet/WalletCard";
import TransferModal from "@/components/Wallet/TransferModal";
import DepositModal from "@/components/Wallet/DepositModal";
import RequestModal from "@/components/Wallet/RequestModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import QRScannerModal from "@/components/Wallet/QRScannerModal";
import { Landmark, QrCode, MessageSquare, Bell } from "lucide-react";
import Link from "next/link";
import NotificationTray from "@/components/Notifications/NotificationTray";
import Toast from "@/components/ui/Toast";

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
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeCurrency, setActiveCurrency] = useState("MAD");
  const [stats, setStats] = useState<any>({
    totalBalance: 0,
    pendingBalance: 0,
    monthlySpending: 0,
    rewardsEarned: 0,
    lastTransaction: null
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch real user data
    const fetchDashboardData = async () => {
      try {
        const responses = await Promise.all([
          fetch("http://localhost:5000/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/transactions/recent", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/cards", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/transactions/requests", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/notifications", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/dashboard/stats", {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        
        const [userRes, transRes, cardsRes, reqsRes, notificationRes, statsRes] = responses;
        
        if (!userRes.ok) {
          const errorData = await userRes.json();
          localStorage.removeItem("token");
          router.push(`/login?error=${encodeURIComponent(errorData.error || "Session expired")}`);
          return;
        }

        const [userData, transData, cardsData, reqsData, unparsedNotifs, statsData] = await Promise.all([
          userRes.json(),
          transRes.json(),
          cardsRes.json(),
          reqsRes.json(),
          notificationRes.json(),
          statsRes.json()
        ]);

        setUser(userData);
        
        // --- ROLE REDIRECTION ---
        if (userData.role === 'ROLE_ADMIN') {
            router.push("/admin");
            return;
        }

        setTransactions(transData);
        setCards(cardsData);
        setPendingRequests(reqsData);
        setNotifications(Array.isArray(unparsedNotifs) ? unparsedNotifs : []);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        router.push("/login?error=" + encodeURIComponent("Failed to connect to server"));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshBalance = async () => {
    const token = localStorage.getItem("token");
    try {
      const responses = await Promise.all([
        fetch("http://localhost:5000/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/transactions/recent", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/cards", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/transactions/requests", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/notifications", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/dashboard/stats", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      const [userData, transData, cardsData, reqsData, notifData, statsData] = await Promise.all(responses.map(r => r.json()));
      setUser(userData);
      setTransactions(transData);
      setCards(cardsData);
      setPendingRequests(reqsData);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
        await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { "Authorization": `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
        console.error(e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    const token = localStorage.getItem("token");
    try {
        await fetch(`http://localhost:5000/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { "Authorization": `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
        console.error(e);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
        await fetch(`http://localhost:5000/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` }
        });
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
        console.error(e);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem("token");
    setProcessingId(requestId);
    try {
        const res = await fetch("http://localhost:5000/api/transactions/process-request", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ requestId, action })
        });
        if (res.ok) {
            refreshBalance();
        } else {
            const data = await res.json();
            setToast({ message: data.error || "Failed to process request", type: "error" });
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleIssueInitialCard = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
        const res = await fetch("http://localhost:5000/api/cards/issue", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ cardHolder: user.name })
        });
        if (res.ok) {
            setToast({ message: "Virtual card issued successfully!", type: "success" });
            refreshBalance();
        } else {
            const data = await res.json();
            setToast({ message: data.error || "Failed to issue card", type: "error" });
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleRefillCard = async (cardId: string, amount: number) => {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("http://localhost:5000/api/cards/refill", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ cardId, amount })
        });
        if (res.ok) {
            setToast({ message: "Card refilled successfully!", type: "success" });
            refreshBalance();
        } else {
            const data = await res.json();
            setToast({ message: data.error || "Failed to refill card", type: "error" });
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-1000 bg-zellige-soft">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ───── Fluid Navigation ───── */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-5xl">
        <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 group-hover:rotate-[360deg] transition-all duration-1000 shadow-lg">
                <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground uppercase">MARJANE <span className="text-secondary italic">WALLET</span></span>
          </Link>
          
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

      <main className="max-w-7xl mx-auto px-6 pt-40 pb-24">
        {/* ───── Dashboard Hero ───── */}
        <header className="mb-24 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
          <div className="absolute top-0 -right-24 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[150px] -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary text-[10px] font-black tracking-[0.3em] px-4 py-1 rounded-full uppercase">Personal Account</span>
                  <div className="h-[1px] w-12 bg-primary/20" />
               </div>
               <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] text-foreground">
                 Marjane<br />
                 <span className="text-primary">Wallet</span>
               </h1>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-6">
                <p className="text-lg font-medium text-foreground/40 max-w-[300px] md:text-right leading-relaxed">
                    Spatially managing your wealth with organic flow. Welcome back, <span className="text-foreground font-bold">{user.name.split(' ')[0]}</span>.
                </p>
                <div className="flex bg-foreground/5 p-2 rounded-full border border-foreground/5">
                    <button 
                        onClick={() => setIsDepositModalOpen(true)}
                        className="flex items-center gap-3 bg-secondary text-foreground px-8 py-4 rounded-full font-bold shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6" /> Add Money
                    </button>
                </div>
            </div>
          </div>
        </header>

        {/* ───── Wealth Overview ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-32">
          
          {/* Main Balance Sphere */}
          <div className="lg:col-span-12 relative h-[500px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-20 animate-fluid-float" />
            
            <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                <div className="flex items-center gap-4 overflow-x-auto pt-4 pb-8 scrollbar-hide w-full justify-center px-4">
                    {(user.wallets || []).map((w: any) => (
                        <button
                            key={w.currency}
                            onClick={() => setActiveCurrency(w.currency)}
                            className={cn(
                                "px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all",
                                activeCurrency === w.currency 
                                    ? "bg-primary text-white shadow-2xl shadow-primary/40 -translate-y-2" 
                                    : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10"
                            )}
                        >
                            {w.currency}
                        </button>
                    ))}
                </div>

                <div className="group relative mt-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 animate-pulse">Total Balance</p>
                    <h2 className="text-[10rem] md:text-[15rem] font-black text-foreground tracking-tighter leading-none select-none">
                        {((user.wallets || []).find((w: any) => w.currency === activeCurrency)?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </h2>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <span className="text-4xl font-black text-secondary italic uppercase tracking-tighter">{activeCurrency}</span>
                        <div className="h-[2px] w-20 bg-foreground/10" />
                        <span className="text-4xl font-black text-foreground/20 leading-none">.{( ((user.wallets || []).find((w: any) => w.currency === activeCurrency)?.balance || 0) % 1).toFixed(2).split('.')[1]}</span>
                    </div>
                </div>

                {/* Spending Bubble */}
                <div className="absolute top-1/2 right-0 md:right-12 -translate-y-1/2 w-64 h-64 bg-background dark:bg-card border border-foreground/5 rounded-full fluid-card p-10 flex flex-col items-center justify-center text-center animate-fluid-float delay-700">
                    <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Monthly Spending</p>
                    <p className="text-3xl font-black text-foreground">{(stats?.monthlySpending ?? 0).toFixed(0)}</p>
                    <p className="text-[10px] font-medium text-foreground/40 mt-1">{activeCurrency}</p>
                </div>

                {/* Rewards Bubble */}
                <div className="absolute bottom-12 left-0 md:left-12 w-56 h-56 bg-secondary border border-foreground/5 rounded-full shadow-2xl shadow-secondary/30 p-10 flex flex-col items-center justify-center text-center animate-fluid-float delay-1000">
                    <Sparkles className="w-8 h-8 text-primary mb-3" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Rewards</p>
                    <p className="text-3xl font-black text-foreground">{stats?.rewardsEarned ?? 0}</p>
                </div>
            </div>
          </div>

          <div className="lg:col-span-12 flex flex-wrap items-center justify-center gap-6 md:gap-12 mt-12">
            {[
              { label: "Send", icon: ArrowUpRight, onClick: () => setIsTransferModalOpen(true) },
              { label: "Receive", icon: MessageSquare, onClick: () => setIsRequestModalOpen(true) },
              { label: "Pay", icon: QrCode, onClick: () => setIsQRScannerOpen(true) },
              { label: "Deposit", icon: ArrowDownLeft, onClick: () => setIsDepositModalOpen(true) },
              { label: "Withdraw", icon: Landmark, onClick: () => setIsWithdrawModalOpen(true) }
            ].map((action, i) => (
              <button 
                key={action.label}
                onClick={action.onClick}
                className={cn(
                    "flex flex-col items-center gap-4 group transition-all duration-700",
                    i % 2 === 0 ? "translate-y-4" : "-translate-y-4"
                )}
              >
                <div className="w-24 h-24 rounded-full bg-white dark:bg-card border border-foreground/5 flex items-center justify-center shadow-xl group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110 active:scale-95 group-hover:shadow-primary/30">
                  <action.icon className="w-10 h-10 transition-transform group-hover:rotate-[20deg]" />
                </div>
                <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-foreground/40 group-hover:text-primary transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-24">
             <WalletCard 
              balance={cards.length > 0 ? (cards[0].balance || 0) : 0} 
              currency={activeCurrency} 
              name={user.name} 
              cardNumber={cards.length > 0 ? cards[0].cardNumber : undefined}
              isNoCard={!cards || cards.length === 0 || !cards[0]?.cardNumber || (cards[0]?.cardNumber && cards[0].cardNumber.includes("4242"))}
              onIssue={handleIssueInitialCard}
            />

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <Bell className="w-5 h-5 text-primary animate-bounce" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Pending Requests ({pendingRequests.length})</h4>
                    </div>
                    {pendingRequests.map((req) => (
                        <div key={req.id} className="fluid-card p-8 bg-secondary/20 border border-secondary/20 flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-black text-primary">
                                    {req.requesterName?.[0]}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">{req.requesterName}</p>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{parseFloat(req.amount).toFixed(2)} {activeCurrency}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                                className="px-6 py-3 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* ───── Additional Insights ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mt-24">
          
          {/* Security & Wallet Management */}
          <div className="lg:col-span-4 space-y-12">
            <div className="fluid-card p-10 bg-primary text-primary-foreground relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                    <div className="bg-secondary text-primary text-[8px] font-black uppercase tracking-[0.4em] py-2 px-4 rounded-full inline-block mb-8">
                        Security Active
                    </div>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                            <Smartphone className="w-8 h-8 text-secondary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40 mb-1">Device ID</p>
                            <p className="text-xl font-black uppercase">{user.device || "Mobile Auth 01"}</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-medium text-primary-foreground/30 uppercase tracking-widest">
                        Last Login: {user.lastLogin}
                    </p>
                </div>
            </div>

            <div 
              onClick={() => router.push("/cards")}
              className="fluid-card p-10 bg-white dark:bg-card border border-foreground/5 cursor-pointer group hover:-translate-y-2 transition-all"
            >
              <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Manage Wallet</p>
              <h4 className="text-2xl font-black uppercase tracking-tight">Your Cards</h4>
            </div>

            <div className="fluid-card p-10 bg-secondary text-primary relative overflow-hidden">
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Marjane Rewards</p>
                <h2 className="text-5xl font-black tracking-tighter mb-4">{user.loyaltyPoints || 0} Points</h2>
                <div className="h-[1px] w-full bg-primary/10 mb-6" />
                <p className="text-[10px] font-bold leading-relaxed uppercase tracking-widest opacity-60">
                    Every transaction earns you points. Keep using Marjane Wallet to grow your rewards.
                </p>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between mb-16 px-4">
                <div>
                    <h3 className="text-5xl font-black tracking-tighter uppercase">Activity</h3>
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.3em] mt-2">Recent Transactions</p>
                </div>
                <button 
                  onClick={() => router.push("/transactions")}
                  className="fluid-button bg-foreground text-background hover:bg-primary hover:text-white"
                >
                  View All
                </button>
            </div>

            <div className="space-y-12 relative">
                <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block" />

                {transactions.length === 0 ? (
                  <div className="p-24 text-center fluid-card bg-foreground/5">
                    <p className="text-foreground/20 font-black uppercase tracking-[0.4em] text-xs">No activity yet</p>
                  </div>
                ) : (
                  transactions.slice(0, 5).map((t, idx) => {
                    const isSender = t.senderEmail === user.email;
                    return (
                      <div key={t.id} className="group relative flex items-start gap-12 md:pl-4 transition-all hover:translate-x-2">
                        <div className={cn(
                            "w-24 h-24 shrink-0 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-all group-hover:scale-110",
                            t.type?.startsWith('DEPOSIT') ? "bg-green-500 text-white shadow-green-500/20" :
                            t.type === 'WITHDRAWAL' ? "bg-amber-500 text-white shadow-amber-500/20" :
                            isSender ? "bg-primary text-white shadow-primary/20" : "bg-secondary text-primary shadow-secondary/20"
                        )}>
                            {t.type?.startsWith('DEPOSIT') ? <Wallet className="w-10 h-10" /> :
                             t.type === 'WITHDRAWAL' ? <Landmark className="w-10 h-10" /> :
                             isSender ? <ArrowUpRight className="w-10 h-10" /> : <ArrowDownLeft className="w-10 h-10" />}
                        </div>

                        <div className="flex-1 pt-4 space-y-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                                        {(() => {
                                            const d = new Date(t.created_at || t.createdAt);
                                            return isNaN(d.getTime()) ? 'Date Unknown' : d.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' });
                                        })()} • {t.status}
                                    </p>
                                    <h5 className="text-2xl font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">
                                        {t.type === 'PAYMENT' ? 'Payment' :
                                         isSender ? `Sent to ${t.receiverName || 'External'}` : `Received from ${t.senderName || 'Internal'}`}
                                    </h5>
                                </div>
                                <div className="text-right">
                                    <p className={cn("text-3xl font-black tracking-tighter", (isSender || t.type === 'WITHDRAWAL') ? "text-foreground" : "text-primary")}>
                                        {(isSender || t.type === 'WITHDRAWAL') ? "-" : "+"}{parseFloat(t.amount).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground/20 italic">{t.currency}</p>
                                </div>
                            </div>
                            {t.note && (
                                <div className="p-4 bg-foreground/5 rounded-2xl inline-block max-w-md">
                                    <p className="text-[10px] font-medium text-foreground/60 italic leading-relaxed tracking-widest">"{t.note}"</p>
                                </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
            </div>
          </div>
        </div>

        <TransferModal 
          isOpen={isTransferModalOpen} 
          onClose={() => setIsTransferModalOpen(false)} 
          senderBalance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)}
          onSuccess={refreshBalance}
        />

        <RequestModal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          onSuccess={refreshBalance}
        />

        <WithdrawModal 
          isOpen={isWithdrawModalOpen} 
          onClose={() => setIsWithdrawModalOpen(false)} 
          balance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)}
          currency={activeCurrency}
          onSuccess={refreshBalance}
        />

        <QRScannerModal 
          isOpen={isQRScannerOpen} 
          onClose={() => setIsQRScannerOpen(false)} 
          senderBalance={parseFloat(user.wallets?.find((w: any) => w.currency === activeCurrency)?.balance || 0)}
          onSuccess={refreshBalance}
        />

        <DepositModal 
          isOpen={isDepositModalOpen} 
          onClose={() => setIsDepositModalOpen(false)} 
          onSuccess={refreshBalance}
        />
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
