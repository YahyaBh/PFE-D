import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#080C17] border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-white no-underline tracking-tight">
              MARJANE <span className="text-[#FFD700] italic font-normal">WALLET</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mt-4 max-w-xs">
              Morocco&apos;s most advanced digital wallet. Secure, instant, and built for everyday life.
            </p>
            <div className="flex gap-3 mt-5">
              {["X", "in", "ig", "fb"].map((s) => (
                <a key={s} href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-sm text-slate-500 hover:text-white hover:border-white/25 hover:scale-110 transition-all no-underline">{s}</a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 mb-5">Platform</h5>
            <div className="space-y-3">
              {["Features", "Pricing", "Security", "API"].map((l) => (
                <Link key={l} href="#" className="block text-sm text-slate-500 no-underline hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 mb-5">Company</h5>
            <div className="space-y-3">
              {["About", "Careers", "Press", "Blog"].map((l) => (
                <Link key={l} href="#" className="block text-sm text-slate-500 no-underline hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Legal + Payments */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50 mb-5">Legal</h5>
            <div className="space-y-3">
              {["Terms of Service", "Privacy Policy", "GDPR"].map((l) => (
                <Link key={l} href="#" className="block text-sm text-slate-500 no-underline hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-6 mb-4">
              {["VISA", "MC", "CIH", "CMI"].map((l) => (
                <span key={l} className="text-lg font-bold tracking-tight text-white/30 hover:text-white/90 transition-colors cursor-default">{l}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["MAD", "EUR", "USD", "GBP"].map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-500 hover:bg-white/[0.08] hover:text-white transition-colors cursor-default">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 pt-6 border-t border-white/[0.05] text-xs text-slate-500">
          <span>&copy; 2026 Marjane Wallet. All rights reserved.</span>
          <div className="flex gap-5">
            {["Status", "Support", "Contact"].map((l) => (
              <Link key={l} href="#" className="text-slate-500 no-underline hover:text-white transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
