import { CreditCard, Smartphone, ShoppingBag, Gift, ArrowRightLeft, ShieldCheck } from "lucide-react";

export default function FeatureGrid() {
  const features = [
    {
      title: "PHYSICAL DIGITAL TOKENS",
      description: "INSTANT VIRTUAL CARD GENERATION FOR SECURE GLOBAL SETTLEMENTS.",
      icon: CreditCard,
      color: "blue",
      className: "md:col-span-2 md:row-span-2 bg-primary text-white shadow-[12px_12px_0_0_rgba(0,0,0,1)]",
      iconColor: "text-secondary"
    },
    {
      title: "NFC SYNC",
      description: "STRUCTURAL POS INTEGRATION AT ALL NODES.",
      icon: Smartphone,
      color: "gold",
      className: "md:col-span-1 md:row-span-1 bg-secondary text-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
      iconColor: "text-primary"
    },
    {
      title: "LOYALTY PROTOCOL",
      description: "100 UNITS = 10 MAD LIQUIDITY CREDIT.",
      icon: Gift,
      color: "blue",
      className: "md:col-span-1 md:row-span-1 bg-background text-foreground border-4 border-foreground shadow-[8px_8px_0_0_rgba(22,73,141,1)]",
      iconColor: "text-primary"
    },
    {
      title: "P2P SETTLEMENTS",
      description: "ZERO-LATENCY TRANSFERS ACROSS THE MARJANE ECOSYSTEM.",
      icon: ArrowRightLeft,
      color: "indigo",
      className: "md:col-span-2 md:row-span-1 bg-foreground text-background shadow-[12px_12px_0_0_rgba(251,230,10,1)]",
      iconColor: "text-secondary"
    }
  ];

  return (
    <section id="features" className="py-32 bg-background relative overflow-hidden border-t-8 border-foreground">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
          <div className="animate-in slide-up duration-700 max-w-2xl">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-6 font-display border-l-4 border-primary pl-4">Core Infrastructure // 01</h2>
            <h3 className="text-6xl lg:text-8xl font-display font-black text-foreground tracking-tighter uppercase leading-[0.8]">
              ENGINEERED FOR <span className="text-secondary">ELITE SCALE.</span>
            </h3>
          </div>
          <p className="text-xl font-black uppercase tracking-tight text-foreground max-w-sm mb-2">
            WE ARE STRIPPING AWAY THE DECORATIVE FLUFF TO REVEAL THE RAW POWER OF YOUR ASSETS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-12">
          {features.map((feature, i) => (
            <div 
              key={feature.title} 
              className={`p-12 border-4 border-foreground relative overflow-hidden group transition-all hover:-translate-x-1 hover:-translate-y-1 ${feature.className} animate-in slide-up duration-1000`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative z-10">
                <div className={`w-20 h-20 border-4 border-foreground flex items-center justify-center mb-12 bg-background shadow-[4px_4px_0_0_rgba(0,0,0,1)] group-hover:bg-secondary transition-colors`}>
                  <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
                </div>
                <h4 className="text-3xl font-display font-black mb-6 tracking-tighter uppercase">{feature.title}</h4>
                <p className="font-black text-xs uppercase tracking-widest leading-loose opacity-80">{feature.description}</p>
              </div>
              
              <div className="mt-12 flex items-center text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer">
                ACCESS MODULE <ShieldCheck className="w-4 h-4 ml-2" />
              </div>

              {/* Functional Corner */}
              <div className="absolute top-0 right-0 w-12 h-12 border-l-4 border-b-4 border-foreground opacity-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
