"use client";

import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Gift, Ticket, ArrowLeft, Loader2, CheckCircle2, Zap,
  Star, Clock, Tag, AlertCircle, Shield, Percent, Crown
} from "lucide-react";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

const TIERS = [
  { name: "Bronze", min: 0, icon: Shield, color: "text-amber-600" },
  { name: "Silver", min: 200, icon: Star, color: "text-slate-300" },
  { name: "Gold", min: 500, icon: Crown, color: "text-amber-400" },
];

const getTier = (points: number) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
};

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) { router.push("/login"); return; }
    fetchLoyalty();
  }, []);

  const fetchLoyalty = async () => {
    try {
      const res = await api.get("/loyalty/status");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (couponId: string) => {
    setClaiming(couponId);
    try {
      const res = await api.post("/loyalty/claim", { couponId });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setToast({ message: "Coupon claimed successfully!", type: "success" });
      fetchLoyalty();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const points = data?.points ?? 0;
  const tier = getTier(points);
  const TierIcon = tier.icon;
  const nextTier = TIERS.find(t => t.min > points);
  const progress = nextTier ? Math.min(100, (points / nextTier.min) * 100) : 100;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-4 duration-500">
          <div className={cn(
            "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border",
            toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-red-500/10 border-red-500/20 text-red-600"
          )}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Rewards</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loyalty Program</p>
          </div>
        </div>

        {/* Points & Tier Card */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-xl p-3">
                  <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{points.toLocaleString()} <span className="text-secondary text-lg italic">PTS</span></h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Loyalty Points</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 border border-white/10">
                <TierIcon className={cn("w-5 h-5", tier.color)} />
                <span className={cn("font-black text-sm uppercase tracking-wider", tier.color)}>{tier.name}</span>
              </div>
            </div>

            {/* Progress to next tier */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>{tier.name}</span>
                <span>{nextTier ? `${nextTier.name} (${nextTier.min - points} pts away)` : 'Max Tier Reached'}</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Earn 1 point for every 10 MAD spent. Redeem points for exclusive coupons and discounts.</p>
          </div>
        </div>

        {/* My Coupons */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-black uppercase tracking-tight">My Coupons</h3>
          </div>
          {!data?.myCoupons || data.myCoupons.length === 0 ? (
            <div className="p-12 rounded-[2rem] bg-card border border-border text-center">
              <Gift className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-muted-foreground">No coupons claimed yet</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Browse available coupons below to claim with your points.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.myCoupons.map((uc: any) => (
                <div key={uc.id} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide">{uc.code}</p>
                      <p className="text-[10px] text-muted-foreground">{uc.discount_percentage}% discount</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Coupons */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-black uppercase tracking-tight">Available Coupons</h3>
          </div>
          {!data?.availableCoupons || data.availableCoupons.length === 0 ? (
            <div className="p-12 rounded-[2rem] bg-card border border-border text-center">
              <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-muted-foreground">No coupons available</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Check back later for new rewards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.availableCoupons.map((coupon: any) => {
                const canAfford = points >= coupon.points_cost;
                const owned = data.myCoupons?.some((uc: any) => uc.coupon_id === coupon.id);
                return (
                  <div key={coupon.id} className="p-6 rounded-[2rem] bg-card border border-border hover:border-primary/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                          <Percent className="w-6 h-6 text-secondary" />
                        </div>
                        {owned && (
                          <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">Owned</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black tracking-tight">{coupon.discount_percentage}% OFF</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{coupon.description || `Get ${coupon.discount_percentage}% discount on your next purchase.`}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-black">{coupon.points_cost} pts</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">Exp: {new Date(coupon.expiry_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(coupon.id)}
                        disabled={!canAfford || owned || claiming === coupon.id}
                        className={cn(
                          "w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2",
                          canAfford && !owned
                            ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-95"
                            : owned
                            ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                            : "bg-foreground/5 text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {claiming === coupon.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : owned ? (
                          <><CheckCircle2 className="w-4 h-4" /> Claimed</>
                        ) : canAfford ? (
                          <><Zap className="w-4 h-4" /> Claim for {coupon.points_cost} pts</>
                        ) : (
                          <><AlertCircle className="w-4 h-4" /> Need {coupon.points_cost - points} more pts</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
