"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Download,
  ChevronLeft, ChevronRight, Loader2, FileText, Calendar, DollarSign,
  CreditCard, QrCode, Landmark, ArrowRight, X, SlidersHorizontal, AlertTriangle, Menu,
  BookOpen,
  ShieldAlert, Clock, Sparkles
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "PAYMENT", label: "Payment" },
  { value: "REQUEST", label: "Request" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

const TYPE_ICONS: Record<string, any> = {
  P2P_TRANSFER: ArrowUpRight,
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: Landmark,
  QR_PAYMENT: QrCode,
  REQUEST: FileText,
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Dispute Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTransactions = useCallback(async (p: number = page) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (minAmount) params.set("minAmount", minAmount);
      if (maxAmount) params.set("maxAmount", maxAmount);

      const res = await fetch(`http://localhost:5000/api/transactions/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load transactions", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [token, search, typeFilter, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchTransactions(1);
  }, [token]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { fetchTransactions(1); }, 400);
    return () => clearTimeout(timer);
  }, [search, typeFilter, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const clearFilters = () => {
    setSearch(""); setTypeFilter(""); setStatusFilter("");
    setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount("");
  };

  const hasActiveFilters = !!(search || typeFilter || statusFilter || dateFrom || dateTo || minAmount || maxAmount);

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Type", "Status", "Direction", "Counterparty", "Amount", "Currency", "Note"];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString("en-GB"),
      t.type,
      t.status,
      t.direction,
      t.direction === "OUT" ? (t.receiverName || t.receiverEmail || "—") : (t.senderName || t.senderEmail || "—"),
      t.amount,
      t.currency || "MAD",
      t.note || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Activity exported to CSV.", type: "success" });
  };

  const handleReport = (tx: any) => {
    setSelectedTx(tx);
    setShowDisputeModal(true);
  };

  const submitDispute = async () => {
    if (!disputeReason) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch("http://localhost:5000/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          reason: disputeReason,
          description: disputeDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setToast({ message: "Issue reported successfully.", type: "success" });
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDesc("");
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-1000 bg-zellige-soft">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ───── Fluid Navigation ───── */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-5xl no-print">
        <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-2xl">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeft className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xs tracking-widest text-foreground uppercase">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={exportCSV} 
                disabled={transactions.length === 0} 
                className="hidden md:flex items-center gap-3 px-6 py-3 bg-secondary text-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <div className="w-[1px] h-8 bg-foreground/10 hidden md:block" />
            <h1 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40 hidden sm:block">Transaction History</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-44 pb-24">
        
        {/* ───── Page Header ───── */}
        <header className="mb-24 relative px-4">
            <div className="flex items-end gap-6 mb-4">
                <Sparkles className="w-12 h-12 text-secondary animate-pulse" />
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">Activity</h1>
            </div>
            <p className="text-[12px] font-bold text-foreground/40 uppercase tracking-[0.4em]">A complete record of your transactions.</p>
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        </header>

        {/* ───── Search & Filters ───── */}
        <div className="mb-20 space-y-8 no-print px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/20 group-focus-within:text-primary transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-white dark:bg-card border-none rounded-[2rem] pl-20 pr-8 py-8 text-lg font-bold placeholder:text-foreground/10 focus:ring-4 focus:ring-primary/10 transition-all shadow-xl shadow-foreground/5"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-10 h-24 rounded-[2rem] flex items-center gap-4 text-xs font-black tracking-[0.2em] transition-all",
                (showFilters || hasActiveFilters) 
                    ? "bg-primary text-white shadow-2xl shadow-primary/30" 
                    : "bg-white dark:bg-card text-foreground shadow-xl"
              )}
            >
              <SlidersHorizontal className="w-6 h-6" />
              Filters
              {hasActiveFilters && <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-12 bg-white dark:bg-card rounded-[3rem] shadow-2xl border border-foreground/5 space-y-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-4">Type</label>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full bg-secondary/30 rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-4">Status</label>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-secondary/30 rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-4">From Date</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-secondary/30 rounded-full px-6 py-4 text-xs font-bold border-none" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-4">Min Amount</label>
                  <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="0.00" className="w-full bg-secondary/30 rounded-full px-6 py-4 text-xs font-bold border-none" />
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-foreground/5">
                <button onClick={clearFilters} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-foreground transition-colors">
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-4 px-4">
              {typeFilter && <FilterPill label={`TYPE: ${TYPE_OPTIONS.find(o => o.value === typeFilter)?.label.toUpperCase()}`} onRemove={() => setTypeFilter("")} />}
              {statusFilter && <FilterPill label={`STATUS: ${statusFilter.toUpperCase()}`} onRemove={() => setStatusFilter("")} />}
              {dateFrom && <FilterPill label={`FROM: ${dateFrom}`} onRemove={() => setDateFrom("")} />}
              {minAmount && <FilterPill label={`MIN: ${minAmount}`} onRemove={() => setMinAmount("")} />}
            </div>
          )}
        </div>

        {/* ───── Activity Stream ───── */}
        <div className="space-y-12 relative px-4">
          <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/20">Loading activity...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-40 fluid-card bg-foreground/5 dark:bg-card/5 outline-dashed outline-2 outline-foreground/10 outline-offset-[2rem]">
              <FileText className="w-20 h-20 text-foreground/10 mx-auto mb-10" />
              <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter">No activity yet</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mt-4 leading-relaxed max-w-[300px] mx-auto text-center">
                Try adjusting your filters to find what you're looking for.
              </p>
            </div>
          ) : (
            transactions.map((t: any) => {
              const Icon = TYPE_ICONS[t.type] || ArrowRight;
              const isOutgoing = t.direction === "OUT";
              const counterparty = isOutgoing
                ? (t.receiverName || t.receiverEmail || "External Account")
                : (t.senderName || t.senderEmail || "Internal Account");

              return (
                <div key={t.id} className="group relative flex items-start gap-12 md:pl-4 transition-all hover:translate-x-2">
                  <div className={cn(
                      "w-24 h-24 shrink-0 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-all group-hover:scale-110",
                      t.status === 'FAILED' ? "bg-red-500 text-white shadow-red-500/20" :
                      t.status === 'PENDING' ? "bg-amber-500 text-white shadow-amber-500/20" :
                      isOutgoing ? "bg-primary text-white shadow-primary/20" : "bg-secondary text-primary shadow-secondary/20"
                  )}>
                      <Icon className="w-10 h-10" />
                  </div>

                  <div className="flex-1 pt-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                                    {new Date(t.created_at).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })} • {t.status}
                                </p>
                                {t.status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                            </div>
                            <h5 className="text-3xl font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">
                                {t.type === 'QR_PAYMENT' ? 'Payment' :
                                 isOutgoing ? `Sent to ${counterparty}` : `Received from ${counterparty}`}
                            </h5>
                        </div>
                        <div className="text-left lg:text-right shrink-0">
                            <p className={cn("text-5xl font-black tracking-tighter leading-none mb-1", isOutgoing ? "text-foreground" : "text-primary")}>
                              {isOutgoing ? "-" : "+"}{parseFloat(t.amount).toFixed(2)}
                            </p>
                            <p className="text-[12px] font-bold text-foreground/20 italic uppercase tracking-widest">{t.currency || "MAD"}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                        {t.note && (
                            <div className="px-6 py-3 bg-foreground/5 rounded-2xl inline-block max-w-lg">
                                <p className="text-[11px] font-medium text-foreground/60 italic leading-relaxed tracking-widest">"{t.note}"</p>
                            </div>
                        )}
                        <button 
                            onClick={() => handleReport(t)}
                            className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500/40 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            Report an issue
                        </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ───── Pagination ───── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 pt-24 no-print">
            <button
              onClick={() => { setPage(Math.max(1, page - 1)); fetchTransactions(Math.max(1, page - 1)); }}
              disabled={page <= 1}
              className="w-16 h-16 rounded-full bg-white dark:bg-card shadow-lg flex items-center justify-center disabled:opacity-20 hover:bg-primary hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const p = page <= 2 ? i + 1 : page === totalPages ? totalPages - 2 + i : page - 1 + i;
                    if (p <= 0 || p > totalPages) return null;
                    return (
                        <button
                            key={p}
                            onClick={() => { setPage(p); fetchTransactions(p); }}
                            className={cn(
                                "w-14 h-14 rounded-full font-black text-xs transition-all",
                                p === page ? "bg-primary text-white shadow-xl shadow-primary/30" : "bg-white dark:bg-card text-foreground hover:bg-secondary"
                            )}
                        >
                            {p}
                        </button>
                    );
                })}
            </div>

            <button
              onClick={() => { setPage(Math.min(totalPages, page + 1)); fetchTransactions(Math.min(totalPages, page + 1)); }}
              disabled={page >= totalPages}
              className="w-16 h-16 rounded-full bg-white dark:bg-card shadow-lg flex items-center justify-center disabled:opacity-20 hover:bg-primary hover:text-white transition-all active:scale-90"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ───── Issue Modal ───── */}
        {showDisputeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl" onClick={() => setShowDisputeModal(false)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-card rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
              <div className="p-16">
                <div className="flex justify-between items-start mb-16">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/20">
                      <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-5xl font-black text-foreground uppercase tracking-tighter leading-none">Report Issue</h2>
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/30 mt-3">Tell us what happened</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-6">What's the issue?</label>
                    <select 
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      className="w-full bg-secondary/30 rounded-full px-8 py-5 text-xs font-bold uppercase tracking-widest border-none appearance-none cursor-pointer focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="">Select a reason...</option>
                      <option value="UNAUTHORIZED">Unauthorized transaction</option>
                      <option value="INCORRECT_AMOUNT">Incorrect amount</option>
                      <option value="SERVICE_NOT_RECEIVED">Service not received</option>
                      <option value="DUPLICATE">Duplicate transaction</option>
                      <option value="OTHER">Other issue</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-6">Additional details</label>
                    <textarea 
                      value={disputeDesc}
                      onChange={e => setDisputeDesc(e.target.value)}
                      placeholder="Please describe the problem..."
                      className="w-full bg-secondary/30 rounded-[2rem] px-8 py-8 text-xs font-bold border-none h-48 placeholder:text-foreground/10 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="pt-10 flex flex-col sm:flex-row gap-6">
                    <button 
                      onClick={() => setShowDisputeModal(false)}
                      className="flex-1 py-6 bg-foreground/5 text-foreground rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDispute}
                      disabled={!disputeReason || submittingDispute}
                      className="flex-1 py-6 bg-red-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20 disabled:opacity-20 flex items-center justify-center gap-3"
                    >
                      {submittingDispute ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                      Submit Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-20" />
      </main>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white dark:bg-card rounded-full px-6 py-3 shadow-md border border-foreground/5">
      {label}
      <button onClick={onRemove} className="hover:text-primary transition-all border-l border-foreground/10 pl-3 ml-1 text-foreground/30"><X className="w-4 h-4" /></button>
    </span>
  );
}
