"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ClientAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const particles: HTMLElement[] = [];
    let rafId = 0;
    const cleanupFns: (() => void)[] = [];

    // Cursor spotlight
    const spot = document.getElementById("page-spotlight");
    if (spot) {
      let sx = 0, sy = 0, cx = 0, cy = 0;
      const onMouse = (e: MouseEvent) => { sx = e.clientX; sy = e.clientY; spot.classList.add("visible"); };
      const onLeave = () => spot.classList.remove("visible");
      document.addEventListener("mousemove", onMouse);
      document.addEventListener("mouseleave", onLeave);
      const tick = () => { cx += (sx - cx) * 0.08; cy += (sy - cy) * 0.08; spot.style.transform = `translate(${cx - 250}px, ${cy - 250}px)`; rafId = requestAnimationFrame(tick); };
      rafId = requestAnimationFrame(tick);
      cleanupFns.push(() => {
        document.removeEventListener("mousemove", onMouse);
        document.removeEventListener("mouseleave", onLeave);
        cancelAnimationFrame(rafId);
      });
    }

    // Dust particles
    for (let i = 0; i < 20; i++) {
      const p = document.createElement("div");
      p.className = "dust-particle";
      const s = 0.5 + Math.random() * 1;
      p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;opacity:${0.08 + Math.random() * 0.1}`;
      document.body.appendChild(p);
      particles.push(p);
      const dur = 12 + Math.random() * 16, delay = Math.random() * 10, fx = 0.5 + Math.random() * 1.5, ax = 10 + Math.random() * 30;
      gsap.to(p, {
        y: -window.innerHeight, opacity: 0, duration: dur, repeat: -1, delay, ease: "none",
        onUpdate: function () { const prog = this.progress(); const drift = Math.sin(prog * Math.PI * 2 * fx) * ax; p.style.transform = `translateX(${drift}px)`; },
      });
    }

    // ── Section entrances ──
    ([
      "#showcase", "#features-grid", "#onboarding",
      "#security", "#stats-bar", "#testimonials", "#cta",
    ] as const).forEach((id) => {
      const el = document.querySelector(id);
      if (el) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      }
    });

    // ── Trust bar logos ──
    gsap.to(".trust-logo", {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: "#trust", start: "top 90%" },
    });

    // ── Security cards ──
    gsap.to(".sec-card", {
      opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: "#security", start: "top 70%" },
    });

    // ── Compliance badges ──
    gsap.to(".compliance-badge", {
      opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: "#security", start: "top 85%" },
    });

    // ── Feature grid cards ──
    gsap.to(".feat-card", {
      opacity: 1, rotateX: 0, duration: 0.6, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: "#features-grid", start: "top 80%" },
    });

    // ── CTA container ──
    gsap.to(".cta-container", {
      opacity: 1, scale: 1, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: "#cta", start: "top 85%" },
    });

    // ── Footer columns ──
    gsap.to(".footer-col, .footer-brand-col", {
      opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: "footer", start: "top 90%" },
    });

    // ── Showcase chart + transactions ──
    ScrollTrigger.create({
      trigger: "#showcase", start: "top 80%", onEnter: () => {
        gsap.to("#chart-line", { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" });
        gsap.to(".tx-item", { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.5 });
      },
    });

    // ── Onboarding timeline ──
    ScrollTrigger.create({
      trigger: "#onboarding", start: "top 70%", onEnter: () => {
        const steps = document.querySelectorAll(".timeline-step");
        steps.forEach((s, i) => { gsap.to(s, { opacity: 1, duration: 0.5, delay: i * 0.3, ease: "power2.out", onStart: () => s.classList.add("active") }); });
        gsap.to(".line-fill", { height: "100%", duration: 1.5, ease: "power2.inOut", delay: 0.3 });
      },
    });

    // ── Security lock icon ──
    ScrollTrigger.create({
      trigger: "#security", start: "top 70%", onEnter: () => {
        const lock = document.getElementById("lock-icon");
        if (lock) { lock.classList.add("click"); gsap.delayedCall(1, () => lock.classList.remove("click")); }
      },
    });

    // ── Stats bar ──
    ScrollTrigger.create({
      trigger: "#stats-bar", start: "top 85%", onEnter: () => {
        gsap.to(".stat-item", { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
      },
    });

    // ── Testimonials ──
    ScrollTrigger.create({
      trigger: "#testimonials", start: "top 80%", onEnter: () => {
        const cards = document.querySelectorAll(".test-card");
        gsap.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out" });
        cards.forEach((card, i) => {
          gsap.delayedCall(i * 0.15 + 0.3, () => {
            const stars = card.querySelectorAll(".star");
            gsap.to(stars, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.08, ease: "back.out(2)" });
          });
          gsap.delayedCall(i * 0.15 + 0.8, () => {
            const circle = card.querySelector(".test-avatar-ring circle") as SVGCircleElement | null;
            if (circle) gsap.to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
          });
        });
      },
    });

    // Reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("#page-spotlight, .dust-particle").forEach((el) => el.remove());
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      particles.forEach((p) => p.remove());
      gsap.killTweensOf("*");
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return null;
}
