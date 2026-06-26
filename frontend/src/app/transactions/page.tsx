"use client";

import { api } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ArrowUpRight, ArrowDownLeft, Download,
  ChevronLeft, ChevronRight, Loader2, FileText,
  QrCode, Landmark, ArrowRight, X, SlidersHorizontal, AlertTriangle,
  ShieldAlert, Sparkles, Bell, User, LogOut
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import Link from "next/link";
import NotificationTray from "@/components/Notifications/NotificationTray";
import TransactionDetailModal from "@/components/Wallet/TransactionDetailModal";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "P2P_TRANSFER", label: "Transfer" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "QR_PAYMENT", label: "Payment" },
  { value: "REQUEST", label: "Request" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  P2P_TRANSFER: { icon: ArrowUpRight, label: "Transfer", color: "#0066FF" },
  DEPOSIT: { icon: ArrowDownLeft, label: "Deposit", color: "#22C55E" },
  WITHDRAWAL: { icon: Landmark, label: "Withdrawal", color: "#6366F1" },
  QR_PAYMENT: { icon: QrCode, label: "Payment", color: "#FFD700" },
  REQUEST: { icon: FileText, label: "Request", color: "#A855F7" },
};

function formatMAD(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2) + " MAD";
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

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
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchTransactions = useCallback(async (p: number = page) => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) return;
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

      const [res, notifRes] = await Promise.all([
        api.get(`/transactions/history?${params.toString()}`),
        api.get("/notifications")
      ]);
      
      const [data, notifData] = await Promise.all([
        res.json(),
        notifRes.json()
      ]);

      if (!res.ok) throw new Error(data.error);

      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load transactions", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) { router.push("/login"); return; }
    fetchTransactions(1);
  }, []);

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
    const rows = transactions.map(t => {
      const d = new Date(t.created_at || t.createdAt);
      const dateStr = isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString("en-GB");
      return [
        dateStr,
        t.type,
        t.status,
        t.direction,
        t.direction === "OUT" ? (t.receiverName || t.receiverEmail || "—") : (t.senderName || t.senderEmail || "—"),
        t.amount,
        t.currency || "MAD",
        t.note || ""
      ];
    });
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
      const res = await api.post("/disputes", {
        transactionId: selectedTx.id,
        reason: disputeReason,
        description: disputeDesc,
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

  const handleMarkNotifRead = async (id: string) => {
    try {
        await api.patch(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
        console.error(e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
        await api.patch(`/notifications/read-all`);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
        console.error(e);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
        await api.delete(`/notifications/${id}`);
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
        console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-1000 bg-zellige-soft">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* ───── Fluid Navigation ───── */}
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-6xl no-print">
            <div className="fluid-glass rounded-full px-8 h-20 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center p-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl border border-foreground/5">
                            <img loading="lazy" src="/Marjane-logo.png" alt="M" className="w-full h-full object-contain" />
                        </div>
                        <div className="hidden md:block">
                            <span className="font-display font-bold text-lg tracking-tight text-foreground uppercase flex flex-col leading-none">
                                MARJANE <span className="text-primary italic text-xs tracking-[0.2em]">PROTOCOL</span>
                            </span>
                        </div>
                    </Link>

                    <div className="h-8 w-[1px] bg-foreground/10 hidden md:block" />

                    <button 
                        onClick={exportCSV} 
                        disabled={transactions.length === 0} 
                        className="hidden md:flex items-center gap-2 px-6 py-2 bg-secondary text-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                    >
                        <Download className="w-3 h-3" /> Export CSV
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    {[
                        { icon: Bell, onClick: () => setIsNotificationTrayOpen(true), badge: notifications.filter(n => !n.isRead).length },
                        { icon: User, onClick: () => router.push("/profile") },
                        { icon: LogOut, onClick: handleLogout, variant: 'destructive' }
                    ].map((btn, i) => (
                        <button 
                            key={i}
                            onClick={btn.onClick}
                            className="relative p-4 rounded-full hover:bg-foreground/5 transition-all active:scale-90"
                            style={{ color: btn.variant === 'destructive' ? '#EF4444' : undefined }}
                        >
                            <btn.icon className="w-6 h-6" />
                            {typeof btn.badge === 'number' && btn.badge > 0 && (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                                    {btn.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 pt-44 pb-24">
            {/* ───── Page Header ───── */}
            <header className="mb-12 relative px-4">
                <div className="flex items-end gap-6 mb-4">
                    <Sparkles className="w-10 h-10" style={{ color: "#FFD700" }} />
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none">Activity</h1>
                </div>
                <p className="text-xs" style={{ color: "#64748B" }}>A complete record of your transactions.</p>
                <div className="absolute -top-12 -right-12 w-96 h-96" style={{ background: "rgba(255,215,0,0.04)", borderRadius: "50%", filter: "blur(100px)" }} />
            </header>

            {/* ───── Search & Filters ───── */}
            <div className="mb-10 space-y-6 no-print px-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#475569" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full rounded-2xl pl-14 pr-5 py-4 text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backdropFilter: "blur(16px)",
                      color: "#E2E8F0",
                      caretColor: "#FFD700",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-semibold tracking-wider transition-all active:scale-95"
                  style={{
                    background: (showFilters || hasActiveFilters) ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    color: (showFilters || hasActiveFilters) ? "#FFD700" : "#94A3B8",
                  }}
                  onMouseEnter={e => { if (!showFilters && !hasActiveFilters) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!showFilters && !hasActiveFilters) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ background: "#FFD700" }} />}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div
                  className="rounded-3xl p-8 space-y-8"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Type</label>
                      <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-xs font-medium outline-none appearance-none cursor-pointer transition-all"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      >
                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Status</label>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-xs font-medium outline-none appearance-none cursor-pointer transition-all"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      >
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>From Date</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-xs font-medium outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                          colorScheme: "dark",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Min Amount</label>
                      <input
                        type="number"
                        value={minAmount}
                        onChange={e => setMinAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl px-4 py-3 text-xs font-medium outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#E2E8F0",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider transition-all"
                      style={{ color: "#FFD700" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#E2E8F0"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#FFD700"; }}
                    >
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  </div>
                </div>
              )}

              {/* Active Filter Pills */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-3">
                  {typeFilter && <FilterPill label={`TYPE: ${TYPE_OPTIONS.find(o => o.value === typeFilter)?.label.toUpperCase()}`} onRemove={() => setTypeFilter("")} />}
                  {statusFilter && <FilterPill label={`STATUS: ${statusFilter.toUpperCase()}`} onRemove={() => setStatusFilter("")} />}
                  {dateFrom && <FilterPill label={`FROM: ${dateFrom}`} onRemove={() => setDateFrom("")} />}
                  {minAmount && <FilterPill label={`MIN: ${minAmount} MAD`} onRemove={() => setMinAmount("")} />}
                </div>
              )}
            </div>

            {/* ───── Transaction Cards ───── */}
            <div className="space-y-4 px-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: "#FFD700", animation: "spin 0.8s linear infinite" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Loading activity...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div
                  className="text-center py-24 rounded-3xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <FileText className="w-14 h-14 mx-auto mb-6" style={{ color: "#475569" }} />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    Try adjusting your filters to find what you're looking for.
                  </p>
                </div>
              ) : (
                transactions.map((t: any) => {
                  const config = TYPE_CONFIG[t.type] || { icon: ArrowRight, label: "Transaction", color: "#94A3B8" };
                  const Icon = config.icon;
                  const isOutgoing = t.direction === "OUT";
                  const counterparty = isOutgoing
                    ? (t.receiverName || t.receiverEmail || "External Account")
                    : (t.senderName || t.senderEmail || "Internal Account");

                  const amountNum = parseFloat(t.amount);
                  const amountColor = t.status === 'FAILED' ? '#EF4444' : isOutgoing ? '#E2E8F0' : '#22C55E';
                  const statusColor = t.status === 'COMPLETED' ? '#22C55E' : t.status === 'PENDING' ? '#FFD700' : '#EF4444';

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTxForDetail(t);
                        setIsDetailModalOpen(true);
                      }}
                      className="relative rounded-3xl p-5 transition-all cursor-pointer active:scale-[0.99]"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(16px)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      {/* Gold accent line */}
                      <div className="absolute top-0 left-8 right-8 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />

                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
                          style={{ background: `${config.color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium truncate">
                              {t.status === 'FAILED' ? "Failed " : ""}{config.label}
                              {!t.type?.startsWith('DEPOSIT') && !t.type?.startsWith('WITHDRAWAL') && t.type !== 'REQUEST' ? ` — ${counterparty}` : ""}
                            </span>
                            <span
                              className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                              style={{
                                background: `${statusColor}15`,
                                color: statusColor,
                              }}
                            >
                              {t.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "#475569" }}>
                            <span>
                              {(() => {
                                const d = new Date(t.created_at || t.createdAt);
                                return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                              })()}
                            </span>
                            {t.note && (
                              <>
                                <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                                <span className="truncate max-w-[200px]" style={{ color: "#64748B" }}>{t.note}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-base font-semibold tabular-nums" style={{ color: amountColor }}>
                            {isOutgoing ? "-" : "+"}{parseFloat(t.amount).toFixed(2)}
                          </p>
                          <p className="text-[10px] font-medium" style={{ color: "#64748B" }}>{t.currency || "MAD"}</p>
                        </div>

                        {/* Report button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReport(t); }}
                          className="shrink-0 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5"
                          style={{ color: "#EF444480" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#EF444480"; }}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ───── Pagination ───── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-10 no-print">
                <button
                  onClick={() => { setPage(Math.max(1, page - 1)); fetchTransactions(Math.max(1, page - 1)); }}
                  disabled={page <= 1}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    color: "#94A3B8",
                  }}
                  onMouseEnter={e => { if (page > 1) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const p = page <= 2 ? i + 1 : page === totalPages ? totalPages - 2 + i : page - 1 + i;
                    if (p <= 0 || p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => { setPage(p); fetchTransactions(p); }}
                        className="w-12 h-12 rounded-xl text-xs font-semibold transition-all active:scale-90"
                        style={
                          p === page
                            ? { background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }
                            : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#94A3B8" }
                        }
                        onMouseEnter={e => {
                          if (p !== page) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        }}
                        onMouseLeave={e => {
                          if (p !== page) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setPage(Math.min(totalPages, page + 1)); fetchTransactions(Math.min(totalPages, page + 1)); }}
                  disabled={page >= totalPages}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    color: "#94A3B8",
                  }}
                  onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ───── Issue Modal ───── */}
            {showDisputeModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(8px)" }}
                  onClick={() => setShowDisputeModal(false)}
                />
                <div
                  className="relative w-full max-w-lg rounded-3xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Gold accent */}
                  <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
                  
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div
                        className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.12)" }}
                      >
                        <AlertTriangle className="w-6 h-6" style={{ color: "#EF4444" }} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Report Issue</h2>
                        <p className="text-xs" style={{ color: "#64748B" }}>Tell us what happened</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>What's the issue?</label>
                        <select
                          value={disputeReason}
                          onChange={e => setDisputeReason(e.target.value)}
                          className="w-full rounded-xl px-4 py-3.5 text-xs font-medium outline-none transition-all appearance-none cursor-pointer"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#E2E8F0",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                          <option value="">Select a reason...</option>
                          <option value="UNAUTHORIZED">Unauthorized transaction</option>
                          <option value="INCORRECT_AMOUNT">Incorrect amount</option>
                          <option value="SERVICE_NOT_RECEIVED">Service not received</option>
                          <option value="DUPLICATE">Duplicate transaction</option>
                          <option value="OTHER">Other issue</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Additional details</label>
                        <textarea
                          value={disputeDesc}
                          onChange={e => setDisputeDesc(e.target.value)}
                          placeholder="Please describe the problem..."
                          className="w-full rounded-xl px-4 py-3.5 text-xs font-medium outline-none transition-all resize-none h-32"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#E2E8F0",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <button
                          onClick={() => setShowDisputeModal(false)}
                          className="flex-1 py-3.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#64748B",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitDispute}
                          disabled={!disputeReason || submittingDispute}
                          className="flex-1 py-3.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-30"
                          style={{
                            background: "linear-gradient(135deg, #FFD700, #FFE135)",
                            color: "#0A0E1A",
                            cursor: (!disputeReason || submittingDispute) ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={e => {
                            if (disputeReason && !submittingDispute) {
                              e.currentTarget.style.background = "linear-gradient(135deg, #FFE135, #FFD700)";
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "linear-gradient(135deg, #FFD700, #FFE135)";
                          }}
                        >
                          {submittingDispute ? <Loader2 className="w-4 h-4" style={{ animation: "spin 0.8s linear infinite" }} /> : <ShieldAlert className="w-4 h-4" />}
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

      <NotificationTray
        isOpen={isNotificationTrayOpen}
        onClose={() => setIsNotificationTrayOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onDelete={handleDeleteNotif}
      />

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTxForDetail}
      />
    </>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-wider rounded-xl px-4 py-2"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#94A3B8",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        className="transition-all"
        style={{ color: "#475569" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#FFD700"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; }}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
