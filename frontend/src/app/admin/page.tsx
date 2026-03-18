"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  ArrowLeftRight, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/system/overview", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch system overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, recentActivity, health } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">System Overview</h1>
        <p className="text-muted-foreground font-medium">Real-time platform performance and activity metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue", trend: "+12%" },
          { label: "Daily Volume", value: `${stats.dailyVolume.toLocaleString()} MAD`, icon: ArrowLeftRight, color: "emerald", trend: "+8.4%" },
          { label: "Active Now", value: stats.activeNow, icon: Activity, color: "amber", trend: "Steady" },
          { label: "KYC Pending", value: stats.pendingKYC, icon: ShieldAlert, color: "red", trend: "-2" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-[2rem] hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-foreground tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent System Alerts */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                 <Clock className="w-5 h-5 text-primary" /> Recent Activity
              </h3>
              <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">View All</button>
           </div>
           
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
               {recentActivity.length > 0 ? recentActivity.map((activity: any, i: number) => (
                <div key={i} className="p-6 border-b border-border/50 last:border-0 flex items-center justify-between hover:bg-muted transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                       <Activity className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{activity.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.userName || activity.userEmail || 'System'} • {activity.resource} • {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl bg-muted hover:bg-border transition-colors">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground text-sm">No recent activity detected.</div>
              )}
            </div>
        </div>

        {/* Security Health */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Platform Health</h3>
          <div className="bg-gradient-to-br from-primary/10 to-indigo-600/10 border border-primary/20 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                   <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div>
                   <p className="text-lg font-bold text-foreground leading-tight">Defense Active</p>
                   <p className="text-xs text-primary font-bold uppercase tracking-widest">Rate controls ON</p>
                </div>
             </div>

              <div className="space-y-4">
                 {[
                   { label: "Database", status: health.database, score: health.database === "Healthy" ? 100 : 50 },
                   { label: "KYC Processor", status: health.kycProcessor, score: 100 },
                   { label: "Ledger Engine", status: health.ledgerEngine, score: 100 },
                   { label: "Uptime", status: health.uptime, score: 99 },
                 ].map((shard, i) => (
                   <div key={i}>
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span className="text-muted-foreground">{shard.label}</span>
                        <span className="text-primary">{shard.status}</span>
                     </div>
                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${shard.score}%` }} />
                     </div>
                   </div>
                 ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
