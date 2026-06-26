"use client";

import { X, ArrowUpRight, ArrowDownLeft, Copy, CheckCircle2, Clock, AlertTriangle, Calendar, Hash, MessageSquare, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    currentUserEmail?: string;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction, currentUserEmail }: TransactionDetailModalProps) {
    const [copied, setCopied] = useState(false);
    const [staggered, setStaggered] = useState(false);

    useEffect(() => { if (isOpen && transaction) setStaggered(true); else setStaggered(false); }, [isOpen, transaction]);

    if (!isOpen || !transaction) return null;

    const isSender = transaction.senderEmail === currentUserEmail || transaction.direction === "OUT";
    const status = transaction.status?.toUpperCase() || "COMPLETED";
    const type = transaction.type?.toUpperCase() || "PAYMENT";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(transaction.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const directionIcon = isSender ? ArrowUpRight : ArrowDownLeft;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "Unknown Date";
        return d.toLocaleString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
        COMPLETED: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", label: "Completed", icon: CheckCircle2 },
        PENDING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "Pending", icon: Clock },
        FAILED: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "Failed", icon: AlertTriangle },
    };
    const sc = statusConfig[status] || statusConfig.COMPLETED;
    const StatusIcon = sc.icon;

    const details = [
        { icon: Calendar, label: "TRANSACTION DATE", value: formatDate(transaction.created_at || transaction.createdAt), color: "#FFD700", bg: "rgba(255,215,0,0.08)" },
        { icon: Hash, label: "TRANSACTION ID", value: transaction.id, color: "#6366F1", bg: "rgba(99,102,241,0.08)", copyable: true },
        { icon: MessageSquare, label: "ACTIVITY TYPE", value: type.replace(/_/g, " "), color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
    ];

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
            <div className="fixed inset-0 animate-in fade-in duration-500" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={onClose} />

            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl" style={{ background: "rgba(12,14,22,0.95)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", animation: "modal-enter 0.35s ease-out" }}>
                <style>{`
                    @keyframes modal-enter { 0%{opacity:0;transform:scale(0.95) translateY(10px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
                    @keyframes stagger-in { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
                    .stagger-1 { animation: stagger-in 0.35s ease-out 0.05s both; }
                    .stagger-2 { animation: stagger-in 0.35s ease-out 0.10s both; }
                    .stagger-3 { animation: stagger-in 0.35s ease-out 0.15s both; }
                    .stagger-4 { animation: stagger-in 0.35s ease-out 0.20s both; }
                    .stagger-5 { animation: stagger-in 0.35s ease-out 0.25s both; }
                `}</style>

                {/* ═══ HEADER ═══ */}
                <div className="relative p-8 pb-10 text-center overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(17,17,30,0.95) 0%, rgba(10,12,22,0.98) 100%)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full opacity-[0.03]" style={{ background: "#FFD700", filter: "blur(40px)" }} />
                    <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full opacity-[0.02]" style={{ background: "#FFD700", filter: "blur(40px)" }} />

                    <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <X className="w-4 h-4" style={{ color: "#64748B" }} />
                    </button>

                    <div className="relative space-y-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: isSender ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", boxShadow: isSender ? "0 0 12px rgba(239,68,68,0.15)" : "0 0 12px rgba(34,197,94,0.15)" }}>
                            {(() => {
                                const DirIcon = directionIcon;
                                return <DirIcon className="w-6 h-6" style={{ color: isSender ? "#EF4444" : "#22C55E" }} />;
                            })()}
                        </div>

                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.35em]" style={{ color: "#475569" }}>Transaction Amount</p>
                            <h2 className="text-5xl font-bold tracking-tight leading-none mt-2" style={{ color: isSender ? "#E2E8F0" : "#22C55E" }}>
                                {isSender ? "−" : "+"}{parseFloat(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-base font-medium ml-2" style={{ color: "#475569" }}>{transaction.currency || "MAD"}</span>
                            </h2>
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: sc.bg, border: `1px solid ${sc.color}20` }}>
                            <StatusIcon className="w-3.5 h-3.5" style={{ color: sc.color }} />
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: sc.color }}>{sc.label}</span>
                        </div>
                    </div>
                </div>

                {/* ═══ BODY ═══ */}
                <div className="p-6 space-y-5">

                    {/* Parties */}
                    <div className={`flex items-center gap-3 ${staggered ? "stagger-1" : "opacity-0"}`}>
                        <div className="flex-1 p-4 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>From</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700" }}>{(transaction.senderName || "S").charAt(0)}</div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: "#E2E8F0" }}>{transaction.senderName || "System"}</p>
                                    <p className="text-[9px] truncate" style={{ color: "#64748B" }}>{transaction.senderEmail || "Marjane Protocol"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                        </div>

                        <div className="flex-1 p-4 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>To</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>{(transaction.receiverName || "R").charAt(0)}</div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: "#E2E8F0" }}>{transaction.receiverName || "Receiver"}</p>
                                    <p className="text-[9px] truncate" style={{ color: "#64748B" }}>{transaction.receiverEmail || "Recipient Account"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="space-y-3">
                        {details.map((d, i) => (
                            <div key={i} className={`flex items-center justify-between p-4 rounded-xl transition-all ${staggered ? `stagger-${i + 2}` : "opacity-0"}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: d.bg }}>
                                        <d.icon className="w-4 h-4" style={{ color: d.color }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>{d.label}</p>
                                        <p className={`text-xs font-semibold mt-0.5 truncate ${d.copyable ? "font-mono" : ""}`} style={{ color: "#94A3B8" }}>
                                            {d.copyable ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate">{d.value}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
                                                        className="shrink-0 p-1.5 rounded-lg transition-all active:scale-90"
                                                        style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)" }}
                                                    >
                                                        {copied ? <CheckCircle2 className="w-3 h-3" style={{ color: "#22C55E" }} /> : <Copy className="w-3 h-3" style={{ color: "#475569" }} />}
                                                    </button>
                                                </span>
                                            ) : d.value}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Note */}
                    {transaction.note && (
                        <div className={`relative p-5 rounded-xl ${staggered ? "stagger-5" : "opacity-0"}`} style={{ background: "rgba(17,17,24,0.6)", border: "1px solid rgba(255,215,0,0.15)" }}>
                            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: "#FFD700", boxShadow: "0 0 6px rgba(255,215,0,0.3)" }} />
                            <div className="absolute top-4 right-4 opacity-[0.04]">
                                <MessageSquare className="w-8 h-8" style={{ color: "#FFD700" }} />
                            </div>
                            <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#FFD700" }}>Personal Note</p>
                            <p className="text-xs italic leading-relaxed" style={{ color: "#94A3B8" }}>
                                &ldquo;{transaction.note}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Fee row if available */}
                    {transaction.fee > 0 && (
                        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${staggered ? "stagger-5" : "opacity-0"}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <span className="text-[9px] font-medium" style={{ color: "#475569" }}>Fee</span>
                            <span className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>−{parseFloat(transaction.fee).toFixed(2)} {transaction.currency || "MAD"}</span>
                        </div>
                    )}

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${staggered ? "stagger-5" : "opacity-0"}`}
                        style={{ background: "rgba(26,26,46,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
