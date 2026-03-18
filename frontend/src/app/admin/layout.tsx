"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  ArrowLeftRight, 
  Store, 
  Ticket, 
  Megaphone, 
  LayoutDashboard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  BookOpen,
  ShieldAlert
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface LedgerAccount {
  id: string;
  owner_id?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  ownerName?: string;
  ownerEmail?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/admin" },
    { name: "Users", icon: Users, href: "/admin/users" },
    { name: "Transactions", icon: ArrowLeftRight, href: "/admin/transactions" },
    { name: "Broadcast", icon: Megaphone, href: "/admin/broadcast" },
    { name: "Audit Logs", icon: ShieldCheck, href: "/admin/audit" },
    { name: "General Ledger", icon: BookOpen, href: "/admin/ledger" },
    { name: "Disputes", icon: ShieldAlert, href: "/admin/disputes" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900/50 backdrop-blur-3xl border-r border-slate-800 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 p-2">
                <img src="/Marjane-logo.png" alt="Marjane" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Admin</h1>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Control Center</p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-8 pt-0">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all group border border-slate-800/50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-sm">Exit Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-medium">
               <LayoutDashboard className="w-4 h-4" />
               <span>Dashboard</span>
               <ChevronRight className="w-3 h-3 opacity-30" />
               <span className="text-white capitalize">{pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global search..." 
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all w-64"
                />
             </div>
             <button className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-400 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900" />
             </button>
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-inner">
                AD
             </div>
          </div>
        </header>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
