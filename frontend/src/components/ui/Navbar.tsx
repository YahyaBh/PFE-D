"use client";

import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard, User, LogOut, ChevronDown, Gift, Store } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check auth state from localStorage
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

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
    "rounded-full px-8 h-20 flex items-center justify-between transition-all duration-700",
    "shadow-[0_20px_50px_rgba(0,0,0,0.08)]",
    isScrolled
      ? "bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-foreground/10"
      : "bg-white/10 backdrop-blur-2xl border border-white/[0.15]",
  ].join(" ");

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-6xl transition-all duration-700">
      <div className={navClass}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg border border-foreground/5">
            <img loading="lazy" src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
          </div>
          <span className={`font-display font-black text-lg tracking-tight uppercase leading-none ${isScrolled ? "text-foreground" : "text-white"}`}>
            MARJANE <span className={`italic ${isScrolled ? "text-primary" : "text-white/80"}`}>WALLET</span>
          </span>
        </Link>

        {/* Desktop Nav */}
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
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isScrolled ? "bg-foreground/5 hover:bg-foreground/10 text-foreground/60" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Account
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-white dark:bg-card rounded-[2rem] shadow-2xl border border-foreground/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                    <Link href="/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-5 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link href="/dashboard" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-5 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/rewards" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-5 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-secondary">
                      <Gift className="w-4 h-4" /> Rewards
                    </Link>
                    <Link href="/merchant/onboarding" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-4 px-8 py-5 hover:bg-foreground/5 transition-colors text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-primary">
                      <Store className="w-4 h-4" /> Become a Merchant
                    </Link>
                    <div className="h-[1px] bg-foreground/5 mx-6" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-[11px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className={`text-[10px] font-black uppercase tracking-[0.3em] ${isScrolled ? "text-foreground/60 hover:text-primary" : "text-white/60 hover:text-white"} transition-colors`}
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

        {/* Mobile Toggle */}
        <button
          className="md:hidden w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground transition-all active:scale-90"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-0 right-0 bg-white/98 dark:bg-card/98 backdrop-blur-2xl rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-2xl border border-foreground/5 animate-in zoom-in-95 duration-300 origin-top">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center justify-between group"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
              <ArrowRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
            </Link>
          ))}
          <div className="h-[1px] bg-foreground/5 my-2" />
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-xl font-black uppercase tracking-widest text-primary" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/rewards" className="text-xl font-black uppercase tracking-widest text-secondary" onClick={() => setMobileMenuOpen(false)}>Rewards</Link>
              <Link href="/merchant/onboarding" className="text-xl font-black uppercase tracking-widest text-foreground/60" onClick={() => setMobileMenuOpen(false)}>Become a Merchant</Link>
              <Link href="/profile" className="text-xl font-black uppercase tracking-widest text-foreground/60" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="text-xl font-black uppercase tracking-widest text-red-500 text-left">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xl font-black uppercase tracking-widest text-foreground/60" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/register" className="w-full py-5 bg-primary text-white text-center font-black uppercase tracking-widest rounded-full shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
