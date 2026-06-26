"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Calendar, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminProfile() {
  const [admin, setAdmin] = useState<any>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setAdmin(u);
        setName(u.name || "");
      } catch {}
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.patch("/profile", { name });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (admin) {
          const updated = { ...admin, name };
          localStorage.setItem("admin_user", JSON.stringify(updated));
          setAdmin(updated);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Profile</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage your admin account information</p>
      </div>

      <div className="rounded-2xl p-8 space-y-6" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
            {(admin.name || 'AD').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{admin.name || 'Admin'}</h2>
            <p className="text-sm" style={{ color: '#3b82f6' }}>Administrator</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748B' }}>
              {admin.email || '—'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
              <Shield className="w-3.5 h-3.5" /> Role
            </label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#3b82f6' }}>
              {admin.role || 'ROLE_ADMIN'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </label>
            <div className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748B' }}>
              {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#3b82f6', color: '#fff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
