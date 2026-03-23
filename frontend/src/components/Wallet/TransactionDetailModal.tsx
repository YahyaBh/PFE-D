"use client";

import { X, ArrowUpRight, ArrowDownLeft, Wallet, Landmark, QrCode, CreditCard, Copy, CheckCircle2, Clock, AlertTriangle, User, Calendar, Hash, MessageSquare } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from "react";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    currentUserEmail?: string;
}

export default function TransactionDetailModal({ isOpen, onClose, transaction, currentUserEmail }: TransactionDetailModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !transaction) return null;

    const isSender = transaction.senderEmail === currentUserEmail || transaction.direction === "OUT";
    const status = transaction.status?.toUpperCase() || "COMPLETED";
    const type = transaction.type?.toUpperCase() || "PAYMENT";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(transaction.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getIcon = () => {
        if (type.startsWith("DEPOSIT")) return <Wallet className="w-8 h-8" />;
        if (type === "WITHDRAWAL") return <Landmark className="w-8 h-8" />;
        if (type === "QR_PAYMENT") return <QrCode className="w-8 h-8" />;
        if (type === "CARD_REFILL") return <CreditCard className="w-8 h-8" />;
        return isSender ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownLeft className="w-8 h-8" />;
    };

    const getColorClass = () => {
        if (status === "FAILED") return "bg-red-500 text-white shadow-red-500/20";
        if (status === "PENDING") return "bg-amber-500 text-white shadow-amber-500/20";
        if (type.startsWith("DEPOSIT")) return "bg-green-500 text-white shadow-green-500/20";
        return isSender ? "bg-primary text-white shadow-primary/20" : "bg-secondary text-primary shadow-secondary/20";
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "Unknown Date";
        return d.toLocaleString("en-US", { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-background/60 backdrop-blur-2xl animate-in fade-in duration-700" 
                onClick={onClose} 
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-card rounded-[4rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 ease-out overflow-hidden shadow-primary/5">
                
                {/* Header Section */}
                <div className={cn("px-12 py-16 text-center relative overflow-hidden", getColorClass())}>
                    <div className="absolute inset-0 bg-zellige-soft opacity-10 pointer-events-none" />
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative z-10 space-y-6">
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border border-white/10 mx-auto flex items-center justify-center shadow-2xl">
                            {getIcon()}
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60 mb-2">Transaction Amount</p>
                            <h2 className="text-7xl font-black tracking-tighter leading-none">
                                {isSender ? "-" : "+"}{parseFloat(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-2xl ml-3 opacity-60 font-black italic">{transaction.currency || "MAD"}</span>
                            </h2>
                        </div>

                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 border border-white/5 backdrop-blur-sm">
                            {status === "COMPLETED" && <CheckCircle2 className="w-4 h-4" />}
                            {status === "PENDING" && <Clock className="w-4 h-4 animate-pulse" />}
                            {status === "FAILED" && <AlertTriangle className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-12 space-y-12 bg-white dark:bg-card">
                    
                    {/* Parties Grid */}
                    <div className="grid grid-cols-2 gap-8 relative">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/5 z-0">
                            <X className="w-4 h-4 text-foreground/20 rotate-45" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 ml-2">From</label>
                            <div className="flex items-center gap-4 p-5 rounded-3xl bg-foreground/5 border border-foreground/5 transition-all hover:bg-foreground/[0.07]">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{transaction.senderName || "System"}</p>
                                    <p className="text-[9px] font-medium text-foreground/40 truncate italic">{transaction.senderEmail || "Marjane Protocol"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-right">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 mr-2">To</label>
                            <div className="flex flex-row-reverse items-center gap-4 p-5 rounded-3xl bg-foreground/5 border border-foreground/5 transition-all hover:bg-foreground/[0.07]">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{transaction.receiverName || "Receiver"}</p>
                                    <p className="text-[9px] font-medium text-foreground/40 truncate italic">{transaction.receiverEmail || "Recipient Account"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata List */}
                    <div className="space-y-6">
                        <DetailRow 
                            icon={Calendar} 
                            label="Transaction Date" 
                            value={formatDate(transaction.created_at || transaction.createdAt)} 
                        />
                        <DetailRow 
                            icon={Hash} 
                            label="Transaction ID" 
                            value={transaction.id} 
                            isCopyable 
                            onCopy={copyToClipboard}
                            copied={copied}
                        />
                        <DetailRow 
                            icon={MessageSquare} 
                            label="Activity Type" 
                            value={type.replace(/_/g, " ")} 
                        />
                    </div>

                    {/* Note Box */}
                    {transaction.note && (
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform duration-1000">
                                <MessageSquare className="w-16 h-16 text-primary" />
                            </div>
                            <label className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/40 block">Personal Note</label>
                            <p className="text-sm font-medium text-foreground italic leading-relaxed">
                                "{transaction.note}"
                            </p>
                        </div>
                    )}

                    {/* Footer Action */}
                    <button 
                        onClick={onClose}
                        className="w-full h-20 bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black uppercase tracking-[0.4em] text-[10px] hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl active:scale-95 mt-4"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, isCopyable, onCopy, copied }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20">{label}</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
                </div>
            </div>
            {isCopyable && (
                <button 
                    onClick={onCopy}
                    className="p-3 rounded-xl hover:bg-foreground/5 transition-all text-foreground/20 hover:text-primary relative active:scale-90"
                    title="Copy Transaction ID"
                >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}
