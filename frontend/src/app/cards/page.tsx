"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, ArrowLeft, Loader2, ShieldCheck, Sparkles, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import VirtualCard from "@/components/Wallet/VirtualCard";
import Toast from "@/components/ui/Toast";

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

  const fetchCards = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [cardsRes, userRes] = await Promise.all([
        fetch("http://localhost:5000/api/cards", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (!cardsRes.ok || !userRes.ok) throw new Error("Failed to fetch node data");
      
      const [cardsData, userData] = await Promise.all([
        cardsRes.json(),
        userRes.json()
      ]);

      setCards(cardsData);
      setUser(userData);
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

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20">Loading your cards...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-1000 bg-zellige-soft">
      {error && <Toast message={error} type="error" onClose={() => setError("")} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}

      {/* ───── Fluid Navigation ───── */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-7xl no-print">
        <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-2xl">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeft className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xs tracking-widest text-foreground uppercase">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-6">
            <button 
                onClick={handleIssueCard}
                disabled={issuing || (user?.tier === 'FREE' && cards.length >= 1)}
                className="hidden md:flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:grayscale disabled:opacity-30"
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Virtual Card
            </button>
            <div className="h-8 w-[1px] bg-foreground/10 hidden md:block" />
            <h1 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/30 hidden sm:block">Card Management</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-44 pb-24">
        
        {/* ───── Page Header ───── */}
        <header className="mb-24 relative px-4">
            <div className="flex items-end gap-6 mb-4">
                <ShieldCheck className="w-16 h-16 text-primary animate-pulse" />
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">Cards</h1>
            </div>
            <p className="text-[12px] font-bold text-foreground/40 uppercase tracking-[0.4em]">Manage and use your virtual cards.</p>
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        </header>

        {/* ───── Card Grid ───── */}
        {cards.length === 0 && !loading ? (
          <div className="relative p-24 text-center fluid-card bg-white dark:bg-card overflow-hidden group">
            <div className="absolute inset-0 bg-zellige-soft opacity-10" />
            <div className="relative z-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-700">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-foreground">No cards yet</h2>
                <p className="text-foreground/40 mb-12 max-w-md mx-auto font-medium uppercase tracking-[0.2em] text-[10px] leading-relaxed italic">
                    Create a virtual card to start making secure online payments and manage your spending.
                </p>
                <button 
                  onClick={handleIssueCard}
                  className="px-12 py-6 bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black uppercase tracking-[0.3em] text-xs hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-4 mx-auto"
                >
                  <Zap className="w-5 h-5" /> Create your first card
                </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-16 px-4">
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
            
            {/* New Card Button */}
            {!(user?.tier === 'FREE' && cards.length >= 1) && (
              <div 
                className="rounded-[3rem] aspect-[1.586/1] bg-white/50 dark:bg-card/50 border border-dashed border-foreground/10 flex flex-col items-center justify-center gap-8 group hover:border-primary/50 hover:bg-white dark:hover:bg-card transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-primary/5" 
                onClick={handleIssueCard}
              >
                  <div className="w-20 h-20 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
                  </div>
                  <div className="text-center space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-[0.5em] text-foreground/40 group-hover:text-primary transition-colors">Add New Card</span>
                        <p className="text-[8px] font-bold text-foreground/10 uppercase tracking-widest hidden group-hover:block animate-in fade-in slide-in-from-top-2">Create an additional virtual card</p>
                  </div>
              </div>
            )}
          </div>
        )}

        {/* ───── Security Info Section ───── */}
        <section className="mt-40 px-4">
            <div className="relative p-16 fluid-card bg-white dark:bg-card overflow-hidden group">
                <div className="absolute -right-24 -top-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center shadow-xl shadow-secondary/20 shrink-0">
                        <ShieldAlert className="w-16 h-16 text-primary" />
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-foreground/30">Security & Protection</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter leading-tight">Your virtual cards are protected</h3>
                        <p className="text-foreground/40 text-[11px] font-medium uppercase tracking-[0.2em] max-w-4xl leading-loose">
                            Every card is secured by our advanced payment network. You can freeze your card instantly, regenerate your details, or manage your balance with total peace of mind. Your transactions are monitored in real-time for your safety.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <div className="h-20" />
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
