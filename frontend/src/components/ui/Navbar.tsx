"use client";

import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard, User, LogOut, ChevronDown, Gift, Store } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Features", href: "#showcase" },
    { name: "Security", href: "#security" },
    { name: "Developers", href: "#" },
  ];

  const navClass = [
    "rounded-full px-8 h-20 flex items-center justify-between",
    isScrolled
      ? "bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-foreground/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
      : "bg-white/10 backdrop-blur-2xl border border-white/[0.15]",
  ].join(" ");

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-6xl">
      <div className={navClass}>
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 hover:scale-110 hover:rotate-12 transition-all duration-500 shadow-lg border border-foreground/5">
            <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
          </div>
          <span className={`font-display font-black text-lg tracking-tight uppercase leading-none ${isScrolled ? "text-foreground" : "text-white"}`}>
            MARJANE <span className={`italic ${isScrolled ? "text-primary" : "text-white/80"}`}>WALLET</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative text-[10px] font-black uppercase tracking-[0.3em] ${isScrolled ? "text-foreground/40 hover:text-foreground" : "text-white/50 hover:text-white"} transition-colors duration-300 group`}
            >
              {link.name}
              <span className="absolute -bottom-[2px] left-1/2 w-[4px] h-[4px] rounded-full bg-[#FFD700] -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-300" />
            </Link>
          ))}

          <div className="h-6 w-[1px] bg-foreground/10 mx-2" />

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ${isScrolled ? "text-foreground hover:text-primary" : "text-white/70 hover:text-white"} transition-colors`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isScrolled ? "bg-foreground/5 hover:bg-foreground/10 text-foreground/60" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Account
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-white dark:bg-card rounded-[2rem] shadow-2xl border border-foreground/5 overflow-hidden origin-top-right">
                    <div className="py-2">
                      <Link href="/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-4 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link href="/dashboard" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-4 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/rewards" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-4 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                        <Gift className="w-4 h-4" /> Rewards
                      </Link>
                      <Link href="/merchant/onboarding" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-4 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                        <Store className="w-4 h-4" /> Become a Merchant
                      </Link>
                    </div>
                    <div className="h-[1px] bg-foreground/5 mx-6" />
                    <div className="py-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-4 px-8 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-[11px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className={`relative text-[10px] font-black uppercase tracking-[0.3em] ${isScrolled ? "text-foreground/60 hover:text-primary" : "text-white/60 hover:text-white"} transition-colors`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-8 py-3.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                Open Wallet
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground transition-all active:scale-90"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-0 right-0 bg-white/98 dark:bg-card/98 backdrop-blur-2xl rounded-[2.5rem] p-8 flex flex-col gap-4 shadow-2xl border border-foreground/5 origin-top">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center justify-between px-2 py-3 text-xl font-black uppercase tracking-tighter text-foreground/80 hover:text-primary rounded-2xl hover:bg-foreground/5 transition-colors group"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
            </Link>
          ))}
          <div className="h-[1px] bg-foreground/5 my-2" />
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="px-2 py-3 text-lg font-black uppercase tracking-widest text-primary rounded-2xl hover:bg-primary/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/rewards" className="px-2 py-3 text-lg font-black uppercase tracking-widest text-foreground/70 rounded-2xl hover:bg-foreground/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Rewards</Link>
              <Link href="/merchant/onboarding" className="px-2 py-3 text-lg font-black uppercase tracking-widest text-foreground/70 rounded-2xl hover:bg-foreground/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Become a Merchant</Link>
              <Link href="/profile" className="px-2 py-3 text-lg font-black uppercase tracking-widest text-foreground/70 rounded-2xl hover:bg-foreground/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="px-2 py-3 text-lg font-black uppercase tracking-widest text-red-400 hover:text-red-500 text-left rounded-2xl hover:bg-red-900/10 transition-colors">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-3 text-lg font-black uppercase tracking-widest text-foreground/60 rounded-2xl hover:bg-foreground/5 transition-colors" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/register" className="mt-2 w-full py-5 bg-primary text-white text-center font-black uppercase tracking-widest rounded-full shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
