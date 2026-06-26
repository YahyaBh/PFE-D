"use client";

import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/ui/Hero";
import Footer from "@/components/ui/Footer";
import ClientAnimations from "@/components/ui/ClientAnimations";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#080C17", color: "#fff" }}>
      <div id="page-spotlight" />
      <Navbar />
      <Hero />

      <div className="section-divider" />
      <section id="trust" className="trust-bar">
            {["VISA", "Mastercard", "CIH Bank", "CMI", "Marjane"].map((b) => (
              <span key={b} className="trust-logo">{b}</span>
            ))}
          </section>

          <div className="section-divider" />

          <section id="showcase" className="section-hidden" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <h2 className="text-[clamp(32px,5vw,64px)] tracking-[-.02em] leading-none mb-12">
              Everything You <span style={{ color: "#FFD700", fontWeight: 300 }}>Need.</span>
            </h2>
            <div className="showcase-grid">
              <div className="showcase-main">
                <div className="glow" />
                <h3 className="text-2xl font-semibold mb-6 tracking-tight">Full Wallet Control</h3>
                <div className="chart-svg">
                  <svg viewBox="0 0 400 60" width="100%" height="100%">
                    <polyline points="0,50 40,45 80,30 120,35 160,20 200,25 240,10 280,15 320,5 360,8 400,12" id="chart-line" />
                  </svg>
                </div>
                <div id="tx-list" className="flex flex-col gap-2">
                  {[
                    { icon: "↓", c: "rgba(0,200,83,.12)", tc: "#00c853", name: "Salary Deposit", date: "Today, 09:24", amt: "+12,400 MAD", ac: "#00c853" },
                    { icon: "*", c: "rgba(255,215,0,.12)", tc: "#FFD700", name: "Loyalty Bonus", date: "Today, 08:15", amt: "+350 MAD", ac: "#FFD700" },
                    { icon: "↑", c: "rgba(255,82,82,.12)", tc: "#ff5252", name: "Groceries - Marjane", date: "Yesterday, 18:42", amt: "-1,280 MAD", ac: "#ff5252" },
                    { icon: "◉", c: "rgba(0,102,255,.12)", tc: "#0066FF", name: "Card Top-up", date: "Yesterday, 10:30", amt: "+5,000 MAD", ac: "#0066FF" },
                  ].map((tx, i) => (
                    <div key={i} className="tx-item">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ background: tx.c, color: tx.tc }}>{tx.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{tx.name}</div>
                        <div className="text-[10px]" style={{ color: "#64748B" }}>{tx.date}</div>
                      </div>
                      <div className="text-[13px] font-semibold tracking-tight" style={{ color: tx.ac }}>{tx.amt}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="showcase-side">
                <div className="showcase-card">
                  <div className="nfc-waves"><div className="nfc-wave" /><div className="nfc-wave" /><div className="nfc-wave" /></div>
                  <h4 className="text-base font-semibold mb-3 tracking-tight">NFC Payments</h4>
                  <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6 }}>Tap your phone at any checkout — instant, contactless, secure. No wallet needed.</p>
                </div>
                <div className="showcase-card" style={{ borderColor: "rgba(255,215,0,.15)" }}>
                  <div className="coin-spin">🪙</div>
                  <h4 className="text-base font-semibold mb-3 tracking-tight">Loyalty Rewards</h4>
                  <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6 }}>Every purchase earns points. 100 pts = 10 MAD credit, auto-applied.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          <section id="features-grid" className="section-hidden" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <h2 className="text-[clamp(32px,5vw,64px)] tracking-[-.02em] leading-none text-center mb-4">
              Every Feature, <span style={{ color: "#FFD700", fontWeight: 300 }}>Built In.</span>
            </h2>
            <p className="text-center text-base mb-12" style={{ color: "#94A3B8" }}>No add-ons, no upgrades needed. Everything included from day one.</p>
            <div className="feature-grid-3x2">
              {[
                { icon: "💳", title: "Virtual Cards", desc: "Instant virtual card generation for secure online payments with custom limits." },
                { icon: "↔", title: "P2P Transfers", desc: "Send money to any Marjane member instantly — no fees, no delays." },
                { icon: "📱", title: "QR Payments", desc: "Pay or collect with a QR code. Works anywhere, even offline." },
                { icon: "📡", title: "NFC Tap-to-Pay", desc: "Tap your phone at any checkout — contactless payments in seconds." },
                { icon: "⭐", title: "Loyalty Rewards", desc: "Every purchase earns points. 100 pts = 10 MAD credit, auto-applied." },
                { icon: "🌍", title: "Multi-Currency", desc: "Hold and transact in MAD, EUR, USD. Exchange at live rates." },
              ].map((f, i) => (
                <div key={i} className="feat-card">
                  <div className="feat-icon">{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="section-divider" />

          <section id="onboarding" className="section-hidden" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <div className="onboarding-grid">
              <div>
                <h2 className="text-[clamp(32px,5vw,64px)] tracking-[-.02em] leading-none mb-4">
                  Up &amp; Running <br /><span style={{ color: "#FFD700", fontWeight: 300 }}>in 5 Minutes.</span>
                </h2>
                <p className="text-base mb-8 max-w-md" style={{ color: "#94A3B8", lineHeight: 1.6 }}>No bank visit, no paperwork. Your wallet is ready before your next Marjane run.</p>
                <Link
                  href="/register"
                  className="relative overflow-hidden inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full text-[15px] font-semibold no-underline mb-4"
                  style={{ background: "linear-gradient(135deg,#FFD700,#FFE135)", color: "#080C17" }}
                >
                  Start Now <span style={{ display: "inline-block", transition: "transform .35s cubic-bezier(.34,1.56,.64,1)" }}>→</span>
                </Link>
              </div>
              <div className="timeline">
                <div className="line-fill" />
                {[
                  { num: "1", title: "📷 Verify Your Identity", desc: "Upload your CIN and complete a quick Face ID scan. Verified in under 2 minutes." },
                  { num: "2", title: "💰 Add Funds", desc: "Deposit via bank transfer, in-store at Marjane, or from any debit card." },
                  { num: "3", title: "✅ Pay, Transfer & Earn", desc: "Pay via QR or NFC anywhere. Send money instantly. Earn loyalty points every purchase." },
                ].map((s, i) => (
                  <div key={i} className="timeline-step">
                    <div className="tl-num">{s.num}</div>
                    <div className="tl-content">
                      <h4 className="text-[15px] font-semibold mb-1.5">{s.title}</h4>
                      <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="section-divider" />

          <section id="security" className="security-sect section-hidden" style={{ padding: "120px 24px" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
              <div className="flex items-start gap-6 mb-12">
                <div>
                  <h2 className="text-[clamp(36px,5vw,72px)] tracking-[-.02em] leading-none">
                    <span style={{ display: "block", fontWeight: 800, color: "#fff" }}>YOUR MONEY.</span>
                    <span style={{ display: "block", fontWeight: 300, color: "#FFD700" }}>LOCKED TIGHT.</span>
                  </h2>
                </div>
                <span className="text-5xl mt-2 inline-block lock-icon" id="lock-icon" style={{ transition: "transform .5s cubic-bezier(.34,1.56,.64,1)" }}>🔒</span>
              </div>
              <div className="security-grid mb-10">
                {[
                  { icon: ShieldCheck, title: "256-bit SSL", desc: "End-to-end encryption on all data and transactions.", cls: "blue" },
                  { icon: CheckCircle2, title: "Biometric Auth", desc: "Biometric authentication for every sensitive action.", cls: "green" },
                  { icon: Lock, title: "AI Fraud Detection", desc: "Real-time ML models flagging suspicious patterns 24/7.", cls: "purple" },
                  { icon: ShieldCheck, title: "2-Factor MFA", desc: "Every login protected with a one-time code.", cls: "gold-b" },
                ].map((c, i) => (
                  <div key={i} className={`sec-card ${c.cls}`}>
                    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <c.icon className="w-7 h-7" style={{ color: c.cls === "blue" ? "#0066FF" : c.cls === "green" ? "#10B981" : c.cls === "purple" ? "#8B5CF6" : "#FFD700" }} />
                    </div>
                    <h4 className="text-[15px] font-semibold mb-2">{c.title}</h4>
                    <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.5 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
              <div className="compliance-badges">
                {["PCI-DSS Compliant", "ISO 27001", "MAD Regulated"].map((b) => (
                  <span key={b} className="compliance-badge">✓ {b}</span>
                ))}
              </div>
            </div>
          </section>

          <div className="section-divider" />

          <section id="stats-bar" className="section-hidden" style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                <div className="stats-container">
                  {[
                    { val: "250K+", label: "Active Members", gold: false },
                    { val: "15.4B MAD", label: "Total Processed", gold: true },
                    { val: "99.99%", label: "Platform Uptime", gold: false },
                    { val: "4.9/5", label: "Member Rating", gold: false },
                  ].map((s, i) => (
                    <div key={i} className="stat-item">
                      <div className={`stat-val ${s.gold ? "gold" : "white"}`}>{s.val}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="section-divider" />

              <section id="testimonials" className="section-hidden" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                <h2 className="text-[clamp(28px,4vw,48px)] tracking-[-.02em] leading-none mb-12">
                  Real Members. <span style={{ color: "#FFD700", fontWeight: 300 }}>Real Results.</span>
                </h2>
                <div className="test-grid">
                  {[
                    { initial: "K", name: "Khaoula Benali", role: "Marjane Ain Sebaa — 1 year", quote: "I loaded my wallet at Marjane Casablanca and paid for my whole cart via NFC. Took 5 seconds. Never going back to cash." },
                    { initial: "M", name: "Mehdi Alaoui", role: "Marjane Maârif — 8 months", quote: "The loyalty rewards are actually worth it. I earned 400 MAD credit just from my monthly shopping. Zero effort required." },
                    { initial: "S", name: "Sanae El Fassi", role: "Marjane Rabat — 6 months", quote: "Sent 2000 MAD to my sister in Fès in 2 seconds. Free. No bank required. This is the future of money in Morocco." },
                  ].map((t, i) => (
                    <div key={i} className="test-card">
                      <div className="test-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className="star" style={{ color: "#FFD700", fontSize: "16px" }}>★</span>
                        ))}
                      </div>
                      <p className="test-quote">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                        <div className="test-avatar" style={{ background: "rgba(255,215,0,.15)", color: "#FFD700" }}>
                          {t.initial}
                          <svg className="test-avatar-ring" viewBox="0 0 46 46"><circle cx="23" cy="23" r="20" /></svg>
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold">{t.name}</div>
                          <div style={{ color: "#64748B", fontSize: "11px" }}>{t.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="section-divider" />

              <section id="cta" className="section-hidden" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                <div className="cta-container">
                  <div className="cta-mesh">
                    <div className="cta-orb blue" />
                    <div className="cta-orb gold" />
                  </div>
                  <div className="cta-content">
                    <h2 className="text-[clamp(36px,5vw,72px)] tracking-[-.02em] leading-none mb-4">
                      Start Using Marjane Wallet<br />
                      <span className="cta-shimmer" style={{ color: "#FFD700", fontWeight: 300 }}>Today — For Free.</span>
                    </h2>
                    <p style={{ color: "#94A3B8", fontSize: "16px", marginBottom: "32px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                      No monthly fees. No minimum balance. Open your wallet in 5 minutes.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      <Link
                        href="/register"
                        className="relative overflow-hidden inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-[15px] font-semibold no-underline"
                        style={{ background: "linear-gradient(135deg,#FFD700,#FFE135)", color: "#080C17" }}
                      >
                        Create Account <span style={{ display: "inline-block", transition: "transform .35s cubic-bezier(.34,1.56,.64,1)" }}>→</span>
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-[15px] font-semibold no-underline"
                        style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)" }}
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <div className="section-divider" />

      <Footer />
      <ClientAnimations />
    </div>
  );
}
