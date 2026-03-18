"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  QrCode, 
  History, 
  ArrowLeftRight, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Store,
  Bell,
  Search,
  ChevronDown,
  User,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchantName, setMerchantName] = useState("Loading Business...");

  const navItems = [
    { name: "Sales Overview", icon: LayoutDashboard, href: "/merchant/dashboard" },
    { name: "My QR Code", icon: QrCode, href: "/merchant/qr" },
    { name: "Transactions", icon: History, href: "/merchant/history" },
    { name: "Settlements", icon: ArrowLeftRight, href: "/merchant/settlements" },
  ];

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/merchant/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMerchantName(data.merchant.merchantName);
            } else {
                router.push("/dashboard"); // No merchant access
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-500">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter italic text-foreground">MARJANE</h1>
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest leading-none">Merchant Hub</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-border">
             <button
               onClick={() => router.push("/dashboard")}
               className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-2xl transition-all"
             >
               <User className="w-5 h-5" />
               Switch to Personal
             </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-2 w-80">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                    placeholder="Search payouts, transactions..." 
                    className="bg-transparent border-none text-xs focus:ring-0 placeholder-muted-foreground/50 w-full text-foreground"
                />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-muted rounded-xl transition-all">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </button>
            <div className="h-8 w-[1px] bg-border" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground leading-none">{merchantName}</p>
                <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mt-1">Authorized Owner</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-[1px]">
                  <div className="w-full h-full rounded-[11px] bg-card flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
