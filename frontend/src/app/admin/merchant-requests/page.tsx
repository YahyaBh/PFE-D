"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store, Search, Loader2, CheckCircle2, XCircle, Clock,
  RefreshCw, Building2, Mail, Tag, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function AdminMerchantRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/admin/merchant/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.requests) {
          setRequests(data.requests);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          // Backward compat: old format returns array directly
          setRequests(data);
          setTotal(data.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await api.post("/admin/merchant/approve", { merchantId: id, action: "APPROVED" });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionId(id);
    try {
      const res = await api.post("/admin/merchant/approve", { merchantId: id, action: "REJECTED", rejectionReason: rejectReason });
      if (res.ok) {
        setRejectingId(null);
        setRejectReason("");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const filtered = requests;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Store className="w-8 h-8 text-blue-400" />
            Merchant Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review and approve merchant onboarding applications.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-slate-200 font-bold text-sm hover:bg-slate-700 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by business name or email..."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-500"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Business</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Owner</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Submitted</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-sm">No merchant requests found.</td></tr>
              ) : (
                filtered.map((req: any) => (
                  <tr key={req.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="text-sm font-bold text-slate-200 text-left hover:text-blue-400 transition-colors"
                          >
                            {req.businessName}
                          </button>
                          {req.description && (
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{req.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-mono text-slate-400">{req.ownerEmail}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-xs font-bold text-slate-400">{req.category || "—"}</span>
                    </td>
                    <td className="p-5">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest",
                        req.status === "ACTIVE" ? "text-green-400 bg-green-500/10 border-green-500/20" :
                        req.status === "PENDING_APPROVAL" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        "text-red-400 bg-red-500/10 border-red-500/20"
                      )}>
                        {req.status === "ACTIVE" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                         req.status === "PENDING_APPROVAL" ? <Clock className="w-2.5 h-2.5" /> :
                         <XCircle className="w-2.5 h-2.5" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="text-xs text-slate-500">
                        {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        {req.status === "PENDING_APPROVAL" && rejectingId !== req.id && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionId === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black rounded-xl hover:bg-green-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                              {actionId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectingId(req.id); setRejectReason(""); }}
                              disabled={actionId === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black rounded-xl hover:bg-red-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === "PENDING_APPROVAL" && rejectingId === req.id && (
                          <div className="flex flex-col gap-2" style={{ minWidth: '200px' }}>
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              rows={2}
                              className="w-full rounded-xl px-3 py-2 text-[10px] font-bold outline-none resize-none"
                              style={{
                                background: 'rgba(220,38,38,0.05)',
                                border: '1px solid rgba(220,38,38,0.2)',
                                color: '#fca5a5'
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirmReject(req.id)}
                                disabled={actionId === req.id || !rejectReason.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black rounded-xl hover:bg-red-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                              >
                                {actionId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-black rounded-xl uppercase tracking-widest transition-all"
                                style={{
                                  color: 'rgba(255,255,255,0.4)',
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.06)'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {req.status !== "PENDING_APPROVAL" && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                            {req.status === "ACTIVE" ? "Approved" : "Denied"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Status Filter & Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["", "PENDING_APPROVAL", "ACTIVE", "REJECTED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-white'
              }`}>{s || 'All'}</button>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
              className="p-2 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
              className="p-2 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}
            onClick={() => setSelectedRequest(null)}
          />
          <div
            className="relative w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(15,15,40,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <Building2 className="w-7 h-7" style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">{selectedRequest.businessName}</h2>
                    <p className="text-xs font-medium mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {selectedRequest.category || "Uncategorized"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedRequest.description && (
                <div
                  className="p-6 rounded-3xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              <div
                className="p-6 rounded-3xl space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Owner Name</span>
                  <span className="text-sm font-bold text-white">{selectedRequest.ownerName || "—"}</span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</span>
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedRequest.ownerEmail}</span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Category</span>
                  <span className="text-xs font-bold text-white">{selectedRequest.category || "—"}</span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Application Date</span>
                  <span className="text-xs font-bold text-white">
                    {new Date(selectedRequest.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</span>
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest"
                    style={{
                      color: selectedRequest.status === "ACTIVE" ? '#16a34a' : selectedRequest.status === "PENDING_APPROVAL" ? '#d97706' : '#dc2626',
                      background: selectedRequest.status === "ACTIVE" ? 'rgba(22,163,74,0.1)' : selectedRequest.status === "PENDING_APPROVAL" ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                      borderColor: selectedRequest.status === "ACTIVE" ? 'rgba(22,163,74,0.2)' : selectedRequest.status === "PENDING_APPROVAL" ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'
                    }}
                  >
                    {selectedRequest.status === "ACTIVE" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                     selectedRequest.status === "PENDING_APPROVAL" ? <Clock className="w-2.5 h-2.5" /> :
                     <XCircle className="w-2.5 h-2.5" />}
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
