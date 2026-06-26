"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  History, Search, ArrowDownLeft, Clock,
  CheckCircle2, RefreshCw, QrCode,
  X, Copy, Check, ChevronLeft, ChevronRight, XCircle,
  Receipt
} from "lucide-react";
import Link from "next/link";

export default function MerchantHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const limit = 10;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (activeFilter !== "ALL") params.set("status", activeFilter);
      const res = await api.get(`/merchant/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
          setTotal(data.length);
        } else {
          setTransactions(data.transactions || data.data || []);
          setTotal(data.total || data.count || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startResult = total === 0 ? 0 : (page - 1) * limit + 1;
  const endResult = Math.min(page * limit, total);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filters = ["ALL", "PENDING", "COMPLETED", "REFUNDED"];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <History className="w-8 h-8" style={{ color: '#FFD700' }} />
            Transaction History
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>All incoming payments to your merchant account.</p>
        </div>
        <button 
          onClick={fetchHistory} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-sm transition-all"
          style={{ 
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search by customer or transaction ID..."
            className="w-full rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#ffffff'
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className="px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest"
              style={{
                background: activeFilter === f ? '#FFD700' : 'rgba(255,255,255,0.05)',
                color: activeFilter === f ? '#000000' : 'rgba(255,255,255,0.4)'
              }}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Showing results */}
      {!loading && total > 0 && (
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Showing {startResult}-{endResult} of {total} results
        </p>
      )}

      {/* Table */}
      <div 
        className="rounded-[2rem] overflow-hidden"
        style={{ 
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Transaction</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Customer</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Date</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="p-5"><div className="h-4 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                        <div className="h-4 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      </div>
                    </td>
                    <td className="p-5"><div className="h-5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                    <td className="p-5"><div className="h-4 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                    <td className="p-5"><div className="h-4 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                    <td className="p-5"><div className="h-4 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                  </tr>
                ))
              ) : total === 0 ? (
                <tr><td colSpan={6} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <QrCode className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">No payments yet</p>
                      <p className="text-sm mt-1 max-w-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Share your QR code with customers to start receiving payments.
                      </p>
                    </div>
                    <Link
                      href="/merchant/qr"
                      className="inline-flex items-center gap-2 px-6 py-3 text-black font-black rounded-2xl transition-all text-sm active:scale-95"
                      style={{ 
                        background: '#FFD700',
                        boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                      View My QR Code
                    </Link>
                  </div>
                </td></tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr 
                    key={tx.id} 
                    className="last:border-0 transition-colors cursor-pointer hover:opacity-80"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="p-5">
                      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>#{tx.id.slice(0, 10)}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black uppercase"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
                        >
                          {(tx.customerName || "A").charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-white">{tx.customerName || "Anonymous"}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-lg font-black text-white">{parseFloat(tx.amount).toFixed(2)} <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</span></span>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest" style={{
                        color: tx.status === "COMPLETED" ? '#16a34a' : tx.status === "PENDING" ? '#d97706' : '#dc2626',
                        background: tx.status === "COMPLETED" ? 'rgba(22,163,74,0.1)' : tx.status === "PENDING" ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                        borderColor: tx.status === "COMPLETED" ? 'rgba(22,163,74,0.2)' : tx.status === "PENDING" ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'
                      }}>
                        {tx.status === "COMPLETED" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                         tx.status === "PENDING" ? <Clock className="w-2.5 h-2.5" /> :
                         <ArrowDownLeft className="w-2.5 h-2.5" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{tx.type}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-3 rounded-xl transition-all disabled:opacity-30"
              style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: page === p ? '#FFD700' : 'rgba(255,255,255,0.02)',
                      border: page === p ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      color: page === p ? '#000000' : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-3 rounded-xl transition-all disabled:opacity-30"
              style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedTx(null)} />
          <div 
            className="relative w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ 
              background: 'rgba(15,15,40,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tighter">Transaction Details</h2>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="text-center">
                <p className="text-5xl font-black" style={{ color: '#22c55e' }}>
                  {parseFloat(selectedTx.amount).toFixed(2)}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</p>
              </div>

              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest" style={{
                  color: selectedTx.status === "COMPLETED" ? '#16a34a' : selectedTx.status === "PENDING" ? '#d97706' : '#dc2626',
                  background: selectedTx.status === "COMPLETED" ? 'rgba(22,163,74,0.1)' : selectedTx.status === "PENDING" ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                  borderColor: selectedTx.status === "COMPLETED" ? 'rgba(22,163,74,0.2)' : selectedTx.status === "PENDING" ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'
                }}>
                  {selectedTx.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> :
                   selectedTx.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {selectedTx.status}
                </span>
              </div>

              <div 
                className="p-6 rounded-3xl space-y-4"
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black uppercase"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {(selectedTx.customerName || "A").charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedTx.customerName || "Anonymous"}</p>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedTx.customerEmail || "No email"}</p>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Transaction ID</span>
                    <button 
                      onClick={() => handleCopyId(selectedTx.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold transition-colors"
                      style={{ color: '#FFD700' }}
                    >
                      {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs font-mono break-all" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTx.id}</p>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Date</span>
                  <span className="text-xs font-bold text-white">
                    {new Date(selectedTx.created_at).toLocaleDateString("en-GB", { 
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">{selectedTx.type}</span>
                </div>
              </div>

              <button 
                className="w-full py-4 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
                style={{ 
                  background: '#FFD700',
                  boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                }}
              >
                <Receipt className="w-5 h-5" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
