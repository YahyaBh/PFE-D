"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ArrowLeftRight, 
  PlusCircle, 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Info,
  ArrowRight,
  Globe,
  Loader2,
  Send,
  Wallet,
  RefreshCw,
  X,
  Copy,
  Check,
  Banknote
} from "lucide-react";

export default function MerchantSettlements() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, settleRes] = await Promise.all([
        api.get("/merchant/stats"),
        api.get("/merchant/settlements")
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setBalance(data.wallet.balance);
      }
      if (settleRes.ok) setSettlements(await settleRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlement = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await api.post("/merchant/settlements", { amount });
      if (res.ok) {
        setShowModal(false);
        setAmount("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = filter === "ALL" ? settlements : settlements.filter(s => s.status === filter);

  const filters = ["ALL", "PENDING", "COMPLETED", "FAILED"];

  const handleCopySettlementId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div 
            className="lg:col-span-2 p-10 rounded-[3rem] relative overflow-hidden group"
            style={{ 
              background: 'linear-gradient(135deg, #1a1a3e, #0d0d2b)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                  <Wallet className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center h-full gap-8 text-center md:text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: '#FFD700' }}>Available Revenue</p>
                    <h2 className="text-6xl font-black text-white tracking-tighter">
                        {loading ? "---" : parseFloat(balance.toString()).toFixed(2)} <span className="text-2xl opacity-40">MAD</span>
                    </h2>
                  </div>
                  <button 
                     onClick={() => setShowModal(true)}
                     className="px-10 py-5 text-black font-black rounded-3xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
                     style={{ 
                       background: '#FFD700',
                       boxShadow: '0 0 30px rgba(255,215,0,0.3)'
                     }}
                  >
                     <PlusCircle className="w-5 h-5" />
                     REQUEST SETTLEMENT
                  </button>
              </div>
          </div>

          <div 
            className="p-10 rounded-[3rem] flex flex-col justify-center text-center"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
             <div 
               className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(255,255,255,0.05)' }}
             >
                <Building2 className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.4)' }} />
             </div>
             <h3 className="text-lg font-black text-white mb-2">Primary Bank Account</h3>
             <p className="text-xs font-extrabold uppercase tracking-widest leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Marjane Credit Populaire<br />
                **** **** **** 8829
             </p>
             <button className="mt-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors" style={{ color: '#FFD700' }}>
                 Manage Payout Details
                 <ArrowRight className="w-3 h-3" />
             </button>
          </div>
      </div>

      {/* Settlement History */}
      <div 
        className="rounded-[3rem] overflow-hidden"
        style={{ 
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
          <div 
            className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
             <h3 className="text-xl font-black text-white flex items-center gap-3">
                <History className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.4)' }} />
                Settlement History
             </h3>
             <div className="flex gap-2">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 text-[10px] font-black rounded-xl transition-all"
                  style={{
                    background: filter === f ? '#FFD700' : 'rgba(255,255,255,0.05)',
                    color: filter === f ? '#000000' : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
             </div>
          </div>
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#FFD700' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
               <div 
                 className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                 style={{ background: 'rgba(255,255,255,0.02)' }}
               >
                  <ArrowLeftRight className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.1)' }} />
               </div>
               <p className="text-lg font-black text-white mb-2">Request your first settlement</p>
               <p className="text-sm font-medium max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Your available revenue will appear here once you have payments.
               </p>
               <button 
                 onClick={() => setShowModal(true)}
                 className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-black font-black rounded-2xl transition-all text-sm active:scale-95"
                 style={{ 
                   background: '#FFD700',
                   boxShadow: '0 0 20px rgba(255,215,0,0.2)'
                 }}
               >
                  <Banknote className="w-4 h-4" />
                  Request Settlement
               </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>ID</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr 
                      key={s.id} 
                      className="last:border-0 transition-colors cursor-pointer hover:opacity-80"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onClick={() => setSelectedSettlement(s)}
                    >
                      <td className="p-5">
                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>#{s.id.slice(0, 10)}</span>
                      </td>
                      <td className="p-5">
                        <span className="text-lg font-black text-white">{parseFloat(s.amount).toFixed(2)} <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</span></span>
                      </td>
                      <td className="p-5">
                        <span 
                          className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest"
                          style={{
                            color: s.status === "COMPLETED" ? '#16a34a' : s.status === "PENDING" ? '#d97706' : '#dc2626',
                            background: s.status === "COMPLETED" ? 'rgba(22,163,74,0.1)' : s.status === "PENDING" ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                            borderColor: s.status === "COMPLETED" ? 'rgba(22,163,74,0.2)' : s.status === "PENDING" ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'
                          }}
                        >
                          {s.status === "COMPLETED" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                           s.status === "PENDING" ? <Clock className="w-2.5 h-2.5" /> :
                           <XCircle className="w-2.5 h-2.5" />}
                          {s.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedSettlement(null)} />
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
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,215,0,0.1)' }}
                  >
                    <ArrowLeftRight className="w-6 h-6" style={{ color: '#FFD700' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">Settlement Details</h2>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>#{selectedSettlement.id.slice(0, 12)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSettlement(null)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="text-center">
                <p className="text-5xl font-black text-white">
                  {parseFloat(selectedSettlement.amount).toFixed(2)}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</p>
              </div>

              <div className="flex justify-center">
                <span 
                  className="inline-flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest"
                  style={{
                    color: selectedSettlement.status === "COMPLETED" ? '#16a34a' : selectedSettlement.status === "PENDING" ? '#d97706' : '#dc2626',
                    background: selectedSettlement.status === "COMPLETED" ? 'rgba(22,163,74,0.1)' : selectedSettlement.status === "PENDING" ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)',
                    borderColor: selectedSettlement.status === "COMPLETED" ? 'rgba(22,163,74,0.2)' : selectedSettlement.status === "PENDING" ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)'
                  }}
                >
                  {selectedSettlement.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> :
                   selectedSettlement.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {selectedSettlement.status}
                </span>
              </div>

              <div 
                className="p-6 rounded-3xl space-y-4"
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Settlement ID</span>
                    <button 
                      onClick={() => handleCopySettlementId(selectedSettlement.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold transition-colors"
                      style={{ color: '#FFD700' }}
                    >
                      {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs font-mono break-all" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedSettlement.id}</p>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Date Requested</span>
                  <span className="text-xs font-bold text-white">
                    {new Date(selectedSettlement.created_at).toLocaleDateString("en-GB", { 
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Bank Account</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Marjane Credit Populaire</p>
                      <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>**** **** **** 8829</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Request Modal */}
       {showModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={() => setShowModal(false)} />
           <div 
             className="relative w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
             style={{ 
               background: 'rgba(15,15,40,0.95)',
               border: '1px solid rgba(255,255,255,0.1)',
               backdropFilter: 'blur(20px)'
             }}
           >
              <div className="p-10 space-y-8">
                 <div className="text-center">
                     <div 
                       className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6"
                       style={{ 
                         background: '#FFD700',
                         boxShadow: '0 0 30px rgba(255,215,0,0.3)'
                       }}
                     >
                         <ArrowLeftRight className="w-10 h-10 text-black" />
                     </div>
                     <h2 className="text-3xl font-black text-white tracking-tighter">Request Settlement</h2>
                     <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Transfer funds from your merchant wallet to your bank.</p>
                 </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount to Payout</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-3xl py-6 px-8 text-2xl font-black text-white focus:outline-none transition-all text-center"
                                style={{ 
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.06)'
                                }}
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>MAD</div>
                        </div>
                        <p className="text-[10px] text-center font-extrabold" style={{ color: 'rgba(255,255,255,0.4)' }}>Max available: {parseFloat(balance.toString()).toFixed(2)} MAD</p>
                    </div>

                    <div 
                      className="p-6 rounded-3xl space-y-3"
                      style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Settlement Fee</span>
                            <span className="text-white">0.00 MAD</span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <div className="flex justify-between items-center text-sm font-black">
                            <span className="uppercase tracking-widest" style={{ color: '#FFD700' }}>Net Payout</span>
                            <span className="text-white">{(parseFloat(amount) || 0).toFixed(2)} MAD</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSettlement}
                        disabled={submitting || !amount || parseFloat(amount) > balance}
                        className="w-full py-5 text-black font-black rounded-3xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                        style={{ 
                          background: '#FFD700',
                          boxShadow: '0 0 30px rgba(255,215,0,0.3)'
                        }}
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                        CONFIRM SETTLEMENT
                    </button>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        Cancel Transaction
                    </button>
                </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
