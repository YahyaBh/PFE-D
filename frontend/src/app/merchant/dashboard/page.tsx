"use client";

import { useState, useEffect } from "react";
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
  DollarSign
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

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
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/merchant/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
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
    <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-10 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-[3rem] shadow-2xl">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <Zap className="w-64 h-64 text-white" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
               <p className="text-white/80 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Merchant Insights</p>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  Welcome back, <br /> {stats?.merchant?.merchantName}
               </h1>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] flex flex-col items-center">
               <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Available for Settlement</p>
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
            value={`${(totalVolume / (totalCount || 1)).toFixed(2)} MAD`} 
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
          <div className="lg:col-span-8 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black text-foreground">Sales Performance</h3>
                   <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest mt-1">Net revenue over time</p>
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl">30 DAYS</button>
                   <button className="px-4 py-2 bg-muted text-muted-foreground text-[10px] font-black rounded-xl">QUARTER</button>
                </div>
             </div>

             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="var(--muted-foreground)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="var(--muted-foreground)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(v: any) => `${v}`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem' }}
                            itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="var(--primary)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorVolume)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-4 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-foreground">Latest Sales</h3>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-colors">View All</button>
             </div>

             <div className="flex-1 space-y-4">
                {stats?.recentTransactions?.map((tx: any) => (
                    <div key={tx.id} className="group p-4 bg-background/50 border border-border rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-foreground truncate">{tx.customerName || "Wallet User"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{new Date(tx.created_at).toLocaleDateString()} · {tx.currency}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-green-500">+{parseFloat(tx.amount).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
             </div>

             <div className="mt-8 p-6 bg-muted rounded-3xl border border-border/50 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Weekly Profit</p>
                    <p className="text-base font-black text-foreground">+ Morocco · Casablanca</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, color }: any) {
    const colors: any = {
        blue: "text-blue-500 bg-blue-500/10",
        indigo: "text-indigo-500 bg-indigo-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
    };

    return (
        <div className="bg-card border border-border rounded-[2rem] p-6 hover:border-border/80 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{trend}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
    );
}
