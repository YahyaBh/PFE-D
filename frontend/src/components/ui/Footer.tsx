import Link from "next/link";
import { ShieldCheck, Twitter, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card pt-24 pb-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-black text-xl tracking-tighter text-foreground font-display">
                MARJANE <span className="text-primary italic">WALLET</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed mb-8 font-sans">
              The ultimate digital financial companion for Marjane customers. 
              Secure, fast, and rewards-backed payments for every day.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary transition-colors hover:text-white text-muted-foreground">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-6 font-display">Platform</h4>
            <ul className="space-y-4">
              {["Digital Cards", "P2P Transfers", "NFC Payments", "Loyalty Rewards"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-sans">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-6 font-display">Company</h4>
            <ul className="space-y-4">
              {["About Marjane", "Security First", "Terms of Service", "Privacy Policy"].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-sans">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground/60 text-[10px] tracking-wider uppercase font-semibold font-display">
            © 2026 MARJANE HOLDING. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <button className="text-[9px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors tracking-[0.2em] uppercase font-display">Status: Operational</button>
            <button className="text-[9px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors tracking-[0.2em] uppercase font-display">Global v1.0.4</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
