"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle, Clock,
  Eye, RefreshCw, Shield, Loader2, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminKYC() {
  const [list, setList] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, unverified: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");

  const fetchKYC = async (p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(p || page));
      params.set("limit", "15");
      if (search) params.set("search", search);
      const res = await api.get(`/admin/kyc?${params}`);
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data.reviews) ? data.reviews : []);
        setStats(data.stats || { pending: 0, verified: 0, rejected: 0, unverified: 0 });
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchKYC(1); }, [statusFilter, search]);
  useEffect(() => { fetchKYC(); }, [page]);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/kyc/${selected.id}/approve`);
      setSelected(null); setNote("");
      fetchKYC();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/kyc/${selected.id}/reject`, { reason: note || undefined });
      setSelected(null); setNote("");
      fetchKYC();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    PENDING: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
    VERIFIED: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 },
    REJECTED: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
    UNVERIFIED: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Shield },
  };

  const STATUS_TABS = [
    { key: "all", label: "All", count: total },
    { key: "PENDING", label: "Pending", count: stats.pending },
    { key: "VERIFIED", label: "Verified", count: stats.verified },
    { key: "REJECTED", label: "Rejected", count: stats.rejected },
    { key: "UNVERIFIED", label: "Unverified", count: stats.unverified },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">KYC Reviews</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Review and manage identity verification requests.</p>
        </div>
        <button onClick={() => fetchKYC()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Verified", value: stats.verified, color: "#10b981" },
          { label: "Rejected", value: stats.rejected, color: "#ef4444" },
          { label: "Unverified", value: stats.unverified, color: "rgba(255,255,255,0.4)" },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Status Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none rounded-2xl py-3 pl-11 pr-4 text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
        </div>
        <div className="flex gap-2">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${statusFilter === t.key ? 'text-white' : ''}`}
              style={{
                background: statusFilter === t.key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                borderColor: statusFilter === t.key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                color: statusFilter === t.key ? '#fff' : 'rgba(255,255,255,0.3)'
              }}>{t.label} ({t.count})</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[2rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>User</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Documents</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Submitted</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#3b82f6' }} /></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center"><p style={{ color: 'rgba(255,255,255,0.3)' }}>No KYC records found.</p></td></tr>
            ) : list.map((k: any) => {
              const ss = STATUS_STYLES[k.status] || STATUS_STYLES.UNVERIFIED;
              const Icon = ss.icon;
              return (
                <tr key={k.id} className="border-b last:border-0 hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <User className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{k.userName || "Unknown"}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{k.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${ss.bg} ${ss.color} ${ss.border}`}>
                      <Icon className="w-3 h-3" /> {k.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{k.docCount || 0}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {k.submitted_at ? new Date(k.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not submitted"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {k.status === "PENDING" && (
                      <button onClick={async () => {
                        setSelected(k);
                        setNote("");
                        setSelectedDocs([]);
                        try {
                          const res = await api.get(`/kyc/documents?userId=${k.user_id}`);
                          if (res.ok) {
                            const docs = await res.json();
                            setSelectedDocs(Array.isArray(docs) ? docs : []);
                          }
                        } catch (err) {}
                      }}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors"
                        style={{ color: '#3b82f6' }}>
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
              className="p-2.5 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold ${p === page ? 'bg-blue-600 text-white' : ''}`}
                  style={p !== page ? { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' } : {}}>{p}</button>
              ) : null;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
              className="p-2.5 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelected(null); setNote(""); }} />
          <div className="relative rounded-[2rem] max-w-lg w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Review KYC</h3>
              <button onClick={() => { setSelected(null); setNote(""); }}
                className="text-xl transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>User</span>
                <span className="text-white font-bold">{selected.userName || selected.userEmail}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Documents</span>
                <span className="text-white font-bold">{selected.docCount || 0}</span>
              </div>
              {selectedDocs.length > 0 && (
                <div className="pt-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Uploaded Files</p>
                  {selectedDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>{(doc.type || '').split('_').join(' ')}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{doc.file_name || ''}</p>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/kyc/documents/${doc.id}/file`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Review Note (for rejection)</label>
              <textarea className="w-full outline-none rounded-xl p-4 text-sm resize-none transition-all"
                rows={3} placeholder="Optional note for the user..."
                value={note} onChange={(e) => setNote(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={actionLoading}
                className="flex-1 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
              </button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
