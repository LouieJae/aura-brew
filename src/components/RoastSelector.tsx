"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { roastStore, useRoast, ROAST_PRESETS, type Roast } from "@/lib/roastStore";

const ORDER: Roast[] = ["light", "medium", "dark"];

export default function RoastSelector() {
  const active = useRoast();

  return (
    <div className="hero-reveal mt-8 inline-flex flex-col gap-3">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/45">
        <Flame size={12} className="text-[var(--accent-strong)]" />
        Choose your roast
      </span>

      <div
        role="radiogroup"
        aria-label="Roast level"
        className="glass relative inline-flex items-center gap-1 rounded-full p-1"
      >
        {ORDER.map((r) => {
          const selected = active === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={selected}
              data-cursor="grow"
              onClick={() => roastStore.set(r)}
              className="relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide"
            >
              {selected && (
                <motion.span
                  layoutId="roast-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)]"
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  selected ? "text-black" : "text-white/75 hover:text-white"
                }`}
              >
                {ROAST_PRESETS[r].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
