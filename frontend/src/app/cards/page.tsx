"use client";

import { api } from "@/lib/api";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Toast from "@/components/ui/Toast";
import CardRefillModal from "@/components/Wallet/CardRefillModal";

gsap.registerPlugin(ScrollTrigger);

const MOCK_CARDS = [
  {
    id: "1",
    cardNumber: "4562890137423561",
    cvv: "227",
    expiryDate: "03/29",
    balance: "700",
    status: "ACTIVE",
    cardHolder: "You",
    cardName: "Marjane Digital",
  },
  {
    id: "2",
    cardNumber: "5123409876543210",
    cvv: "491",
    expiryDate: "08/30",
    balance: "1240",
    status: "ACTIVE",
    cardHolder: "You",
    cardName: "Marjane Travel",
  },
];

const MOCK_TRANSACTIONS = [
  { id: "t1", merchant: "Marjane Casablanca", amount: "-320.00", time: "2 hours ago", type: "spend" },
  { id: "t2", merchant: "Spotify Premium", amount: "-89.00", time: "Yesterday", type: "spend" },
  { id: "t3", merchant: "Refund - Marjane", amount: "+45.50", time: "2 days ago", type: "refund" },
];

const MOCK_USER = {
  name: "You",
  email: "you@example.com",
  tier: "BRONZE",
};

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SnowflakeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
      <rect x="1" y="1" width="36" height="26" rx="4" stroke="rgba(255,215,0,0.5)" strokeWidth="1.5" />
      <rect x="6" y="6" width="26" height="16" rx="2" stroke="rgba(255,215,0,0.3)" strokeWidth="1" />
      <path d="M19 6v16M6 14h26" stroke="rgba(255,215,0,0.3)" strokeWidth="1" />
    </svg>
  );
}

