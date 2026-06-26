"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function GridLines() {
  return (
    <div className="hero-grid" aria-hidden="true">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hg" x1="0" y1="1" x2=".5" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {[-200,0,200,400,600,800,1000,1200,1400].map((x,i) => (
          <line key={i} x1={x} y1="800" x2="540" y2="200" stroke="rgba(255,255,255,.04)" strokeWidth=".5" />
        ))}
        {[300,400,500,600,700].map((y,i) => (
          <line key={`c${i}`} x1="0" y1={y} x2="1200" y2={y} stroke={`rgba(255,255,255,${.02+i*.005})`} strokeWidth=".5" />
        ))}
      </svg>
    </div>
  );
}

function Orbs() {
  return (
    <>
      <div className="hero-orb hero-orb-blue" id="hero-orb-1" />
      <div className="hero-orb hero-orb-gold" id="hero-orb-2" />
    </>
  );
}

function Particles() {
  return (
    <div id="hero-particles" aria-hidden="true" />
  );
}

function Spotlight() {
  return <div className="hero-spotlight" id="hero-spotlight" />;
}

function NFCIcon() {
  return (
    <svg className="nfc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 8a5 5 0 0 1 10 0M10 11a2 2 0 0 1 4 0" />
      <path d="M5 5a8 8 0 0 1 14 0M15 16l-3-3-3 3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <path d="M2 12h20" />
    </svg>
  );
}

interface HeroProps {
  onComplete?: () => void;
}

