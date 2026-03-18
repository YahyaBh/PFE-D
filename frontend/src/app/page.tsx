import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/ui/Hero";
import FeatureGrid from "@/components/ui/FeatureGrid";
import Footer from "@/components/ui/Footer";
import { ArrowRight, ShieldCheck, Zap, Heart } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        <FeatureGrid />

        {/* Call to Action Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3 origin-right" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl lg:text-7xl font-display font-black text-foreground mb-8 tracking-tighter leading-none">
              Ready to Upgrade <br />
              <span className="text-primary">Your Wallet?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Join 250,000+ Moroccans who trust Marjane Wallet for their daily essentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/register" className="px-10 py-6 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg">
                Create Account <ArrowRight className="w-6 h-6" />
              </Link>
              <button className="px-10 py-6 bg-card border border-border text-foreground font-bold rounded-3xl hover:bg-muted transition-all flex items-center justify-center gap-3">
                Watch Demo
              </button>
            </div>
            
            <div className="mt-20 flex flex-wrap justify-center gap-12 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="text-2xl font-black tracking-tighter text-foreground">VISA</span>
              <span className="text-3xl font-black tracking-tighter text-foreground uppercase italic font-display">Marjane</span>
              <span className="text-2xl font-black tracking-tighter text-foreground uppercase">Mastercard</span>
              <span className="text-2xl font-black tracking-tighter text-foreground">MoroccoPay</span>
            </div>
          </div>
        </section>

        {/* Security Banner */}
        <section className="py-16 border-y border-border bg-card/10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h4 className="text-foreground font-bold tracking-tight font-display">Bank-Grade Security</h4>
                <p className="text-muted-foreground text-sm italic">All transactions are encrypted with 256-bit SSL.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-bold tracking-tight font-display">Real-time Fraud Detection</h4>
                <p className="text-muted-foreground text-sm">AI-powered security protecting your assets 24/7.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h4 className="text-foreground font-bold tracking-tight font-display">Customer Satisfaction</h4>
                <p className="text-muted-foreground text-sm">Dedicated support for your financial peace of mind.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
