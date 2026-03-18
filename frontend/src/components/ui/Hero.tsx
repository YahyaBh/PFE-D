import Link from "next/link";
import { ArrowRight, Wallet, Shield, Zap } from "lucide-react";
import WalletCard from "../Wallet/WalletCard";

export default function Hero() {
  return (
    <section className="relative pt-48 pb-32 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-start gap-12">
          <div className="animate-in slide-in-from-left duration-700">
            <div className="inline-block py-2 px-4 bg-secondary border-2 border-foreground mb-12 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground font-display">Contactless NFC Enabled // v2.0</span>
            </div>
            
            <h1 className="text-[12vw] lg:text-[10rem] font-display font-black text-foreground uppercase leading-[0.8] mb-12 tracking-tighter">
              PAY <br />
              <span className="text-secondary">INSTANT.</span>
            </h1>
            
            <div className="grid lg:grid-cols-2 gap-16 items-start w-full">
              <div className="max-w-md">
                <p className="text-xl text-foreground font-black uppercase tracking-tight mb-12 leading-tight font-sans">
                  Marjane Wallet: A structural evolution in digital finance. No fluff. Total security. Designed for the Moroccan elite.
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href="/register" className="px-12 py-6 bg-primary text-white font-black uppercase tracking-widest border-2 border-primary hover:bg-background hover:text-primary transition-all active:translate-x-1 active:translate-y-1 shadow-[8px_8px_0_0_rgba(22,73,141,1)] font-display text-xs">
                    Join The Elite
                  </Link>
                  <Link href="/login" className="px-12 py-6 bg-background text-foreground font-black uppercase tracking-widest border-2 border-foreground hover:bg-foreground hover:text-background transition-all active:translate-x-1 active:translate-y-1 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] font-display text-xs">
                    Member Portal
                  </Link>
                </div>

              </div>

              <div className="relative group lg:-mt-24">
                <div className="absolute inset-0 bg-secondary translate-x-4 translate-y-4 -z-10 border-2 border-foreground" />
                <div className="border-4 border-foreground shadow-[16px_16px_0_0_rgba(22,73,141,1)]">
                  <WalletCard 
                    balance={25480.50} 
                    currency="MAD" 
                    name="SOUFIANE" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full mt-24 border-t-4 border-foreground pt-12 grid grid-cols-2 lg:grid-cols-4 gap-12 text-foreground">
            {[
              { label: "Active Nodes", val: "250,000" },
              { label: "Uptime Sync", val: "99.99%" },
              { label: "Value Transferred", val: "15.4B" },
              { label: "Security Tier", val: "MIL-GRADE" }
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-foreground/10 pl-6">
                <p className="text-3xl font-black text-foreground mb-1 font-display uppercase italic">{stat.val}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-sans">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