export default function Hero({ onComplete }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const odometerRef = useRef<HTMLDivElement>(null);
  const digitsRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardSTRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ---- Spotlight ----
    const spot = document.getElementById("hero-spotlight");
    let sx = 0, sy = 0, stx = 0, sty = 0;
    const onMouse = (e: MouseEvent) => { sx = e.clientX; sy = e.clientY; spot?.classList.add("visible"); };
    const onLeave = () => spot?.classList.remove("visible");
    document.addEventListener("mousemove", onMouse);
    document.addEventListener("mouseleave", onLeave);

    const tickSpot = () => {
      stx += (sx - stx) * 0.1;
      sty += (sy - sty) * 0.1;
      if (spot) spot.style.transform = `translate(${stx - 250}px, ${sty - 250}px)`;
      rafId = requestAnimationFrame(tickSpot);
    };
    let rafId = requestAnimationFrame(tickSpot);

    // ---- Orb Parallax ----
    const o1 = document.getElementById("hero-orb-1");
    const o2 = document.getElementById("hero-orb-2");
    let mx = 0, my = 0, o1x = 0, o1y = 0, o2x = 0, o2y = 0;
    const orbPath1: { x: number; y: number }[] = [];
    const orbPath2: { x: number; y: number }[] = [];
    for (let i = 0; i < 60; i++) {
      orbPath1.push({ x: Math.sin(i / 10) * 30 + Math.sin(i / 5) * 15, y: Math.cos(i / 8) * 25 + Math.sin(i / 6) * 10 });
      orbPath2.push({ x: Math.cos(i / 9) * 35 + Math.sin(i / 7) * 12, y: Math.sin(i / 11) * 28 + Math.cos(i / 5) * 14 });
    }
    let orbFrame = 0;

    const onMouseOrb = (e: MouseEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
    document.addEventListener("mousemove", onMouseOrb);

    const tickOrbs = () => {
      orbFrame++;
      const p1 = orbPath1[orbFrame % 60];
      const p2 = orbPath2[orbFrame % 60];
      o1x += (mx * -50 + p1.x - o1x) * 0.03;
      o1y += (my * -50 + p1.y - o1y) * 0.03;
      o2x += (mx * 40 + p2.x - o2x) * 0.03;
      o2y += (my * 40 + p2.y - o2y) * 0.03;
      if (o1) o1.style.transform = `translate(${o1x}px, ${o1y}px)`;
      if (o2) o2.style.transform = `translate(${o2x}px, ${o2y}px)`;
      requestAnimationFrame(tickOrbs);
    };
    const orbRaf = requestAnimationFrame(tickOrbs);

    // ---- Particles ----
    const pContainer = document.getElementById("hero-particles");
    if (pContainer) {
      const particles: HTMLDivElement[] = [];
      for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "hero-particle";
        const s = 1 + Math.random() * 1.5;
        p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${50 + Math.random() * 40}%;opacity:${0.15 + Math.random() * 0.25}`;
        pContainer.appendChild(p);
        particles.push(p);

        const dur = 10 + Math.random() * 12;
        const delay = Math.random() * 10;
        const phaseX = Math.random() * Math.PI * 2;
        const freqX = 0.5 + Math.random() * 1.5;
        const ampX = 20 + Math.random() * 40;

        gsap.to(p, {
          y: -200,
          opacity: 0,
          duration: dur,
          repeat: -1,
          delay,
          ease: "none",
          onUpdate: function () {
            const prog = this.progress();
            const driftX = Math.sin(prog * Math.PI * 2 * freqX + phaseX) * ampX + Math.sin(prog * Math.PI * 0.5 + phaseX * 0.7) * 15;
            p.style.transform = `translateX(${driftX}px)`;
          },
        });
      }
    }

    // ---- Card 3D Tilt ----
    const card = cardRef.current;
    const visual = visualRef.current;
    if (card && visual) {
      let cmx = 0.5, cmy = 0.5, tx = 0.5, ty = 0.5;

      const tickCard = () => {
        tx += (cmx - tx) * 0.08;
        ty += (cmy - ty) * 0.08;
        const rx = (ty - 0.5) * -24;
        const ry = (tx - 0.5) * 24;
        card.style.setProperty("--gx", String(0.3 + tx * 0.4));
        card.style.setProperty("--gy", String(0.3 + ty * 0.4));
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        requestAnimationFrame(tickCard);
      };
      const cardRaf = requestAnimationFrame(tickCard);

      visual.addEventListener("mousemove", (e) => {
        const r = visual.getBoundingClientRect();
        cmx = (e.clientX - r.left) / r.width;
        cmy = (e.clientY - r.top) / r.height;
        if (sheenRef.current) {
          sheenRef.current.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
          sheenRef.current.style.setProperty("--sy", `${((e.clientY - r.top) / r.height) * 100}%`);
        }
      });
      visual.addEventListener("mouseleave", () => { cmx = 0.5; cmy = 0.5; });
    }

    // ---- Magnetic Buttons ----
    document.querySelectorAll(".magnetic-btn").forEach((btn) => {
      const b = btn as HTMLElement;
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        const dist = Math.sqrt(x * x + y * y);
        if (dist < 30) {
          const pull = Math.min(dist / 30, 1) * 10;
          const a = Math.atan2(y, x);
          b.style.transform = `translate(${Math.cos(a) * pull}px, ${Math.sin(a) * pull * 0.5}px)`;
        }
      });
      b.addEventListener("mouseleave", () => { b.style.transform = "translate(0,0)"; });
    });

    // ---- GSAP Timeline ----
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2, onComplete: () => onComplete?.() });

      // Badge
      if (badgeRef.current) tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);

      // Title words: animate font-weight + reveal
      const wordSpans = document.querySelectorAll(".hero-title-word");
      wordSpans.forEach((el, i) => {
        tl.fromTo(
          el,
          { y: 80, opacity: 0, fontWeight: 200 },
          { y: 0, opacity: 1, fontWeight: 800, duration: 0.8, delay: i * 0.15, ease: "power2.out" },
          0.2
        );
      });

      // Gold underline
      tl.to(".gold-underline-bar", { width: "100%", duration: 0.6, ease: "power2.out" }, 1.1);

      // Subtitle
      if (subRef.current) tl.to(subRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.7);

      // CTAs
      if (ctaRef.current) tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 1.0);

      // Odometer
      const odEl = odometerRef.current;
      if (odEl) {
        const digits = String(24850).split("").map(Number);
        const odDigits: { el: HTMLDivElement; digit: number; idx: number }[] = [];
        odEl.innerHTML = "";

        digits.forEach((finalDigit, idx) => {
          const col = document.createElement("div");
          col.className = "od-digit";
          Object.assign(col.style, { width: "22px", height: "42px" });

          const strip = document.createElement("div");
          strip.className = "od-strip";
          for (let d = 0; d <= 9; d++) {
            const s = document.createElement("span");
            s.textContent = String(d);
            Object.assign(s.style, { height: "42px", width: "22px", fontSize: "36px", fontWeight: "700", letterSpacing: "-1.5px" });
            strip.appendChild(s);
          }
          const fs = document.createElement("span");
          fs.textContent = String(finalDigit);
          Object.assign(fs.style, { height: "42px", width: "22px", fontSize: "36px", fontWeight: "700", letterSpacing: "-1.5px" });
          strip.appendChild(fs);

          col.appendChild(strip);
          odEl.appendChild(col);
          odDigits.push({ el: strip, digit: finalDigit, idx });
        });

        tl.call(
          () => {
            odDigits.forEach(({ el, digit }) => {
              gsap.to(el, { y: -digit * 42, duration: 1.4, delay: 0.8 + digit * 0.02, ease: "power3.out" });
            });
          },
          undefined,
          1.6
        );
      }

      // Card digit reveal + Web Audio tick
      const dRef = digitsRef.current;
      if (dRef) {
        const spans = dRef.querySelectorAll("span");
        let audioCtx: AudioContext | null = null;
        spans.forEach((s, i) => {
          tl.to(
            s,
            {
              opacity: 1,
              duration: 0.02,
              ease: "none",
              onStart: () => {
                if (i % 2 !== 0) return;
                try {
                  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  osc.type = "sine";
                  osc.frequency.value = 1800;
                  gain.gain.value = 0.03;
                  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
                  osc.connect(gain);
                  gain.connect(audioCtx.destination);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 0.04);
                } catch { /* silent */ }
              },
            },
            2.6 + i * 0.04
          );
        });
      }

      // Stats staggered fly-in
      if (statsRef.current) {
        const statCards = statsRef.current.querySelectorAll(".stat-card-el");
        gsap.to(statCards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 2.2, ease: "power2.out" });

        const sv = [100, 99.99, 2.4, 250];
        const sd = [0, 2, 1, 0];
        const els = statCards as NodeListOf<HTMLElement>;
        els.forEach((el, i) => {
          const span = el.querySelector(".stat-num-inner") as HTMLElement | null;
          if (!span) return;
          if (i === 1) {
            const fullStr = "99.99";
            let j = 0;
            gsap.delayedCall(2.6 + i * 0.15, function tick() {
              if (j <= fullStr.length) {
                span!.textContent = fullStr.slice(0, j) + (j < fullStr.length ? "|" : "");
                j++;
                if (j <= fullStr.length) gsap.delayedCall(0.06, tick);
              }
            });
          } else {
            gsap.to(
              { v: 0 },
              {
                v: sv[i],
                duration: 1.5,
                delay: 2.8 + i * 0.12,
                ease: "power3.out",
                onUpdate: function () {
                  span!.textContent = Math.round(this.targets()[0].v).toLocaleString();
                },
              }
            );
          }
        });
      }

      // ScrollTrigger: card rotation on scroll
      cardSTRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=60vh",
        onUpdate: (self) => {
          const p = self.progress;
          if (card && p < 0.35) {
            const r = 15 - p * 42.85;
            card.style.transform = `rotateY(${Math.max(0, r)}deg)`;
          }
          const drift = p * 30;
          if (o1) o1.style.transform = `translate(${o1x - drift}px, ${o1y - drift}px)`;
          if (o2) o2.style.transform = `translate(${o2x + drift}px, ${o2y + drift * 0.7}px)`;
        },
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(orbRaf);
      document.removeEventListener("mousemove", onMouse);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousemove", onMouseOrb);
      cardSTRef.current?.kill();
    };
  }, []);

  const statData = [
    { icon: ShieldIcon, label: "Mil-Grade Security", cls: "animate-[shield-breathe_3s_ease-in-out_infinite]" },
    { icon: LightningIcon, label: "Uptime", cls: "animate-[l-flash_4s_ease_infinite]" },
    { icon: PhoneIcon, label: "NFC + QR Payments", cls: "animate-[tap-tilt_2s_ease-in-out_infinite]" },
    { icon: GlobeIcon, label: "Active Members", cls: "animate-[globe-spin_10s_linear_infinite]" },
  ];

  return (
    <section
      ref={sectionRef}
      className="hero-noise relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: "#0B0F1A", color: "#fff" }}
    >
      <Spotlight />
      <GridLines />
      <Orbs />
      <Particles />

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex-1 flex flex-col justify-center py-32 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ---- Left: Text ---- */}
          <div className="text-center lg:text-left">
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
              style={{
                background: "rgba(255,215,0,.08)",
                borderColor: "rgba(255,215,0,.15)",
                color: "rgba(255,215,0,.8)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: ".5px",
                textTransform: "uppercase",
                opacity: 0,
              }}
            >
              <span className="w-[6px] h-[6px] rounded-full bg-[#FFD700] animate-[pulse-dot_2s_ease-in-out_infinite]" />
              NEXT-GEN FINTECH
            </div>

            <h1 className="text-[clamp(36px,7vw,80px)] font-[200] leading-[.9] tracking-[-3px] mb-5">
              {["SMART", "PAYMENTS", "REIMAGINED"].map((word, i) => (
                <span key={word} className="block overflow-hidden" style={{ padding: "2px 0" }}>
                  <span
                    className="hero-title-word inline-block"
                    style={
                      i === 2
                        ? {
                            background: "linear-gradient(135deg,#FFD700,#FFE135)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }
                        : i === 1
                        ? { position: "relative", display: "inline-block" }
                        : undefined
                    }
                  >
                    {word === "PAYMENTS" ? <span className="gold-underline relative">{word}<span className="gold-underline-bar absolute bottom-[-2px] left-0 h-[1px] bg-[#FFD700] rounded" style={{ width: 0 }} /></span> : word}
                    {i === 2 ? (
                      <style jsx>{`
                        span {
                          animation: gold-glow 4s ease-in-out infinite;
                        }
                      `}</style>
                    ) : null}
                  </span>
                </span>
              ))}
            </h1>

            <p
              ref={subRef}
              className="text-base leading-relaxed max-w-md mx-auto lg:mx-0 mb-9"
              style={{ color: "#94A3B8", opacity: 0 }}
            >
              Experience borderless banking with instant transfers, virtual cards, and real-time loyalty rewards — all in one fluid ecosystem.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4 justify-center lg:justify-start" style={{ opacity: 0 }}>
              <Link
                href="/register"
                className="magnetic-btn relative overflow-hidden inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-[15px] font-semibold leading-none no-underline"
                style={{
                  background: "linear-gradient(135deg,#FFD700,#FFE135)",
                  color: "#0B0F1A",
                  cursor: "pointer",
                  transition: "box-shadow .3s, transform .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(255,215,0,.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
                id="btn-gs"
              >
                <span
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg,transparent,rgba(255,225,53,.35),transparent)",
                    transform: "translateX(-100%)",
                    transition: "transform .4s ease",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "translateX(100%)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "translateX(-100%)"; }}
                />
                Get Started
                <span className="inline-block transition-transform duration-[.4s]" style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}>→</span>
              </Link>

              <Link
                href="/login"
                className="magnetic-btn relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-[15px] font-semibold leading-none no-underline"
                style={{
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background .25s, border-color .25s, box-shadow .3s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,.05)";
                  el.style.borderColor = "rgba(255,255,255,.4)";
                  el.style.boxShadow = "0 0 24px rgba(255,255,255,.04)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.borderColor = "rgba(255,255,255,.15)";
                  el.style.boxShadow = "none";
                }}
                id="btn-si"
              >
                Sign In
                <span
                  className="absolute bottom-[14px] left-1/2 h-[1px] rounded-full pointer-events-none"
                  style={{
                    background: "#fff",
                    width: 0,
                    transition: "width .35s ease, left .35s ease",
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.width = "60%";
                    el.style.left = "20%";
                    el.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.width = "0";
                    el.style.left = "50%";
                    el.style.opacity = "0";
                  }}
                />
              </Link>
            </div>
          </div>

          {/* ---- Right: Card ---- */}
          <div ref={visualRef} className="hero-visual-wrap relative flex justify-center items-center" style={{ perspective: "1200px" }}>
            <div
              className="activity-peek"
              id="activity-peek"
            >
              <div className="flex flex-col gap-1.5" style={{ width: "200px" }}>
                {[
                  { avatar: "↓", color: "rgba(0,200,83,.15)", text: "#00c853", title: "From K. Benali", sub: "Just now", amt: "+840 MAD", cls: "pos" },
                  { avatar: "↑", color: "rgba(255,82,82,.15)", text: "#ff5252", title: "To M. Alaoui", sub: "2 min ago", amt: "-320 MAD", cls: "neg" },
                  { avatar: "◉", color: "rgba(0,102,255,.15)", text: "#0066FF", title: "Card Deposit", sub: "5 min ago", amt: "+2,500 MAD", cls: "pos" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                    style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{ width: "24px", height: "24px", background: item.color, color: item.text, fontSize: "9px", fontWeight: 700 }}
                    >
                      {item.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold" style={{ letterSpacing: "-.1px" }}>{item.title}</div>
                      <div className="text-[8px]" style={{ color: "rgba(255,255,255,.45)" }}>{item.sub}</div>
                    </div>
                    <div className={`text-[11px] font-bold ${item.cls}`} style={{ letterSpacing: "-.2px", color: item.cls === "pos" ? "#00c853" : "#ff5252" }}>
                      {item.amt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ animation: "card-float 5s ease-in-out infinite", transformStyle: "preserve-3d" }}>
              <div
                ref={cardRef}
                className="relative rounded-[20px]"
                style={{
                  width: "380px",
                  height: "228px",
                  transformStyle: "preserve-3d",
                  cursor: "pointer",
                  flexShrink: 0,
                  willChange: "transform",
                  transition: "transform .08s linear",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[20px] overflow-hidden"
                  style={{
                    background: "#1a1f2e",
                    boxShadow: "0 24px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Gradient layer */}
                  <div
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{
                      opacity: 0.6,
                      background: "linear-gradient(135deg, rgba(255,215,0,var(--gx,.25)), rgba(0,102,255,var(--gy,.25)))",
                    }}
                  />

                  {/* Auto sheen */}
                  <div
                    className="sheen-auto absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg,transparent 25%,rgba(255,255,255,.15) 45%,rgba(255,255,255,.25) 50%,rgba(255,255,255,.15) 55%,transparent 75%)",
                      backgroundSize: "200% 100%",
                      animation: "sheen-sweep 4s ease-in-out infinite",
                      opacity: 0,
                      mixBlendMode: "overlay",
                    }}
                  />

                  {/* Cursor sheen */}
                  <div
                    ref={sheenRef}
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at var(--sx,50%) var(--sy,50%),rgba(255,255,255,.12),transparent 60%)",
                      opacity: 0,
                      transition: "opacity .3s",
                      mixBlendMode: "overlay",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0"; }}
                  />

                  {/* Content */}
                  <div
                    className="relative z-[2] flex flex-col justify-between h-full p-7"
                    style={{ transform: "translateZ(24px)" }}
                  >
                    <div className="flex justify-between items-start" style={{ transform: "translateZ(16px)" }}>
                      <div>
                        <div className="text-[10px] font-semibold uppercase mb-1" style={{ letterSpacing: "1.5px", color: "rgba(255,255,255,.4)" }}>Marjane Wallet</div>
                        <div className="text-sm font-semibold" style={{ letterSpacing: "-.2px" }}>Premium</div>
                      </div>
                      <div className="relative w-[38px] h-[28px] rounded overflow-hidden" style={{ background: "linear-gradient(135deg,#FFD700,#ccb100)" }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)", animation: "chip-glare 2.5s ease-in-out infinite" }} />
                      </div>
                    </div>

                    <div style={{ transform: "translateZ(20px)" }}>
                      <div className="text-[10px] font-semibold uppercase mb-1" style={{ letterSpacing: "1.5px", color: "rgba(255,255,255,.4)" }}>Available Balance</div>
                      <div className="flex items-baseline gap-1.5" style={{ overflow: "hidden" }}>
                        <div ref={odometerRef} className="odometer" />
                        <span className="text-base font-semibold shrink-0" style={{ color: "#FFD700" }}>MAD</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center" style={{ transform: "translateZ(12px)" }}>
                      <div className="flex gap-2.5 items-center">
                        <div ref={digitsRef} className="text-xs font-medium tracking-[2px]" style={{ color: "rgba(255,255,255,.7)", fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ opacity: 0 }}>4</span>
                          <span style={{ opacity: 0 }}>5</span>
                          <span style={{ opacity: 0 }}>6</span>
                          <span style={{ opacity: 0 }}>2</span>
                          <span style={{ width: "10px", display: "inline-block" }} />
                          <span style={{ opacity: 0 }}>8</span>
                          <span style={{ opacity: 0 }}>9</span>
                          <span style={{ opacity: 0 }}>1</span>
                          <span style={{ opacity: 0 }}>2</span>
                          <span style={{ width: "10px", display: "inline-block" }} />
                          <span style={{ opacity: 0 }}>3</span>
                          <span style={{ opacity: 0 }}>4</span>
                          <span style={{ opacity: 0 }}>7</span>
                          <span style={{ opacity: 0 }}>6</span>
                          <span style={{ width: "10px", display: "inline-block" }} />
                          <span style={{ opacity: 0 }}>0</span>
                          <span style={{ opacity: 0 }}>0</span>
                          <span style={{ opacity: 0 }}>1</span>
                          <span style={{ opacity: 0 }}>9</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-3.5 py-1 rounded-full relative text-[9px] font-semibold uppercase tracking-[1px]"
                        style={{
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid rgba(255,255,255,.1)",
                          animation: "nfc-glow 3s ease-in-out infinite",
                        }}
                      >
                        <div className="absolute -inset-[4px] rounded-full pointer-events-none border" style={{ border: "1px solid rgba(0,102,255,.25)", animation: "nfc-pulse 2.4s ease-out infinite" }} />
                        <div className="absolute -inset-[4px] rounded-full pointer-events-none border" style={{ border: "1px solid rgba(0,102,255,.25)", animation: "nfc-pulse 2.4s ease-out infinite .8s" }} />
                        <NFCIcon />
                        Ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Stats ---- */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-10 lg:mt-8">
          {statData.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-card-el flex items-center gap-3.5 px-5 py-[18px] rounded-[18px] opacity-0"
              style={{
                transform: "translateY(50px)",
                background: "rgba(255,255,255,.035)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,.06)",
                boxShadow: "0 4px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.03)",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-xl"
                style={{ width: "40px", height: "40px", background: "rgba(255,255,255,.05)" }}
              >
                <div className={i === 0 ? "shield-breathe" : i === 1 ? "lightning-flash" : i === 2 ? "tap-tilt" : "globe-spin"}>
                  <stat.icon />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,.45)", letterSpacing: "-.1px", marginBottom: "1px" }}>{stat.label}</div>
                <div
                  className="text-lg font-bold stat-num-inner"
                  style={{ letterSpacing: "-.4px", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}
                >
                  {i === 1 ? "0%" : "0"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-1.5"
        style={{ color: "rgba(255,255,255,.45)", fontSize: "9px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.35, animation: "fade-scroll 4s ease-in-out infinite" }}
      >
        <div className="w-[18px] h-[28px] rounded-[9px] flex justify-center pt-[5px]" style={{ border: "1.5px solid rgba(255,255,255,.15)" }}>
          <div className="w-[2px] h-[5px] rounded-full" style={{ background: "rgba(255,255,255,.3)", animation: "scroll-wheel 2.2s ease-in-out infinite" }} />
        </div>
        Scroll
      </div>

      {/* Gradient transition to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to bottom, transparent, #0B0F1A)" }}
      />
    </section>
  );
}
