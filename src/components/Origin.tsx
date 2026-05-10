"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function Origin() {
  return (
    <section
      id="origin"
      className="relative z-10 mx-auto w-full max-w-6xl px-6 py-32 sm:py-40"
    >
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
            <Leaf size={14} className="text-[var(--accent-strong)]" />
            The Origin
          </span>
          <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            From volcanic soil
            <br />
            to your cup.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            We work hand-in-hand with Filipino farmers in Atok, Benguet and the
            foothills of Mt. Apo, where cool mountain air slows cherry ripening
            and deepens sweetness in every harvest.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">
            The secret to each lot&apos;s Aura is the Philippines&apos; rich volcanic
            soil, then a patient small-batch roast that protects the bean&apos;s
            natural cacao depth, floral lift, and clean finish.
          </p>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-6 text-xs text-white/55">
            <div>
              <div className="text-2xl font-semibold text-white">8</div>
              <div className="mt-1 uppercase tracking-widest">Farms</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">3</div>
              <div className="mt-1 uppercase tracking-widest">Regions</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">12kg</div>
              <div className="mt-1 uppercase tracking-widest">Per batch</div>
            </div>
          </div>
        </motion.div>

        {/* Image — slides in from the right */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
        >
          <Image
            src="/assets/mountain.jpg"
            alt="Coffee plantation at golden hour"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-[var(--accent)]/15" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-white/80">
            <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur">
              Mt. Apo, Davao City · 1,250m
            </span>
            <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur">
              Lot 01 · 2026
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
