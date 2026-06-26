"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Fingerprint,
  MoreHorizontal
} from "lucide-react";
import { api } from "@/lib/api";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/details`);
      if (res.ok) setSelectedUser(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const res = await api.post("/admin/users/status", { userId, status: newStatus });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetMFA = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await api.post("/admin/users/reset-mfa", { userId });
      if (res.ok && selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, mfaReset: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
  ];
  const roleTabs = [
    { key: "all", label: "All Roles" },
    { key: "ROLE_USER", label: "Users" },
    { key: "ROLE_MERCHANT", label: "Merchants" },
    { key: "ROLE_ADMIN", label: "Admins" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">User Registry</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {total} users · Control accounts, adjust status, and manage security settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:border-blue-500/50 outline-none transition-all w-72"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {statusTabs.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === t.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700'
            }`}>{t.label}</button>
        ))}
        <div className="w-px h-6 bg-slate-800 mx-2" />
        {roleTabs.map(t => (
          <button key={t.key} onClick={() => setRoleFilter(t.key)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              roleFilter === t.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[2.5rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>User</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Role & Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Tier</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Joined</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  {[1,2,3,4,5].map(c => (
                    <td key={c} className="px-8 py-6"><div className="h-5 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>No users found</p>
              </td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 transition-all hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                <td className="px-8 py-5">
                  <button onClick={() => fetchUserDetail(user.id)} className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
                    </div>
                  </button>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      user.role === 'ROLE_ADMIN' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                      user.role === 'ROLE_MERCHANT' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                      'border-slate-700 text-slate-500 bg-slate-800/30'
                    }`}>{user.role?.replace('ROLE_', '')}</span>
                    <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {user.status}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-xs font-bold" style={{ color: user.tier === 'GOLD' ? '#facc15' : user.tier === 'SILVER' ? '#94a3b8' : 'rgba(255,255,255,0.4)' }}>
                    {user.tier || 'FREE'}</span>
                </td>
                <td className="px-8 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleToggleStatus(user.id, user.status)}
                      disabled={actionLoading === user.id}
                      className={`p-2.5 rounded-xl transition-all ${
                        user.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`} title={user.status === 'active' ? 'Suspend' : 'Activate'}>
                      {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       user.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleResetMFA(user.id)}
                      disabled={actionLoading === user.id}
                      className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }} title="Reset MFA">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => fetchUserDetail(user.id)}
                      className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
              className="p-2.5 rounded-xl transition-all disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                  style={p !== page ? { background: 'rgba(255,255,255,0.03)' } : {}}>{p}</button>
              ) : null;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
              className="p-2.5 rounded-xl transition-all disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedUser.name}</h2>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} /></div>
              ) : (
                <div className="space-y-6">
                  {/* Info */}
                  <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Role</span>
                      <span className="text-sm font-bold text-white">{selectedUser.role}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</span>
                      <span className={`text-sm font-bold ${selectedUser.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{selectedUser.status}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Phone</span>
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedUser.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Tier</span>
                      <span className="text-sm font-bold text-white">{selectedUser.tier || 'FREE'}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>KYC</span>
                      <span className={`text-sm font-bold ${selectedUser.kycStatus === 'VERIFIED' ? 'text-emerald-500' : selectedUser.kycStatus === 'PENDING' ? 'text-amber-500' : 'text-slate-500'}`}>
                        {selectedUser.kycStatus || 'NOT_SUBMITTED'}</span></div>
                  </div>

                  {/* Wallets */}
                  {selectedUser.wallets?.length > 0 && (
                    <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Wallets</h4>
                      <div className="space-y-2">
                        {selectedUser.wallets.map((w: any) => (
                          <div key={w.id} className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white">{w.currency}</span>
                            <span className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{parseFloat(w.balance).toFixed(2)} MAD</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                      className={`flex-1 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                        selectedUser.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}>
                      {selectedUser.status === 'active' ? 'Suspend User' : 'Activate User'}
                    </button>
                    <button onClick={() => handleResetMFA(selectedUser.id)}
                      className="flex-1 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}>
                      Reset MFA
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
