"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  MoreVertical, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  RotateCcw,
  AlertTriangle,
  Loader2,
  Filter
} from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
          setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/admin/users/status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, status: newStatus })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        setToast({ message: `User ${newStatus === 'active' ? 'reactivated' : 'suspended'} successfully`, type: "success" });
      }
    } catch (err) {
      setToast({ message: "Failed to update user status", type: "error" });
    }
  };

  const handleResetMFA = async (userId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/admin/users/reset-mfa", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setToast({ message: "User MFA has been reset", type: "success" });
      }
    } catch (err) {
      setToast({ message: "Failed to reset MFA", type: "error" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">User Registry</h1>
          <p className="text-slate-500 font-medium">Control accounts, adjust status, and manage security settings.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:border-blue-500/50 outline-none transition-all w-80"
                />
            </div>
            <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
                <Filter className="w-5 h-5 text-slate-500" />
            </button>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan & Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Join Date</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        user.tier === 'FREE' ? 'border-slate-800 text-slate-500' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                      }`}>
                        {user.tier}
                      </span>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                         {user.status}
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`p-2.5 rounded-xl transition-all ${
                        user.status === 'active' 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                      title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                    >
                      {user.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleResetMFA(user.id)}
                      className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                      title="Reset MFA"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
             <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
             <p className="font-bold text-slate-500">No users found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
