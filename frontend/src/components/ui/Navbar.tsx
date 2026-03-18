"use client";

import Link from "next/link";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-4 bg-background border-b-4 border-primary shadow-[0_4px_0_0_rgba(0,0,0,0.05)]" : "py-8 bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <ShieldCheck className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-display font-black text-3xl tracking-tighter text-foreground uppercase leading-none">
            MARJANE <span className="text-secondary italic">WALLET</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          {["Features", "Cards", "Payments", "Security"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors font-display">
              {item}
            </Link>
          ))}
          <div className="h-6 w-[2px] bg-foreground/10 mx-2" />
          <Link href="/login" className="text-xs font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors font-display">
            Sign In
          </Link>
          <Link href="/register" className="px-10 py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-none border-2 border-primary hover:bg-background hover:text-primary transition-all active:translate-x-1 active:translate-y-1 font-display shadow-[4px_4px_0px_0px_rgba(22,73,141,1)]">
            Open Wallet
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-foreground p-2 border-2 border-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b-4 border-primary p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300">
          {["Features", "Cards", "Payments", "Security"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-2xl font-black uppercase tracking-tighter text-foreground font-display" onClick={() => setMobileMenuOpen(false)}>
              {item}
            </Link>
          ))}
          <Link href="/login" className="text-2xl font-black uppercase tracking-tighter text-primary border-t-2 border-foreground/5 pt-8 font-display" onClick={() => setMobileMenuOpen(false)}>
            Sign In
          </Link>
          <Link href="/register" className="w-full py-6 bg-primary text-white text-center font-black uppercase tracking-widest rounded-none font-display shadow-[4px_4px_0_0_rgba(0,0,0,1)]" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
