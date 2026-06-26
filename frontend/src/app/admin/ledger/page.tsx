"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, ArrowUpRight, ArrowDownLeft, AlertCircle, Clock,
  Search, Loader2, RefreshCw, CheckCircle2, Scale
} from "lucide-react";
import { api } from "@/lib/api";

export default function GeneralLedgerPage() {
  const [tab, setTab] = useState("accounts");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const [summaryRes, entriesRes] = await Promise.all([
        api.get("/admin/ledger/summary"),
        api.get("/admin/ledger/entries?limit=50")
      ]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setStats(data.stats || data);
        setAccounts(data.accounts || []);
      }
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(Array.isArray(data) ? data : data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedger(); }, []);

  const handleReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await api.post("/admin/ledger/reconcile");
      if (res.ok) setReconcileResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setReconciling(false);
    }
  };

  const filteredAccounts = accounts.filter(a =>
    a.name?.toLowerCase().includes(accountSearch.toLowerCase()) ||
    a.ownerName?.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">General Ledger</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Double-entry accounting system overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReconcile} disabled={reconciling}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
            {reconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            Reconcile
          </button>
          <button onClick={fetchLedger} className="p-3 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-6">
          <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-3">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Total Credits</span>
            </div>
            <span className="text-2xl font-black text-white">{parseFloat(stats.totalCredits || 0).toLocaleString()}</span>
          </div>
          <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-3">
              <ArrowDownLeft className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Total Debits</span>
            </div>
            <span className="text-2xl font-black text-white">{parseFloat(stats.totalDebits || 0).toLocaleString()}</span>
          </div>
          <div className="p-6 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-3">
              <Scale className="w-5 h-5" style={{ color: parseFloat(stats.imbalance || 0) > 0.01 ? '#ef4444' : '#10b981' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Imbalance</span>
            </div>
            <span className={`text-2xl font-black ${parseFloat(stats.imbalance || 0) > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
              {parseFloat(stats.imbalance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Reconcile Result */}
      {reconcileResult && (
        <div className="p-5 rounded-2xl flex items-center gap-3" style={{
          background: reconcileResult.balanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${reconcileResult.balanced ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
        }}>
          {reconcileResult.balanced ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-bold" style={{ color: reconcileResult.balanced ? '#10b981' : '#ef4444' }}>
            {reconcileResult.balanced ? '✓ Ledger is balanced' : `Imbalance: ${parseFloat(reconcileResult.imbalance).toFixed(2)} MAD`}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {["accounts", "entries"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm font-bold uppercase tracking-widest transition-all ${tab === t ? 'text-white' : ''}`}
            style={tab !== t ? { color: 'rgba(255,255,255,0.3)' } : {}}>
            {t === 'accounts' ? 'Ledger Accounts' : 'Journal Entries'}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input type="text" placeholder="Search accounts..." value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="w-full outline-none rounded-2xl py-3 pl-11 pr-4 text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
          </div>
          <div className="rounded-[2rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Account</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Owner</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#3b82f6' }} /></td></tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center"><p style={{ color: 'rgba(255,255,255,0.3)' }}>No accounts found</p></td></tr>
                ) : filteredAccounts.map((a: any) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <BookOpen className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </div>
                        <span className="text-sm font-bold text-white">{a.name || 'Unnamed Account'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border" style={{
                        color: a.type === 'ASSET' ? '#10b981' : a.type === 'LIABILITY' ? '#f59e0b' : '#3b82f6',
                        background: `${a.type === 'ASSET' ? '#10b981' : a.type === 'LIABILITY' ? '#f59e0b' : '#3b82f6'}10`,
                        borderColor: `${a.type === 'ASSET' ? '#10b981' : a.type === 'LIABILITY' ? '#f59e0b' : '#3b82f6'}20`
                      }}>{a.type || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.ownerName || a.ownerEmail || 'System'}</td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-lg font-black text-white">{parseFloat(a.balance || 0).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Journal Entries Tab */}
      {tab === "entries" && (
        <div className="rounded-[2rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Account</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Description</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Debit</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#3b82f6' }} /></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center"><p style={{ color: 'rgba(255,255,255,0.3)' }}>No journal entries found</p></td></tr>
              ) : entries.map((e: any) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  <td className="px-6 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-white">{e.accountName || '—'}</td>
                  <td className="px-6 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{e.txType || '—'}</td>
                  <td className="px-6 py-5 text-right text-sm font-bold text-emerald-500">
                    {e.amount > 0 ? parseFloat(e.amount).toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-5 text-right text-sm font-bold text-red-500">
                    {e.amount < 0 ? Math.abs(e.amount).toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
