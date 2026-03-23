"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, ArrowLeft, Loader2, ShieldCheck, Bell, User, LogOut } from "lucide-react";
import VirtualCard from "@/components/Wallet/VirtualCard";
import Toast from "@/components/ui/Toast";
import Link from "next/link";
import NotificationTray from "@/components/Notifications/NotificationTray";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function CardsContent() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchCards = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [cardsRes, userRes, notificationRes] = await Promise.all([
        fetch("http://localhost:5000/api/cards", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/notifications", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (!cardsRes.ok || !userRes.ok) throw new Error("Failed to fetch node data");
      
      const [cardsData, userData, notifData] = await Promise.all([
        cardsRes.json(),
        userRes.json(),
        notificationRes.json()
      ]);

      setCards(cardsData);
      setUser(userData);
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleIssueCard = async () => {
    const token = localStorage.getItem("token");
    setIssuing(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/cards/issue", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ cardName: "Marjane Digital Node" })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize node");
      
      setCards([data.card, ...cards]);
      setSuccess("New virtual asset node protocol initialized.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleToggleStatus = async (cardId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    setActionLoading(cardId);
    try {
      const res = await fetch("http://localhost:5000/api/cards/status", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ cardId, status: newStatus })
      });
      
      if (!res.ok) throw new Error("Status sync failed");
      
      setCards(cards.map(c => c.id === cardId ? { ...c, status: newStatus } : c));
      setSuccess(`Asset state adjusted: ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDeleteCard = async (cardId: string) => {
    const token = localStorage.getItem("token");
    setActionLoading(cardId);
    try {
      const res = await fetch(`http://localhost:5000/api/cards/${cardId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to purge asset");
      
      setCards(cards.filter(c => c.id !== cardId));
      setSuccess("Asset node purged successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateCard = async (cardId: string) => {
    const token = localStorage.getItem("token");
    setActionLoading(cardId);
    try {
        const res = await fetch(`http://localhost:5000/api/cards/${cardId}/regenerate`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sequence rotation failed");
        
        setCards(cards.map(c => c.id === cardId ? { ...c, cardNumber: data.cardNumber, cvv: data.cvv } : c));
        setSuccess("Node sequence rotated.");
    } catch (err: any) {
        setError(err.message);
    } finally {
        setActionLoading(null);
    }
  };

  const handleRefillCard = async (cardId: string, amount: number) => {
    const token = localStorage.getItem("token");
    setActionLoading(cardId);
    try {
        const res = await fetch("http://localhost:5000/api/cards/refill", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ cardId, amount })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Liquidity injection failed");
        
        setCards(cards.map(c => c.id === cardId ? { ...c, balance: data.newBalance } : c));
        setSuccess(`Successfully injected ${amount} MAD into asset node.`);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setActionLoading(null);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20">Loading your cards...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-marjane-gold selection:text-marjane-blue">
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}

      {/* ───── Fluid Navigation ───── */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-5xl no-print">
        <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 group-hover:rotate-[360deg] transition-all duration-1000 shadow-xl">
                    <img src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:block">
                    <span className="font-display font-bold text-lg tracking-tight text-white uppercase flex flex-col leading-none">
                        MARJANE <span className="text-marjane-gold italic text-xs tracking-[0.2em]">PROTOCOL</span>
                    </span>
                </div>
            </Link>

            <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

            <button 
                onClick={handleIssueCard}
                disabled={issuing || (user?.tier === 'FREE' && cards.length >= 1)}
                className="hidden md:flex items-center gap-2 px-6 py-2 bg-marjane-gold text-marjane-blue rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
            >
              {issuing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Initialize Node
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
                        "relative p-4 rounded-full hover:bg-white/5 transition-all active:scale-90",
                        btn.variant === 'destructive' ? "text-red-500" : "text-white"
                    )}
                >
                    <btn.icon className="w-6 h-6" />
                    {typeof btn.badge === 'number' && btn.badge > 0 && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-marjane-gold text-marjane-blue text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
                            {btn.badge}
                        </span>
                    )}
                </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 pt-20 pb-32">
        
        {/* ───── Page Header ───── */}
        <header className="mb-24 relative">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-marjane-gold/5 rounded-full blur-[120px] -z-10" />
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-marjane-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-marjane-gold/60">Digital Asset Protocol</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase leading-none">
                    Cards<span className="text-marjane-gold">.</span>
                </h1>
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.4em] max-w-lg leading-relaxed">
                    Orchestrate your virtual liquidity nodes with institutional-grade security and real-time synchronization.
                </p>
            </div>
        </header>

        {/* ───── Card Collection ───── */}
        {cards.length === 0 && !loading ? (
          <div className="relative p-24 text-center bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-marjane-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5 group-hover:bg-marjane-gold group-hover:text-marjane-blue transition-all duration-500">
                      <CreditCard className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">No nodes active</h2>
                    <p className="text-white/30 mb-12 max-w-md mx-auto font-bold uppercase tracking-[0.3em] text-[10px] leading-relaxed italic">
                        Initialize your first virtual asset node to begin secure cross-border transaction protocols.
                    </p>
                    <button 
                      onClick={handleIssueCard}
                      className="px-12 py-6 bg-marjane-gold text-marjane-blue rounded-full font-black uppercase tracking-[0.4em] text-xs hover:scale-110 transition-all shadow-[0_0_50px_rgba(251,230,10,0.2)] active:scale-95 flex items-center gap-4 mx-auto"
                    >
                      <Plus className="w-5 h-5" /> Initialize Protocol
                    </button>
                </div>
          </div>
        ) : (
          <div className="space-y-20 flex flex-col items-center">
            {cards.map(card => (
              <VirtualCard 
                key={card.id}
                {...card}
                cardHolder={card.cardHolder}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteCard}
                onRegenerate={handleRegenerateCard}
                onRefill={handleRefillCard}
                isLoading={actionLoading === card.id}
              />
            ))}
            
            {/* New Node Placeholder */}
            {!(user?.tier === 'FREE' && cards.length >= 1) && (
              <button 
                className="w-full max-w-[480px] h-32 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-marjane-gold/50 hover:bg-marjane-gold/5 transition-all text-white/20 hover:text-marjane-gold group active:scale-[0.98] relative overflow-hidden" 
                onClick={handleIssueCard}
              >
                <div className="absolute inset-0 bg-marjane-gold/0 group-hover:bg-marjane-gold/5 transition-colors" />
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-marjane-gold group-hover:text-marjane-blue group-hover:border-marjane-gold transition-all duration-500">
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-[0.5em] group-hover:tracking-[0.6em] transition-all">Add New asset Node</span>
              </button>
            )}
          </div>
        )}

        {/* ───── Security Info Section ───── */}
        <section className="mt-40">
            <div className="p-12 bg-white/5 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-marjane-gold/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className="w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 shrink-0">
                        <ShieldCheck className="w-10 h-10 text-marjane-gold" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-[1px] bg-white/20" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Security Protocol</span>
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Vault Encryption Standard</h3>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em] max-w-3xl leading-relaxed">
                            Every digital asset node is shielded by military-grade asymmetric encryption. 
                            Rotation protocols can be initiated manually via key regeneration, while status 
                            suspension provides immediate isolation from active networks.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <div className="h-12" />
      </main>
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20">Loading...</p>
      </div>
    }>
      <CardsContent />
    </Suspense>
  );
}
