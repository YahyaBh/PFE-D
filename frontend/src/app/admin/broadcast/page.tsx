"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { 
  Send, Loader2, Users, ShieldAlert
} from "lucide-react";

export default function BroadcastSystem() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState("info");
  const [target, setTarget] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; text: string} | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/admin/broadcast", { title, message, level, target });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, text: data.message || `Broadcast sent to ${data.count || 'all'} users` });
        setTitle(""); setMessage("");
      } else {
        setResult({ success: false, text: data.error || "Failed to broadcast" });
      }
    } catch {
      setResult({ success: false, text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Internal Broadcast</h1>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Push urgent notifications and system announcements to users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleBroadcast} className="p-8 rounded-[2.5rem] space-y-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {result && (
              <div className={`p-4 rounded-2xl text-sm font-bold ${result.success ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {result.text}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Title</label>
              <input type="text" placeholder="e.g. Scheduled Maintenance" value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full outline-none rounded-2xl py-4 px-6 text-sm font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Message</label>
              <textarea placeholder="Write your message here..." rows={5} value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full outline-none rounded-2xl py-4 px-6 text-sm font-medium transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Alert Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}
                  className="w-full outline-none rounded-2xl py-4 px-6 text-sm font-bold appearance-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>
                  <option value="info">System (Standard)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="critical">Critical (Red)</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Target Audience</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}
                  className="w-full outline-none rounded-2xl py-4 px-6 text-sm font-bold appearance-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>
                  <option value="all">All Users</option>
                  <option value="users">Users Only</option>
                  <option value="merchants">Merchants Only</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading || !title || !message}
              className="w-full py-5 rounded-full font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              style={{ background: '#3b82f6', color: '#ffffff' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? "SENDING..." : "EXECUTE BROADCAST"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Users className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Global Audience</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Your message will be sent to all targeted users. This action is audited.</p>
          </div>
          <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <ShieldAlert className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
            <h3 className="text-lg font-bold text-amber-500 mb-1">Security Note</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Broadcasts are audited and irreversible. Ensure message content complies with guidelines.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
