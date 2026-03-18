"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Tag, 
  Info, 
  Monitor, 
  Globe, 
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  old_value: string;
  new_value: string;
  ip_address: string;
  device_info: string;
  created_at: string;
  userName: string;
  userEmail: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = new URL("http://localhost:5000/api/admin/audit-logs");
      if (actionFilter) url.searchParams.append("action", actionFilter);
      
      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.userName?.toLowerCase().includes(search.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes('FAILED') || action.includes('SUSPENDED') || action.includes('REMOVED')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (action.includes('SUCCESS') || action.includes('ACTIVATED') || action.includes('ISSUED')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (action.includes('TRANSFER') || action.includes('REFILL')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Audit Logs
          </h1>
          <p className="text-slate-400 mt-1">Full traceability of sensitive system actions.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all font-medium"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search User, Action or Resource..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium appearance-none"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="WALLET_TRANSFER">Wallet Transfer</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="CARD_ISSUED">Card Issued</option>
            <option value="PASSWORD_CHANGED">Password Changed</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="TRANSACTION_REVERSED">Tx Reversed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Real-time tracking enabled</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Resource</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Context</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-slate-500 mt-4 font-medium italic">Scanning audit history...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No matching audit logs found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={cn(
                      "hover:bg-white/5 transition-colors cursor-pointer group",
                      expandedId === log.id && "bg-white/5"
                    )} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{formatDate(log.created_at)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {log.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/5">
                            {log.userName?.[0] || 'S'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{log.userName || "System / Guest"}</span>
                            <span className="text-xs text-slate-500">{log.userEmail || "Internal Action"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest",
                          getActionColor(log.action)
                        )}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-400 capitalize">{log.resource}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Globe className="w-3.5 h-3.5" />
                            {log.ip_address}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 truncate max-w-[150px] font-medium" title={log.device_info}>
                            <Monitor className="w-3.5 h-3.5 shrink-0" />
                            {log.device_info}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
                          {expandedId === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-950/30">
                        <td colSpan={6} className="px-12 py-6">
                           <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                  <ChevronDown className="w-3 h-3" /> Previous State
                                </h4>
                                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-400 overflow-x-auto font-mono">
                                  {log.old_value ? JSON.stringify(JSON.parse(log.old_value), null, 2) : "NO PREVIOUS DATA"}
                                </pre>
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                  <ChevronUp className="w-3 h-3" /> New Result
                                </h4>
                                <pre className="p-4 bg-slate-900 border border-blue-500/20 rounded-2xl text-[11px] text-blue-300 overflow-x-auto font-mono">
                                  {log.new_value ? JSON.stringify(JSON.parse(log.new_value), null, 2) : "NO NEW DATA"}
                                </pre>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from "react";
