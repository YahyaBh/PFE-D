"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle,
  MessageSquare, FileText, RefreshCw,
  User, ShieldAlert, ChevronLeft, ChevronRight,
  Check, X, Loader2, Send
} from "lucide-react";
import { api } from "@/lib/api";

export default function DisputeCenter() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesTab, setMessagesTab] = useState<"messages" | "evidence">("messages");
  const [search, setSearch] = useState("");

  const fetchDisputes = async (p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(p || page));
      params.set("limit", "15");
      if (search) params.set("search", search);
      const res = await api.get(`/admin/disputes?${params}`);
      const data = await res.json();
      if (data && Array.isArray(data.disputes)) {
        setDisputes(data.disputes);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setDisputes(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setDisputes([]);
      }
    } catch (err) {
      console.error(err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDisputes(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [page]);

  const handleResolve = async (status: 'RESOLVED' | 'REJECTED') => {
    if (!selectedDispute) return;
    setProcessing(true);
    try {
      const res = await api.post("/admin/disputes/resolve", {
        disputeId: selectedDispute.id,
        status, resolutionNote
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

  const loadDisputeDetail = async (d: any) => {
    setSelectedDispute(d);
    setMessagesTab("messages");
    const [msgRes, evRes] = await Promise.all([
      api.get(`/disputes/${d.id}/messages`),
      api.get(`/disputes/${d.id}/evidence`)
    ]);
    if (msgRes.ok) {
      const m = await msgRes.json();
      setMessages(Array.isArray(m) ? m : []);
    }
    if (evRes.ok) {
      const e = await evRes.json();
      setEvidence(Array.isArray(e) ? e : []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;
    setSendingMessage(true);
    try {
      await api.post("/disputes/message", { disputeId: selectedDispute.id, message: newMessage.trim() });
      setNewMessage("");
      const msgRes = await api.get(`/disputes/${selectedDispute.id}/messages`);
      if (msgRes.ok) {
        const m = await msgRes.json();
        setMessages(Array.isArray(m) ? m : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': case 'UNDER_REVIEW': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'RESOLVED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const statusTabs = ["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Dispute Resolution Center
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Review, communicate, and resolve transaction disputes.</p>
        </div>
        <button onClick={() => fetchDisputes()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${statusFilter === s ? 'text-white border-blue-500/30' : ''}`}
            style={{
              background: statusFilter === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
              borderColor: statusFilter === s ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
              color: statusFilter === s ? '#fff' : 'rgba(255,255,255,0.3)'
            }}>{s === 'ALL' ? 'All Disputes' : s.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dispute List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input type="text" placeholder="Search disputes..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchDisputes(1); } }}
              className="w-full outline-none rounded-2xl py-3 pl-11 pr-4 text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} /></div>
            ) : disputes.length === 0 ? (
              <div className="p-8 text-center rounded-[2rem] border border-dashed" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No disputes found</p>
              </div>
            ) : disputes.map(d => (
              <button key={d.id} onClick={() => loadDisputeDetail(d)}
                className="w-full text-left p-5 rounded-[2rem] border transition-all"
                style={{
                  background: selectedDispute?.id === d.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedDispute?.id === d.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'
                }}>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${getStatusColor(d.status)}`}>{d.status}</span>
                  <span className="text-[10px] font-mono italic" style={{ color: 'rgba(255,255,255,0.3)' }}>#{d.id?.slice(0, 8)}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{(d.reason || '').replace(/_/g, ' ')}</h3>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.description}</p>
                <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <User className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.userName}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                </div>
              </button>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                className="p-2 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
                className="p-2 rounded-xl disabled:opacity-20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Resolution Console */}
        <div className="lg:col-span-8">
          {selectedDispute ? (
            <div className="rounded-[2.5rem] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Dispute Details</p>
                    <h2 className="text-2xl font-black text-white">{(selectedDispute.reason || '').replace(/_/g, ' ')}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{parseFloat(selectedDispute.amount || 0).toFixed(2)} <span className="text-xs opacity-40 uppercase">{selectedDispute.currency}</span></p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>ID: {(selectedDispute.transaction_id || '').slice(0, 13)}...</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-8 p-6 rounded-3xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Complainant</p>
                    <p className="text-sm font-bold text-white">{selectedDispute.userName}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedDispute.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Submitted On</p>
                    <p className="text-sm font-bold text-white">{selectedDispute.created_at ? new Date(selectedDispute.created_at).toLocaleString() : ''}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <FileText className="w-3 h-3" /> User Statement
                  </p>
                  <div className="p-6 rounded-3xl text-sm italic leading-relaxed" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                    "{selectedDispute.description}"
                  </div>
                </div>

                {/* Resolution Form */}
                {(selectedDispute.status === 'OPEN' || selectedDispute.status === 'UNDER_REVIEW') ? (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Internal Resolution Note</label>
                      <textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                        placeholder="Explain the reason for approval or rejection..."
                        className="w-full outline-none rounded-3xl py-4 px-6 text-sm min-h-[100px] resize-none transition-all"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleResolve('RESOLVED')} disabled={processing}
                        className="flex-1 py-4 font-black rounded-3xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-white"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        APPROVE REFUND
                      </button>
                      <button onClick={() => handleResolve('REJECTED')} disabled={processing}
                        className="flex-1 py-4 font-black rounded-3xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                        REJECT CLAIM
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 rounded-3xl border flex items-center gap-4 ${selectedDispute.status === 'RESOLVED' ? '' : ''}`}
                    style={{
                      background: selectedDispute.status === 'RESOLVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      borderColor: selectedDispute.status === 'RESOLVED' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: selectedDispute.status === 'RESOLVED' ? '#10b981' : '#ef4444'
                    }}>
                    {selectedDispute.status === 'RESOLVED' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest">Dispute {selectedDispute.status}</p>
                      <p className="text-xs italic mt-1 opacity-70">Note: {selectedDispute.resolution_note || "No note provided"}</p>
                    </div>
                  </div>
                )}

                {/* Tabs: Messages / Evidence */}
                <div className="flex gap-4 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <button onClick={() => setMessagesTab("messages")}
                    className="text-[10px] font-black uppercase tracking-widest pb-1 transition-all"
                    style={{ color: messagesTab === "messages" ? '#3b82f6' : 'rgba(255,255,255,0.3)', borderBottom: messagesTab === "messages" ? '2px solid #3b82f6' : '2px solid transparent' }}>
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                    Messages ({messages.length})
                  </button>
                  <button onClick={() => setMessagesTab("evidence")}
                    className="text-[10px] font-black uppercase tracking-widest pb-1 transition-all"
                    style={{ color: messagesTab === "evidence" ? '#3b82f6' : 'rgba(255,255,255,0.3)', borderBottom: messagesTab === "evidence" ? '2px solid #3b82f6' : '2px solid transparent' }}>
                    Evidence ({evidence.length})
                  </button>
                </div>

                {/* Messages Tab */}
                {messagesTab === "messages" && (
                  <div className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto space-y-3">
                      {messages.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>No messages yet.</p>
                      ) : messages.map((m: any) => (
                        <div key={m.id} className={`flex gap-3 ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                          <div className="max-w-[80%] p-4 rounded-2xl" style={{
                            background: m.is_admin_reply ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                            border: m.is_admin_reply ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.message}</p>
                            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {m.is_admin_reply ? "Admin" : m.senderName || "User"} · {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a reply..."
                        onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                        className="flex-1 outline-none rounded-2xl py-3 px-5 text-sm transition-all"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }} />
                      <button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}
                        className="px-5 py-3 rounded-2xl transition-all disabled:opacity-50 text-white"
                        style={{ background: '#3b82f6' }}>
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Evidence Tab */}
                {messagesTab === "evidence" && (
                  <div>
                    {evidence.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>No evidence uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {evidence.map((ev: any) => (
                          <div key={ev.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{ev.file_type}</span>
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/disputes/${selectedDispute.id}/evidence/${ev.id}/file`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                              view
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 rounded-[3rem] border border-dashed"
              style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <ShieldAlert className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Resolution Console</h3>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Select a dispute from the left panel to review evidence and issue refunds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
