"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftRight, Search, Loader2, ChevronRight, ChevronLeft,
  RotateCcw, Eye, X, CircleDot
} from "lucide-react";
import { api } from "@/lib/api";

export default function TransactionMonitoring() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  const handleReverse = async (transactionId: string) => {
    setReversingId(transactionId);
    try {
      const res = await api.post("/admin/transactions/reverse", { transactionId });
      if (res.ok) {
        setTransactions(transactions.map(t => t.id === transactionId ? { ...t, status: 'REVERSED', note: 'Reversed by Admin' } : t));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReversingId(null);
    }
  };

  const typeOptions = ["", "P2P_TRANSFER", "DEPOSIT", "WITHDRAWAL", "CARD_PAYMENT", "EXCHANGE", "MERCHANT_PAYMENT", "FEE"];
  const statusOptions = ["", "COMPLETED", "PENDING", "FAILED", "REVERSED"];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Transaction Ledger</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{total} transactions · Full audit trail with reversal override.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="ID, sender, receiver..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:border-blue-500/50 outline-none transition-all w-72"
            style={{ color: 'rgba(255,255,255,0.8)' }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-[10px] font-bold outline-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
          {typeOptions.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-[10px] font-bold outline-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
          {statusOptions.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-[2.5rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Flow</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Amount</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Type & Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  {[1,2,3,4,5].map(c => <td key={c} className="px-8 py-6"><div className="h-5 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>)}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>No transactions found</p>
              </td></tr>
            ) : transactions.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0 hover:bg-white/[0.02] transition-all" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white max-w-[120px] truncate">{tx.sender_name || 'EXTERNAL'}</span>
                    <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <span className="text-sm font-bold text-white max-w-[120px] truncate">{tx.receiver_name || 'SYSTEM'}</span>
                    <span className="text-[9px] font-mono ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>#{tx.id?.slice(0, 6)}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">{parseFloat(tx.amount || 0).toFixed(2)}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{tx.currency || 'MAD'}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{tx.type?.replace(/_/g, ' ')}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase w-fit ${
                      tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                      tx.status === 'REVERSED' ? 'bg-amber-500/10 text-amber-500' :
                      tx.status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <CircleDot className="w-2 h-2" /> {tx.status}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setSelectedTx(tx)} className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReverse(tx.id)}
                      disabled={tx.status === 'REVERSED' || tx.type !== 'P2P_TRANSFER' || reversingId === tx.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                        tx.status === 'REVERSED' ? 'text-slate-600 bg-slate-800/30' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                      }`}>
                      {reversingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      {tx.status === 'REVERSED' ? 'Done' : 'Reverse'}
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

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <ArrowLeftRight className="w-6 h-6" style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Transaction Details</h2>
                    <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>#{selectedTx.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTx(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</span>
                    <span className="text-sm font-bold text-white">{selectedTx.type}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Amount</span>
                    <span className="text-lg font-black text-white">{parseFloat(selectedTx.amount || 0).toFixed(2)} {selectedTx.currency || 'MAD'}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Fee</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{parseFloat(selectedTx.fee || 0).toFixed(2)} {selectedTx.currency || 'MAD'}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Sender</span>
                    <span className="text-sm font-bold text-white">{selectedTx.sender_name || 'EXTERNAL'}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Receiver</span>
                    <span className="text-sm font-bold text-white">{selectedTx.receiver_name || 'SYSTEM'}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</span>
                    <span className={`text-sm font-bold ${selectedTx.status === 'COMPLETED' ? 'text-emerald-500' : selectedTx.status === 'REVERSED' ? 'text-amber-500' : 'text-red-500'}`}>{selectedTx.status}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedTx.created_at ? new Date(selectedTx.created_at).toLocaleString() : '-'}</span></div>
                  {selectedTx.note && <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Note</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedTx.note}</span></div>}
                </div>

                {selectedTx.status === 'COMPLETED' && selectedTx.type === 'P2P_TRANSFER' && (
                  <button onClick={() => { handleReverse(selectedTx.id); setSelectedTx(null); }} disabled={reversingId === selectedTx.id}
                    className="w-full py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 disabled:opacity-50">
                    {reversingId === selectedTx.id ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <RotateCcw className="w-4 h-4 inline mr-2" />}
                    Reverse This Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
