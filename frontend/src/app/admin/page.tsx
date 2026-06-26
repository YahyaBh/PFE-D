"use client";

import { useState, useEffect } from "react";
import { Users, Activity, Clock, DollarSign, AlertTriangle } from "lucide-react";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const statCards = [
    { label: "Total Users", key: "totalUsers", icon: Users, color: "#3b82f6" },
    { label: "Total Volume", key: "totalVolume", icon: DollarSign, color: "#10b981", format: (v: number) => `${(v || 0).toLocaleString()} MAD` },
    { label: "Active Users", key: "activeUsers", icon: Activity, color: "#facc15" },
    { label: "Pending Actions", key: "pendingActions", icon: AlertTriangle, color: "#ef4444", format: (v: number) => `${v || 0}` },
  ];

  const fetchOverview = async () => {
    try {
      const adminToken = localStorage.getItem("admin_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div>
          <div className="h-9 w-64 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-5 w-48 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-4 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div className="h-3 w-20 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="h-8 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentActivity, chartData, health } = data;
  const pendingActions = (stats.pendingKYC || 0) + (stats.pendingMerchants || 0) + (stats.openDisputes || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">System Overview</h1>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Real-time platform performance and activity metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const val = stat.key === 'pendingActions' ? pendingActions : stats[stat.key];
          return (
            <div key={i} className="p-6 rounded-[2rem] transition-all" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{stat.format ? stat.format(val) : val?.toLocaleString() || '0'}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: '#3b82f6' }} /> Recent Activity
            </h3>
          </div>
          <div className="rounded-[2.5rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {recentActivity?.length > 0 ? recentActivity.slice(0, 8).map((activity: any, i: number) => (
              <div key={i} className="p-5 border-b last:border-0 flex items-center justify-between transition-all" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Activity className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{activity.action?.replace(/_/g, ' ')}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {activity.userName || activity.userEmail || 'System'} · {activity.resource || '-'} · {new Date(activity.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No recent activity detected.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Platform Health</h3>
          <div className="p-8 rounded-[2.5rem] space-y-5" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: health?.db === 'connected' ? '#10b981' : '#ef4444' }} />
              <span className="text-sm font-bold text-white">Database</span>
              <span className="text-xs ml-auto font-medium" style={{ color: health?.db === 'connected' ? '#10b981' : '#ef4444' }}>{health?.db === 'connected' ? 'Operational' : 'Down'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: health?.api === 'operational' ? '#10b981' : '#ef4444' }} />
              <span className="text-sm font-bold text-white">API</span>
              <span className="text-xs ml-auto font-medium" style={{ color: health?.api === 'operational' ? '#10b981' : '#ef4444' }}>{health?.api === 'operational' ? 'Operational' : 'Down'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-sm font-bold text-white">Last Backup</span>
              <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>{health?.lastBackup ? new Date(health.lastBackup).toLocaleString() : '-'}</span>
            </div>
          </div>

          {chartData && chartData.length > 0 && (
            <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-sm font-bold text-white mb-4">30-Day Revenue</h4>
              <div className="space-y-2">
                {chartData.slice(-7).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono w-16" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.date?.slice(5)}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (d.revenue || 0) / 100)}%`, background: '#3b82f6' }} />
                    </div>
                    <span className="text-[10px] font-bold text-white w-16 text-right">{parseFloat(d.revenue || 0).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
