"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Store, ArrowLeft, Building2, Tag, FileText, Loader2, CheckCircle2,
  ArrowRight, Clock, AlertCircle, Shield
} from "lucide-react";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function MerchantOnboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/merchant/onboarding", { name: name.trim(), description: description.trim(), category: category || undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {submitted ? (
        <div className="text-center py-16 space-y-8 animate-in fade-in duration-700">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <CheckCircle2 className="w-12 h-12" style={{ color: '#22c55e' }} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tighter text-white">Application Submitted</h2>
            <p className="max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Your merchant application for <span className="font-black" style={{ color: '#FFD700' }}>{name}</span> is under review. We'll notify you once approved.
            </p>
          </div>
          <div 
            className="flex items-center gap-3 justify-center rounded-2xl px-6 py-4 max-w-md mx-auto"
            style={{ 
              color: '#d97706',
              background: 'rgba(217,119,6,0.1)',
              border: '1px solid rgba(217,119,6,0.2)'
            }}
          >
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">Review typically takes 24-48 hours</span>
          </div>
          <button
            onClick={() => router.push("/merchant/dashboard")}
            className="px-10 py-4 text-black font-black rounded-2xl transition-all"
            style={{ 
              background: '#FFD700',
              boxShadow: '0 0 20px rgba(255,215,0,0.2)'
            }}
          >
            View Dashboard
          </button>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
              <Store className="w-8 h-8" style={{ color: '#FFD700' }} />
              Become a Merchant
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Register your business to accept payments through Marjane Wallet.</p>
          </div>

          {error && (
            <div 
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ 
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#dc2626'
              }}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="rounded-[2.5rem] p-8 md:p-12 space-y-8"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Building2 className="w-4 h-4" style={{ color: '#FFD700' }} /> Business Name *
              </label>
              <input
                required
                type="text"
                className="w-full rounded-2xl py-4 px-6 font-bold text-lg outline-none"
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#ffffff'
                }}
                placeholder="Your Business Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <FileText className="w-4 h-4" style={{ color: '#FFD700' }} /> Description
              </label>
              <textarea
                className="w-full rounded-2xl py-4 px-6 font-medium text-sm outline-none resize-none min-h-[100px]"
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#ffffff'
                }}
                placeholder="Tell us about your business..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Tag className="w-4 h-4" style={{ color: '#FFD700' }} /> Category
              </label>
              <select
                className="w-full rounded-2xl py-4 px-6 font-bold outline-none appearance-none"
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#ffffff'
                }}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="RETAIL">Retail</option>
                <option value="FOOD">Food & Beverage</option>
                <option value="SERVICES">Services</option>
                <option value="TECHNOLOGY">Technology</option>
                <option value="HEALTH">Health & Wellness</option>
                <option value="EDUCATION">Education</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-5 disabled:opacity-50 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
              style={{ 
                background: '#FFD700',
                boxShadow: '0 0 20px rgba(255,215,0,0.2)'
              }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Submit Application</>}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
