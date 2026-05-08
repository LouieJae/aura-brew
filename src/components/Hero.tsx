"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.2,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative isolate min-h-[100svh] overflow-hidden pt-28"
    >
      {/* Backdrop image */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]">
        <Image
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/40 via-[var(--background)]/70 to-[var(--background)]" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-24 md:grid-cols-2 md:gap-6 md:pb-32">
        {/* Copy */}
        <div className="relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hero-reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            <Sparkles size={14} className="text-[var(--accent-strong)]" />
            Single-origin · Slow roasted
          </motion.span>

          <h1 className="hero-reveal mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Brewed for
            <br />
            the <span className="bg-gradient-to-r from-[var(--accent-strong)] via-[#f3c896] to-[var(--accent)] bg-clip-text text-transparent">aura</span> in you.
          </h1>

          <p className="hero-reveal mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            A premium micro-roastery crafting the world&apos;s most expressive
            beans into cups that feel like a quiet ritual. Discover our seasonal
            single-origins and signature blends.
          </p>

          <div className="hero-reveal mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#menu"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(231,178,126,0.6)] transition hover:shadow-[0_14px_40px_-10px_rgba(231,178,126,0.8)]"
            >
              Explore the menu
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#story"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/30 hover:text-white"
            >
              Our story
            </a>
          </div>

          <div className="hero-reveal mt-10 flex items-center gap-6 text-xs text-white/55">
            <div>
              <div className="text-2xl font-semibold text-white">12+</div>
              <div className="uppercase tracking-widest">Origins</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-2xl font-semibold text-white">94<span className="text-[var(--accent-strong)]">pt</span></div>
              <div className="uppercase tracking-widest">Avg. cupping</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-2xl font-semibold text-white">2014</div>
              <div className="uppercase tracking-widest">Est.</div>
            </div>
          </div>
        </div>

        {/* 3D stage placeholder — the global <BeanScene/> renders the bean here via fixed canvas */}
        <div className="relative h-[420px] w-full sm:h-[520px] md:h-[620px]">
          {/* Glow halo behind the floating bean */}
          <div className="absolute inset-0 mx-auto h-3/4 w-3/4 translate-y-6 rounded-full bg-[var(--accent)]/25 blur-3xl" />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/40">
        Scroll
      </div>
    </section>
  );
}
