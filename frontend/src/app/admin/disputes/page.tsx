"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FileText,
  RefreshCw,
  User,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Check,
  X,
  Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DisputeCenter() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/disputes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setDisputes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status: 'RESOLVED' | 'REJECTED') => {
    if (!selectedDispute) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/disputes/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status,
          resolutionNote
        })
      });
      if (res.ok) {
        setSelectedDispute(null);
        setResolutionNote("");
        fetchDisputes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'RESOLVED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Dispute Resolution Center
          </h1>
          <p className="text-slate-400 mt-1">Review, communicate, and resolve transaction disputes.</p>
        </div>
        <button 
          onClick={fetchDisputes}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl transition-all font-bold text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dispute List */}
        <div className="lg:col-span-4 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-4">All Disputes</h2>
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-800" /></div>
                ) : disputes.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900/30 rounded-[2rem] border border-slate-800 border-dashed">
                        <p className="text-sm text-slate-500">No active disputes</p>
                    </div>
                ) : disputes.map(d => (
                    <button 
                        key={d.id}
                        onClick={() => setSelectedDispute(d)}
                        className={cn(
                            "w-full text-left p-5 rounded-[2rem] border transition-all group",
                            selectedDispute?.id === d.id 
                                ? "bg-red-500/10 border-red-500/30" 
                                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                        )}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest", getStatusColor(d.status))}>
                                {d.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono italic">#{d.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">{d.reason.replace(/_/g, ' ')}</h3>
                        <p className="text-xs text-slate-400 truncate">{d.description}</p>
                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                    <User className="w-3 h-3 text-slate-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{d.userName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Resolution Console */}
        <div className="lg:col-span-8">
            {selectedDispute ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div className="p-8 border-b border-slate-800 bg-slate-900/80">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Dispute Details</p>
                                <h2 className="text-2xl font-black text-white">{selectedDispute.reason.replace(/_/g, ' ')}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">{parseFloat(selectedDispute.amount).toFixed(2)} <span className="text-xs opacity-40 uppercase">{selectedDispute.currency}</span></p>
                                <p className="text-[10px] text-slate-500">Original Transaction ID: {selectedDispute.transaction_id.slice(0, 13)}...</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-8 p-6 bg-slate-950 rounded-3xl border border-slate-800/50">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Complainant</p>
                                <p className="text-sm font-bold text-white">{selectedDispute.userName}</p>
                                <p className="text-xs text-slate-500">{selectedDispute.userEmail}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Submitted On</p>
                                <p className="text-sm font-bold text-white">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                User Statement
                            </p>
                            <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 text-sm text-slate-300 leading-relaxed italic">
                                "{selectedDispute.description}"
                            </div>
                        </div>

                        {/* Resolution Form */}
                        {selectedDispute.status === 'OPEN' || selectedDispute.status === 'UNDER_REVIEW' ? (
                            <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Internal Resolution Note</label>
                                    <textarea 
                                        value={resolutionNote}
                                        onChange={e => setResolutionNote(e.target.value)}
                                        placeholder="Explain the reason for approval or rejection (visible to user)..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-4 px-6 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-red-500/50 min-h-[100px] resize-none transition-all"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleResolve('RESOLVED')}
                                        disabled={processing}
                                        className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-3xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        APPROVE REFUND
                                    </button>
                                    <button 
                                        onClick={() => handleResolve('REJECTED')}
                                        disabled={processing}
                                        className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-red-500 font-black rounded-3xl transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                        REJECT CLAIM
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "p-6 rounded-3xl border flex items-center gap-4",
                                selectedDispute.status === 'RESOLVED' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                                {selectedDispute.status === 'RESOLVED' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Dispute Resolved: {selectedDispute.status}</p>
                                    <p className="text-xs italic mt-1 opacity-70">Note: {selectedDispute.resolution_note || "No note provided"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-[3rem]">
                    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                        <ShieldAlert className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">Resolution Console</h3>
                    <p className="text-sm text-slate-600 max-w-xs">Select a dispute from the left panel to review evidence and issue refunds.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
