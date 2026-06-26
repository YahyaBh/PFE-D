"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ShoppingBag, 
  CreditCard,
  Target,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  Zap,
  DollarSign,
  Clock
} from "lucide-react";
import dynamic from 'next/dynamic';

const SalesChart = dynamic(() => import('@/components/MerchantSalesChart'), { ssr: false });

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MerchantDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/merchant/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-full space-y-8 animate-pulse p-6">
      <div className="p-10 rounded-[3rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-4 w-32 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-10 w-64 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-[2rem] p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-4 w-24 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-8 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 rounded-[2.5rem] p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-6 w-48 rounded-full mb-10" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-[350px] rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
        <div className="lg:col-span-4 rounded-[2.5rem] p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-6 w-32 rounded-full mb-8" style={{ background: 'rgba(255,255,255,0.05)' }} />
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    </div>
  );

  const analyticsData = stats?.salesAnalytics?.map((s: any) => ({
    name: new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    volume: parseFloat(s.volume),
    count: s.count
  })).reverse() || [];

  const totalVolume = stats?.salesAnalytics?.reduce((acc: number, s: any) => acc + parseFloat(s.volume), 0) || 0;
  const totalCount = stats?.salesAnalytics?.reduce((acc: number, s: any) => acc + s.count, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Pending Approval Banner */}
      {stats?.merchant?.merchantStatus === "PENDING_APPROVAL" && (
        <div 
          className="p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,191,36,0.1)' }}
          >
            <Clock className="w-6 h-6" style={{ color: '#f59e0b' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black" style={{ color: '#d97706' }}>Application Pending Review</p>
            <p className="text-xs font-medium mt-1" style={{ color: 'rgba(217,119,6,0.7)' }}>Your merchant application is being reviewed. You'll be able to accept payments once approved.</p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div 
        className="relative overflow-hidden p-10 rounded-[3rem] shadow-2xl"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a3e, #0d0d2b)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
         <div className="absolute top-0 right-0 p-10 opacity-5">
            <Zap className="w-64 h-64 text-white" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
               <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Merchant Insights</p>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  Welcome back, <br /> {stats?.merchant?.merchantName}
               </h1>
            </div>
            <div 
              className="p-6 rounded-[2.5rem] flex flex-col items-center"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
               <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Available for Settlement</p>
               <p className="text-4xl font-black text-white">{parseFloat(stats?.wallet?.balance).toFixed(2)} <span className="text-lg opacity-60">MAD</span></p>
            </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard 
            title="Total Revenue" 
            value={`${totalVolume.toFixed(2)} MAD`} 
            trend="+12.5%" 
            icon={DollarSign}
            color="blue"
         />
         <KPICard 
            title="Transactions" 
            value={totalCount.toString()} 
            trend="+5.2%" 
            icon={ShoppingBag}
            color="indigo"
         />
          <KPICard 
            title="Average Order" 
            value={`${totalCount > 0 ? (totalVolume / totalCount).toFixed(2) : '0.00'} MAD`} 
            trend="-1.2%" 
            icon={Target}
            color="purple"
          />
         <KPICard 
            title="Customer Growth" 
            value="124" 
            trend="+18%" 
            icon={Users}
            color="emerald"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chart */}
          <div 
            className="lg:col-span-8 rounded-[2.5rem] p-8"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black text-white">Sales Performance</h3>
                   <p className="text-xs font-extrabold uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Net revenue over time</p>
                </div>
                <div className="flex gap-2">
                   <button 
                     className="px-4 py-2 text-[10px] font-black rounded-xl"
                     style={{ background: '#FFD700', color: '#000000' }}
                   >30 DAYS</button>
                   <button 
                     className="px-4 py-2 text-[10px] font-black rounded-xl"
                     style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                   >QUARTER</button>
                </div>
             </div>

             <div className="h-[350px] w-full">
                <SalesChart data={analyticsData} />
             </div>
          </div>

          {/* Recent Orders */}
          <div 
            className="lg:col-span-4 rounded-[2.5rem] p-8 flex flex-col"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white">Latest Sales</h3>
                <button 
                  className="text-[10px] font-black uppercase tracking-widest transition-colors"
                  style={{ color: '#FFD700' }}
                >View All</button>
             </div>

             <div className="flex-1 space-y-4">
                {stats?.recentTransactions?.map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className="group p-4 rounded-2xl flex items-center gap-4 transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                            <ShoppingBag className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{tx.customerName || "Wallet User"}</p>
                            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(tx.created_at).toLocaleDateString()} · {tx.currency}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black" style={{ color: '#22c55e' }}>+{parseFloat(tx.amount).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
             </div>

             <div 
               className="mt-8 p-6 rounded-3xl flex items-center justify-between"
               style={{ 
                 background: 'rgba(255,255,255,0.02)',
                 border: '1px solid rgba(255,255,255,0.06)'
               }}
             >
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Weekly Profit</p>
                    <p className="text-base font-black text-white">+ Morocco · Casablanca</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ 
                    background: '#FFD700',
                    boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                  }}
                >
                    <TrendingUp className="w-6 h-6 text-black" />
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, color }: any) {
    const iconColors: any = {
        blue: "#3b82f6",
        indigo: "#6366f1",
        purple: "#a855f7",
        emerald: "#10b981",
    };

    return (
        <div 
          className="rounded-[2rem] p-6 transition-all"
          style={{ 
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
            <div className="flex justify-between items-start mb-4">
                <div 
                  className="p-3 rounded-2xl"
                  style={{ background: `${iconColors[color]}20` }}
                >
                    <Icon className="w-5 h-5" style={{ color: iconColors[color] }} />
                </div>
                <span 
                  className="text-[10px] font-black px-2 py-1 rounded-lg"
                  style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}
                >{trend}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
    );
}
