"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  AlertCircle,
  Clock,
  User,
  Hash,
  RefreshCw,
  Search,
  ChevronRight,
  Database,
  CheckCircle2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LedgerAccount {
  id: string;
  owner_id?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  ownerName?: string;
  ownerEmail?: string;
}

interface LedgerStats {
  totalCredits: number;
  totalDebits: number;
  imbalance: number;
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'entries'>('accounts');
  const [entries, setEntries] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/ledger/summary", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
      setStats(data.stats);

      const entriesRes = await fetch("http://localhost:5000/api/admin/ledger/entries?limit=50", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const entriesData = await entriesRes.json();
      setEntries(entriesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-500" />
            General Ledger
          </h1>
          <p className="text-slate-400 mt-1">Double-entry accounting system and real-time reconciliation.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl transition-all font-bold text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Reconcile Now
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <ArrowUpRight className="w-12 h-12 text-green-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total System Credits</p>
          <h2 className="text-3xl font-black text-white">
            {stats?.totalCredits.toLocaleString() || '0.00'} <span className="text-sm opacity-40">MAD</span>
          </h2>
          <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Verified Inflows
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <ArrowDownLeft className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total System Debits</p>
          <h2 className="text-3xl font-black text-white">
            {stats?.totalDebits.toLocaleString() || '0.00'} <span className="text-sm opacity-40">MAD</span>
          </h2>
          <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Verified Outflows
          </div>
        </div>

        <div className={cn(
             "border p-6 rounded-[2rem] relative overflow-hidden group",
             stats?.imbalance === 0 
                ? "bg-indigo-500/10 border-indigo-500/20" 
                : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-20">
               <Scale className={cn("w-12 h-12", stats?.imbalance === 0 ? "text-indigo-500" : "text-red-500")} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Account Imbalance</p>
          <h2 className={cn("text-3xl font-black", stats?.imbalance === 0 ? "text-indigo-400" : "text-red-500")}>
            {stats?.imbalance.toLocaleString() || '0.00'} <span className="text-sm opacity-40">MAD</span>
          </h2>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold">
            {stats?.imbalance === 0 ? (
                <>
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-400">Ledger fully balanced</span>
                </>
            ) : (
                <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Critical: Integrity Error</span>
                </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-px">
        <button 
          onClick={() => setActiveTab('accounts')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all relative",
            activeTab === 'accounts' ? "text-white" : "text-slate-500 hover:text-white"
          )}
        >
          Ledger Accounts
          {activeTab === 'accounts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('entries')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all relative",
            activeTab === 'entries' ? "text-white" : "text-slate-500 hover:text-white"
          )}
        >
          Journal Entries
          {activeTab === 'entries' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
        {activeTab === 'accounts' ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-800">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {accounts.map(acc => (
                            <tr key={acc.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                            {acc.owner_id ? <User className="w-5 h-5 text-slate-500" /> : <Database className="w-5 h-5 text-indigo-500" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{acc.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono uppercase">{acc.id.slice(0, 13)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-slate-900 rounded-full text-[10px] font-black text-slate-400 border border-slate-800 uppercase tracking-widest">
                                        {acc.type}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className={cn(
                                        "text-lg font-black",
                                        acc.balance < 0 ? "text-red-400" : "text-white"
                                    )}>
                                        {acc.balance.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 ml-2">MAD</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-800">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Journal</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? (
                            <tr><td colSpan={4} className="px-8 py-20 text-center"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" /></td></tr>
                        ) : entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{new Date(entry.created_at).toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">TX: {entry.transaction_id.slice(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="text-sm font-bold text-slate-300">{entry.accountName}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm italic text-slate-400">{entry.description || "N/A"}</span>
                                        <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">{entry.txType}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-sm",
                                        entry.amount < 0 
                                            ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                            : "bg-green-500/10 border-green-500/20 text-green-400"
                                    )}>
                                        {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()} MAD
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
import React from "react";
