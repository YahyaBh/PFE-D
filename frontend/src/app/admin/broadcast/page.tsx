"use client";

import { useState } from "react";
import { 
  Megaphone, 
  Send, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  Users,
  Info,
  ShieldAlert
} from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function BroadcastSystem() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM_ANNOUNCEMENT"
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/broadcast", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message || "Broadcast sent successfully", type: "success" });
        setFormData({ title: "", message: "", type: "SYSTEM_ANNOUNCEMENT" });
      } else {
        setToast({ message: data.error || "Failed to broadcast", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error during broadcast", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Internal Broadcast</h1>
        <p className="text-slate-500 font-medium">Push urgent notifications and system announcements to all active users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <form onSubmit={handleBroadcast} className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-10 space-y-6">
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Announcement Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Scheduled Maintenance"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500/50 focus:outline-none transition-all"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Notification Message</label>
                    <textarea 
                      placeholder="Write your message here..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-medium focus:border-blue-500/50 focus:outline-none transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">Alert Level</label>
                        <select 
                           value={formData.type}
                           onChange={(e) => setFormData({...formData, type: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500/50 focus:outline-none transition-all appearance-none outline-none"
                        >
                           <option value="SYSTEM_ANNOUNCEMENT">System (Standard)</option>
                           <option value="SECURITY_ALERT">Security (Urgent)</option>
                           <option value="MAINTENANCE">Maintenance (Yellow)</option>
                        </select>
                   </div>
                </div>

                <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={loading || !formData.title || !formData.message}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      EXECUTE BROADCAST
                    </button>
                </div>
            </form>
        </div>

        <div className="space-y-6">
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Global Audience</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Your message will be sent to all registered users. This action cannot be undone.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-amber-500/10 border border-amber-500/20">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-amber-500">Security Note</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Broadcasts are audited. Ensure the message content complies with Marjane's communication guidelines.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
