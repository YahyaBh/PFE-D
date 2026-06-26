import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-dark" style={{ padding: "80px 24px 32px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      <div className="footer-grid" style={{ marginBottom: "48px" }}>
        {/* Brand */}
        <div className="footer-brand-col">
          <Link href="/" style={{ fontSize: "20px", fontWeight: 700, color: "#fff", textDecoration: "none", letterSpacing: "-.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            MARJANE <span style={{ color: "#FFD700", fontWeight: 400, fontStyle: "italic" }}>WALLET</span>
          </Link>
          <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6, marginTop: "16px", maxWidth: "300px" }}>
            Morocco&apos;s most advanced digital wallet. Secure, instant, and built for everyday life.
          </p>
          <div className="footer-social" style={{ marginTop: "20px" }}>
            {["X", "in", "ig", "fb"].map((s) => (
              <a key={s} href="#">{s}</a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="footer-col">
          <h5>Platform</h5>
          {["Features", "Pricing", "Security", "API"].map((l) => (
            <Link key={l} href="#">{l}</Link>
          ))}
        </div>

        {/* Company */}
        <div className="footer-col">
          <h5>Company</h5>
          {["About", "Careers", "Press", "Blog"].map((l) => (
            <Link key={l} href="#">{l}</Link>
          ))}
        </div>

        {/* Legal + Payments */}
        <div className="footer-col">
          <h5>Legal</h5>
          {["Terms of Service", "Privacy Policy", "GDPR"].map((l) => (
            <Link key={l} href="#">{l}</Link>
          ))}
          <div className="footer-pay-logos" style={{ marginTop: "20px", marginBottom: "16px" }}>
            {["VISA", "MC", "CIH", "CMI"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="currency-tags">
            {["MAD", "EUR", "USD", "GBP"].map((c) => (
              <span key={c} className="currency-tag">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.05)", fontSize: "13px", color: "#64748B" }}>
        <span>&copy; 2026 Marjane Wallet. All rights reserved.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          {["Status", "Support", "Contact"].map((l) => (
            <Link key={l} href="#" style={{ color: "#64748B", textDecoration: "none", transition: "color .3s" }}>{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
