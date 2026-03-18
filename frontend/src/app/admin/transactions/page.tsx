"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  Search, 
  Loader2, 
  Filter, 
  ChevronRight,
  ChevronLeft,
  Eye,
  RotateCcw,
  AlertCircle,
  Clock,
  CircleDot
} from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function TransactionMonitoring() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchTransactions = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/admin/transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleReverse = async (transactionId: string) => {
    if (!confirm("Are you sure you want to REVERSE this transaction? Funds will be returned to the sender.")) return;
    
    const token = localStorage.getItem("token");
    setReversingId(transactionId);
    try {
      const res = await fetch("http://localhost:5000/api/admin/transactions/reverse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ transactionId })
      });
      
      if (res.ok) {
        setTransactions(transactions.map(t => 
          t.id === transactionId ? { ...t, status: 'REVERSED', note: 'Reversed by Admin' } : t
        ));
        setToast({ message: "Transaction reversed successfully", type: "success" });
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Failed to reverse", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error during reversal", type: "error" });
    } finally {
      setReversingId(null);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Transaction Ledger</h1>
          <p className="text-slate-500 font-medium">Full audit trail of all platform movements with reversal override.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="ID, Sender, Receiver..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:border-blue-500/50 outline-none transition-all w-80"
                />
            </div>
            <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
                <Filter className="w-5 h-5 text-slate-500" />
            </button>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Flow</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type & Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-800/30 hover:bg-white/[0.01] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-white max-w-[120px] truncate">{tx.sender_name || 'EXTERNAL'}</span>
                       <ChevronRight className="w-3 h-3 text-slate-600" />
                       <span className="text-sm font-bold text-white max-w-[120px] truncate">{tx.receiver_name || 'SYSTEM'}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-600 uppercase">TX-{tx.id.slice(0, 8)}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-baseline gap-1">
                      <p className="text-lg font-black text-white">{tx.amount.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-slate-500">{tx.currency}</p>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.type.replace('_', ' ')}</span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase w-fit ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 
                        tx.status === 'REVERSED' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'
                      }`}>
                         <CircleDot className="w-2.5 h-2.5" />
                         {tx.status}
                      </div>
                   </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      disabled={tx.status === 'REVERSED' || tx.type !== 'P2P_TRANSFER' || reversingId === tx.id}
                      onClick={() => handleReverse(tx.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all font-bold text-[10px] disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      {reversingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      REVERSE
                    </button>
                    <button className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                       <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