function MarqueeIcon({ letter }: { letter: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8" }}>
      {letter}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" id="check-path">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#080C17" }}>
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#FFD700]" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  );
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
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [frostOverlay, setFrostOverlay] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCardRefillOpen, setIsCardRefillOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const secActionsRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);
  const numGroupsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const cvvRef = useRef<HTMLSpanElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const cardMeshRef = useRef<HTMLDivElement>(null);
  const edgeGlowRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    try {
      const [cardsRes, userRes] = await Promise.all([
        api.get("/cards"),
        api.get("/auth/me"),
      ]);
      if (!cardsRes.ok || !userRes.ok) throw new Error("Failed to fetch");
      const [cardsData, userData] = await Promise.all([cardsRes.json(), userRes.json()]);
      setCards(cardsData.length ? cardsData : MOCK_CARDS);
      setUser(userData);
      const madWallet = userData.wallets?.find((w: any) => w.currency === "MAD");
      setWalletBalance(madWallet ? parseFloat(madWallet.balance) : 0);
    } catch {
      setCards(MOCK_CARDS);
      setUser(MOCK_USER);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCard = cards[activeCardIndex] || cards[0] || MOCK_CARDS[0];
  const maskedFirst12 = activeCard.cardNumber?.slice(0, 12).replace(/\d/g, "•");
  const last4 = activeCard.cardNumber?.slice(-4) || "0000";
  const maskedFirst12Groups: string[] = maskedFirst12?.match(/.{1,4}/g) || [];
  const isFrozen = activeCard?.status === "FROZEN" || frostOverlay;

  // GSAP entrance timeline
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (headerRef.current) tl.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0);
      const titleEls = titleRef.current?.children;
      if (titleEls) {
        tl.fromTo(titleEls[0], { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.15);
        tl.fromTo(titleEls[1], { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.2);
        tl.fromTo(titleEls[2], { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.45);
      }
      if (cardWrapRef.current) {
        tl.fromTo(cardWrapRef.current, { scale: 0.92, rotateY: 20, opacity: 0 }, { scale: 1, rotateY: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.35);
      }
      if (balanceRef.current) {
        const target = parseFloat(activeCard?.balance || 0);
        tl.fromTo(balanceRef.current, { textContent: "0" }, {
          textContent: String(target), duration: 1.2, ease: "expo.out",
          onUpdate: function () { if (balanceRef.current) balanceRef.current.textContent = String(Math.round(Number(this.targets()[0].textContent))); },
        }, 0.4);
      }
      if (actionsRef.current) tl.fromTo(actionsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.5);
      if (secActionsRef.current) {
        const btns = secActionsRef.current.children;
        tl.fromTo(btns, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, 0.55);
      }
      if (activityRef.current) tl.fromTo(activityRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.7);
      if (slotRef.current) tl.fromTo(slotRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.8);
      if (securityRef.current) {
        ScrollTrigger.create({
          trigger: securityRef.current,
          start: "top 90%",
          onEnter: () => {
            gsap.fromTo(securityRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" });
            const check = securityRef.current?.querySelector("#check-path");
            if (check) {
              const len = (check as SVGPathElement).getTotalLength();
              gsap.set(check, { strokeDasharray: len, strokeDashoffset: len });
              gsap.to(check, { strokeDashoffset: 0, duration: 0.8, delay: 0.3 });
            }
          },
          once: true,
        });
      }
    });
    return () => ctx.revert();
  }, [loading, activeCardIndex]);

  // Cursor spotlight
  useEffect(() => {
    if (typeof window === "undefined") return;
    const spot = document.createElement("div");
    spot.id = "cursor-spot";
    Object.assign(spot.style, {
      position: "fixed", pointerEvents: "none", zIndex: "9999",
      width: "600px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)",
      transform: "translate(-300px, -300px)", transition: "transform 0.15s ease-out",
    });
    document.body.appendChild(spot);
    const onMove = (e: MouseEvent) => { spot.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`; };
    document.addEventListener("mousemove", onMove);
    return () => { document.removeEventListener("mousemove", onMove); spot.remove(); };
  }, []);

  // Gold dust particles
  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    const container = pageRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("div");
      p.className = "gold-dust";
      Object.assign(p.style, {
        position: "fixed", width: "2px", height: "2px",
        background: "rgba(255,215,0,0.15)", borderRadius: "50%",
        left: `${10 + Math.random() * 80}%`, top: `${80 + Math.random() * 20}%`,
        pointerEvents: "none", zIndex: "0",
      });
      document.body.appendChild(p);
      particles.push(p);
      gsap.to(p, {
        y: -(300 + Math.random() * 400),
        x: (Math.random() - 0.5) * 60,
        opacity: 0, duration: 8 + Math.random() * 8,
        repeat: -1, delay: Math.random() * 8, ease: "none",
      });
    }
    return () => particles.forEach(p => p.remove());
  }, [loading]);

  // 3D Card Tilt
  useEffect(() => {
    if (loading) return;
    const card = cardRef.current;
    if (!card) return;
    let cmx = 0.5, cmy = 0.5, tx = 0.5, ty = 0.5;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      cmx = (e.clientX - r.left) / r.width;
      cmy = (e.clientY - r.top) / r.height;
    };
    const onLeave = () => { cmx = 0.5; cmy = 0.5; };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);

    let raf: number;
    const tick = () => {
      tx += (cmx - tx) * 0.08;
      ty += (cmy - ty) * 0.08;
      if (card && !prefersReduced) {
        const rx = (ty - 0.5) * -24;
        const ry = (tx - 0.5) * 24;
        card.style.setProperty("--mx", String(tx));
        card.style.setProperty("--my", String(ty));
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        const shadX = (tx - 0.5) * -20;
        const shadY = (ty - 0.5) * -20;
        card.style.boxShadow = `${shadX}px ${shadY}px 60px rgba(0,0,0,0.5)`;
      }
      if (sheenRef.current && !prefersReduced) {
        sheenRef.current.style.setProperty("--sx", `${tx * 100}%`);
        sheenRef.current.style.setProperty("--sy", `${ty * 100}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [loading]);

  // Mesh morph
  useEffect(() => {
    if (loading) return;
    const mesh = cardMeshRef.current;
    if (!mesh) return;
    let frame = 0;
    let raf: number;
    const morph = () => {
      frame++;
      const x = 0.3 + Math.sin(frame * 0.02) * 0.2;
      const y = 0.3 + Math.cos(frame * 0.015) * 0.2;
      mesh.style.background = `radial-gradient(ellipse at ${50 + Math.sin(frame * 0.01) * 20}% ${50 + Math.cos(frame * 0.008) * 20}%, rgba(255,215,0,0.12), transparent 60%), radial-gradient(ellipse at ${50 + Math.cos(frame * 0.012) * 25}% ${50 + Math.sin(frame * 0.01) * 25}%, rgba(0,102,255,0.10), transparent 60%)`;
      raf = requestAnimationFrame(morph);
    };
    raf = requestAnimationFrame(morph);
    return () => cancelAnimationFrame(raf);
  }, [loading]);

  const handleIssue = async () => {
    setIssuing(true); setError("");
    try {
      const res = await api.post("/cards/issue", { cardName: "Marjane Digital" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setCards(prev => [data.card, ...prev]);
      setActiveCardIndex(0);
      setSuccess("New virtual card issued.");
    } catch (err: any) {
      setError(err.message);
    } finally { setIssuing(false); }
  };

  const handleToggleStatus = async (cardId: string, newStatus: string) => {
    setActionLoading(cardId);
    try {
      const res = await api.patch("/cards/status", { cardId, status: newStatus });
      if (!res.ok) throw new Error("Failed");
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: newStatus } : c));
      if (newStatus === "FROZEN") { setFrostOverlay(true); }
      else { setFrostOverlay(false); }
      setSuccess(`Card ${newStatus.toLowerCase()}.`);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  const handleRegenerate = async (cardId: string) => {
    setActionLoading(cardId);
    try {
      const res = await api.post(`/cards/${cardId}/regenerate`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, cardNumber: data.cardNumber, cvv: data.cvv } : c));
      setToastMsg("Card number regenerated");
      setTimeout(() => setToastMsg(null), 2000);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!deleteCardId) return;
    setActionLoading(deleteCardId);
    try {
      const res = await api.delete(`/cards/${deleteCardId}`);
      if (!res.ok) throw new Error("Failed");
      setCards(prev => prev.filter(c => c.id !== deleteCardId));
      setActiveCardIndex(0);
      setShowDeleteModal(false);
      setDeleteCardId(null);
      setSuccess("Card deleted.");
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  const handleAddFunds = () => {
    if (!activeCard) return;
    setIsCardRefillOpen(true);
  };

  const handleCardRefillSuccess = (newBalance: string) => {
    setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, balance: newBalance } : c));
    setToastMsg("Card refilled successfully");
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(activeCard?.cardNumber || "");
      setToastMsg("Copied!");
      setTimeout(() => setToastMsg(null), 2000);
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  if (loading) return <CardSkeleton />;

  return (
    <div ref={pageRef} className="min-h-screen font-sans antialiased relative overflow-x-hidden" style={{ background: "#080C17", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulse-dot { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes sheen-sweep { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(100%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer-slide { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scramble { 0% { content: "0"; } 10% { content: "3"; } 20% { content: "8"; } 30% { content: "2"; } 40% { content: "7"; } 50% { content: "1"; } 60% { content: "9"; } 70% { content: "4"; } 80% { content: "6"; } 90% { content: "5"; } 100% { content: "3"; } }
        .gold-dust { will-change: transform, opacity; }
        .sheen-hover { background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 55%, transparent 60%); background-size: 200% 100%; animation: sheen-sweep 5s ease-in-out infinite; }
        .card-edge-glow { opacity: 0; transition: opacity 0.4s ease; }
        .card-wrap:hover .card-edge-glow { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .card-wrap { animation: none !important; }
          .sheen-hover { animation: none !important; display: none !important; }
          .gold-dust { display: none !important; }
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        *:focus-visible { outline: 2px solid #FFD700; outline-offset: 2px; border-radius: 4px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {error && <Toast message={error} type="error" onClose={() => setError("")} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess("")} />}

      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-full text-[13px] font-semibold" style={{ background: "#FFD700", color: "#080C17", boxShadow: "0 0 30px rgba(255,215,0,0.25)", animation: "fade-up 0.3s ease-out" }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <nav ref={headerRef as any} className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b border-white/[0.04]" style={{ background: "rgba(8,12,23,0.8)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" style={{ background: "rgba(255,255,255,0.04)" }}>
              <img loading="lazy" src="/Marjane-logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              MARJANE <span className="font-light italic" style={{ color: "#FFD700" }}>WALLET</span>
            </span>
          </Link>

          <button
            onClick={handleIssue}
            disabled={issuing || (user?.tier === "BRONZE" && cards.length >= 1)}
            className="flex items-center gap-2.5 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 group"
            style={{
              background: issuing || (user?.tier === "BRONZE" && cards.length >= 1) ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: issuing || (user?.tier === "BRONZE" && cards.length >= 1) ? "#475569" : "#E2E8F0",
              cursor: issuing || (user?.tier === "BRONZE" && cards.length >= 1) ? "not-allowed" : "pointer",
            }}
            onMouseEnter={e => { if (!issuing && !(user?.tier === "BRONZE" && cards.length >= 1)) { e.currentTarget.style.background = "rgba(255,215,0,0.1)"; e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <PlusIcon className="transition-transform duration-300 group-hover:rotate-90" />
            {issuing ? "Issuing..." : "New Card"}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-full transition-all hover:bg-white/5 active:scale-90"
              style={{ color: "#64748B" }}
            >
              <BellIcon />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: "#FFD700", color: "#080C17" }}>3</span>
            </button>
            <button onClick={() => router.push("/profile")} className="p-2.5 rounded-full transition-all hover:bg-white/5 active:scale-90" style={{ color: "#64748B" }}>
              <UserIcon />
            </button>
            <button onClick={handleLogout} className="p-2.5 rounded-full transition-all hover:bg-white/5 active:scale-90" style={{ color: "#64748B" }}>
              <LogOutIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-24">
        {/* ─── PAGE TITLE ─── */}
        <div ref={titleRef} className="mb-12 mt-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-6 h-[2px]" style={{ background: "#FFD700" }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#475569" }}>Virtual Cards</span>
          </div>
          <h1 className="text-[56px] font-[800] tracking-tight leading-none mb-4">
            YOUR <span style={{ color: "#FFD700" }}>CARDS</span>
          </h1>
          <p className="text-base max-w-md" style={{ color: "#64748B", lineHeight: 1.6 }}>
            Freeze, refill, regenerate, or issue new virtual cards. Full control in one place.
          </p>
        </div>

        {/* ─── HERO CARD ─── */}
        <div ref={cardWrapRef} className="card-wrap flex flex-col items-center" style={{ marginTop: "40px" }}>
          <div
            ref={cardRef}
            className="relative cursor-default"
            style={{
              width: "420px", height: "260px", borderRadius: "20px",
              transformStyle: "preserve-3d", willChange: "transform",
              animation: "float 4s ease-in-out infinite",
              transition: "box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Edge glow */}
            <div ref={edgeGlowRef} className="card-edge-glow absolute inset-0 rounded-[20px] pointer-events-none z-[5]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,215,0,0.35)" }} />

            {/* Base surface */}
            <div className="absolute inset-0 rounded-[20px] overflow-hidden" style={{ background: "#1a1f2e", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", transformStyle: "preserve-3d" }}>
              {/* Mesh gradient */}
              <div ref={cardMeshRef} className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ transition: "background 0.3s ease" }} />

              {/* Holographic sheen */}
              <div ref={sheenRef} className="sheen-hover absolute inset-0 rounded-[20px] pointer-events-none" style={{ opacity: 0.6, mixBlendMode: "overlay" }} />
              <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: "radial-gradient(circle at var(--sx, 50%) var(--sy, 50%), rgba(255,255,255,0.08), transparent 60%)", opacity: 0, transition: "opacity 0.3s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0"; }}
              />

              {/* Frost overlay */}
              {frostOverlay && (
                <div className="absolute inset-0 rounded-[20px] pointer-events-none z-[6]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)", backdropFilter: "blur(2px)" }} />
              )}

              {/* Content */}
              <div className="relative z-[2] flex flex-col justify-between h-full p-7" style={{ transform: "translateZ(24px)" }}>
                {/* Top row */}
                <div className="flex justify-between items-start" style={{ transform: "translateZ(32px)" }}>
                  <div className="flex flex-col gap-2">
                    <ChipIcon />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: isFrozen ? "#3B82F6" : "#22C55E", animation: isFrozen ? "none" : "pulse-dot 2s ease-in-out infinite" }} />
                      <span className="text-[11px] font-semibold" style={{ color: isFrozen ? "#3B82F6" : "#22C55E" }}>{isFrozen ? "FROZEN" : "ACTIVE"}</span>
                    </div>
                  </div>
                  <div className="w-[28px] h-[28px] rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <img loading="lazy" src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Balance */}
                <div className="flex flex-col" style={{ transform: "translateZ(24px)" }}>
                  <span className="text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Available Balance</span>
                  <div className="flex items-baseline gap-1.5">
                    <span ref={balanceRef} className="text-[42px] font-[700] tabular-nums leading-none">{activeCard?.balance || "0"}</span>
                    <span className="text-[14px] font-semibold" style={{ color: "#FFD700" }}>MAD</span>
                  </div>
                </div>

                {/* Card number row */}
                <div className="flex items-center gap-3" style={{ transform: "translateZ(20px)" }}>
                  <div className="flex items-center gap-2">
                    {cardRevealed ? (
                      <span className="text-[20px] font-[500] tabular-nums tracking-[3px]" style={{ color: "rgba(255,255,255,0.9)" }}>{activeCard?.cardNumber?.replace(/(.{4})/g, "$1 ") || "•••• •••• •••• 0000"}</span>
                    ) : (
                      <span className="text-[20px] font-[500] tabular-nums tracking-[2px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {maskedFirst12Groups.map((g, i) => (
                          <span key={i} ref={el => { numGroupsRef.current[i] = el; }} className="tracking-[3px]">{g} </span>
                        ))}
                        <span className="tracking-[3px]" style={{ color: "rgba(255,255,255,0.85)" }}>{last4}</span>
                      </span>
                    )}
                    <button
                      onClick={() => setCardRevealed(!cardRevealed)}
                      className="p-1 rounded-full transition-all hover:bg-white/10 active:scale-90"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {cardRevealed ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={handleCopyNumber}
                      className="p-1 rounded-full transition-all hover:bg-white/10 active:scale-90 opacity-0 group-hover:opacity-100"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between text-[12px]" style={{ transform: "translateZ(16px)", color: "rgba(255,255,255,0.7)" }}>
                  <span>MARJANE DIGITAL</span>
                  <span>{activeCard?.expiryDate || "03/29"}</span>
                  <span className="flex items-center gap-1">
                    CVV{" "}
                    {cardRevealed ? (
                      <span ref={cvvRef}>{activeCard?.cvv || "•••"}</span>
                    ) : (
                      <span>•••</span>
                    )}
                    <button
                      onClick={() => setCardRevealed(!cardRevealed)}
                      className="p-0.5 rounded-full hover:bg-white/10 transition-all"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {cardRevealed ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CARD ACTIONS ─── */}
          <div className="flex flex-col items-center gap-4 mt-8 w-[320px]">
            {/* Primary: Add Funds */}
            <div ref={actionsRef}>
              <button
                onClick={handleAddFunds}
                disabled={actionLoading === activeCard?.id}
                className="relative overflow-hidden flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-full text-[14px] font-semibold transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFE135)",
                  color: "#0A0E1A",
                  width: "200px",
                  boxShadow: "0 0 20px rgba(255,215,0,0.15)",
                  cursor: actionLoading === activeCard?.id ? "wait" : "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #FFE135, #FFD700)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,215,0,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #FFD700, #FFE135)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,215,0,0.15)"; }}
              >
                <ArrowUpRightIcon /> Add Funds
              </button>
            </div>

            {/* Secondary: Freeze + Rotate */}
            <div ref={secActionsRef} className="flex gap-3 w-full">
              <button
                onClick={() => handleToggleStatus(activeCard?.id, isFrozen ? "ACTIVE" : "FROZEN")}
                disabled={actionLoading === activeCard?.id}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-[12px] font-semibold transition-all duration-300 active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: isFrozen ? "#22C55E" : "#EF4444",
                  cursor: actionLoading === activeCard?.id ? "wait" : "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = isFrozen ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
                  e.currentTarget.style.background = isFrozen ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <SnowflakeIcon /> {isFrozen ? "UNFREEZE" : "FREEZE"}
              </button>
              <button
                onClick={() => handleRegenerate(activeCard?.id)}
                disabled={actionLoading === activeCard?.id}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-[12px] font-semibold transition-all duration-300 active:scale-95 group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#3B82F6",
                  cursor: actionLoading === activeCard?.id ? "wait" : "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.background = "rgba(59,130,246,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <RefreshIcon className="transition-transform duration-500 group-hover:rotate-180" /> ROTATE
              </button>
            </div>

            {/* Delete */}
            <button
              onClick={() => { setDeleteCardId(activeCard?.id); setShowDeleteModal(true); }}
              className="text-[13px] font-medium transition-all hover:underline py-2"
              style={{ color: "rgba(239,68,68,0.6)" }}
            >
              Delete this card
            </button>
          </div>
        </div>

        {/* ─── CARD SLOT INDICATOR ─── */}
        <div ref={slotRef} className="flex items-center justify-center gap-4 mt-8 mb-10">
          <span className="text-[12px]" style={{ color: "#475569" }}>{cards.length > 0 ? `${activeCardIndex + 1} of ${cards.length} card${cards.length > 1 ? 's' : ''} active` : "No cards"}</span>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="relative w-3 h-3 rounded-full transition-all duration-300 group"
                style={{
                  background: i < cards.length ? (i === activeCardIndex ? "#FFD700" : "#334155") : "#1E293B",
                  border: i >= cards.length ? "1px solid #334155" : "none",
                  cursor: i < cards.length ? "pointer" : "default",
                }}
                onClick={() => { if (i < cards.length) { setActiveCardIndex(i); setFrostOverlay(false); } }}
                title={i >= cards.length ? "Upgrade to Pro to unlock" : `Card ${i + 1}`}
              >
                {i >= cards.length && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                    Upgrade to Pro to unlock
                  </div>
                )}
              </div>
            ))}
          </div>
          {user?.tier === "BRONZE" && cards.length >= 1 && (
            <button className="text-[12px] font-medium transition-all relative" style={{ color: "#FFD700" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
            >
              Upgrade
            </button>
          )}
        </div>

        {/* ─── RECENT CARD ACTIVITY ─── */}
        <div ref={activityRef} className="max-w-[420px] mx-auto mb-12">
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="w-6 h-[2px]" style={{ background: "#FFD700" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#475569" }}>Recent Card Activity</span>
          </div>
          <div className="space-y-2">
            {MOCK_TRANSACTIONS.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <MarqueeIcon letter={tx.merchant[0]} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{tx.merchant}</p>
                  <p className="text-[10px]" style={{ color: "#475569" }}>{tx.time}</p>
                </div>
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: tx.type === "refund" ? "#22C55E" : "#E2E8F0" }}>{tx.amount}</span>
              </div>
            ))}
          </div>
          <Link href="/transactions" className="block mt-3 text-[12px] font-medium text-center transition-all hover:underline" style={{ color: "#FFD700" }}>
            View all →
          </Link>
        </div>

        {/* ─── SECURITY SECTION ─── */}
        <section ref={securityRef} className="rounded-3xl p-10 mx-auto" style={{ maxWidth: "760px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="relative shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.06)", boxShadow: "0 0 30px rgba(255,215,0,0.06)", animation: "pulse-dot 3s ease-in-out infinite" }}>
              <ShieldIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[20px] font-[700] mb-2">MILITARY-GRADE ENCRYPTION</h3>
              <p className="text-[14px] leading-relaxed max-w-xl" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
                Every virtual card is protected by 256-bit AES encryption. Freeze instantly, regenerate numbers on demand, or delete permanently — all in real time.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { label: "PCI-DSS", color: "#0066FF" },
                  { label: "AES-256", color: "#22C55E" },
                  { label: "REAL-TIME", color: "#FFD700" },
                ].map(b => (
                  <span
                    key={b.label}
                    className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderLeft: `3px solid ${b.color}`,
                      color: "#94A3B8",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.color = "#E2E8F0"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94A3B8"; }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-3xl p-8 w-[360px] shadow-2xl" style={{ background: "rgba(15,20,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
            <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
            <p className="text-sm mb-8" style={{ color: "#64748B" }}>This action cannot be undone. The card will be permanently deleted.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteCardId(null); }}
                className="px-6 py-2.5 rounded-full text-[12px] font-semibold transition-all hover:bg-white/5 active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteCardId}
                className="px-6 py-2.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                style={{ background: "#EF4444", color: "#fff", cursor: actionLoading === deleteCardId ? "wait" : "pointer" }}
              >
                {actionLoading === deleteCardId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CardRefillModal
        isOpen={isCardRefillOpen}
        onClose={() => setIsCardRefillOpen(false)}
        card={activeCard}
        walletBalance={walletBalance}
        onSuccess={handleCardRefillSuccess}
      />
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <CardsContent />
    </Suspense>
  );
}
