"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Coffee, GlassWater, Snowflake, type LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";

type Brew = {
  name: string;
  blurb: string;
  notes: string[];
  Icon: LucideIcon;
};

const brews: Brew[] = [
  {
    name: "Barako Gold",
    blurb:
      "Dark roast. A dense, syrupy shot inspired by Batangas Barako — bittersweet cacao depth, toasted nuts, and golden caramel.",
    notes: ["Dark cacao", "Toasted pili", "Caramel"],
    Icon: Coffee,
  },
  {
    name: "Sagada Cloud Latte",
    blurb:
      "Medium roast. Silky steamed milk folded into a double pull from Sagada lots — velvety body, brown sugar sweetness, and soft vanilla.",
    notes: ["Milk chocolate", "Brown sugar", "Vanilla"],
    Icon: GlassWater,
  },
  {
    name: "Benguet Mist Cold Brew",
    blurb:
      "Steeped for 18 hours using Benguet highland beans. Crisp, fragrant, and refreshingly low-acid with a clean mountain finish.",
    notes: ["Sampaguita", "Citrus peel", "Wild honey"],
    Icon: Snowflake,
  },
];

// Staggered children reveal — each line/chip slides in after the card lands.
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

function BrewCard({ brew, index }: { brew: Brew; index: number }) {
  // 3D tilt driven by cursor position
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-10, 10]);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const { Icon } = brew;

  return (
    <motion.div
      data-cursor="grow"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.12 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="glass group relative overflow-hidden rounded-3xl p-7 will-change-transform"
    >
      {/* Accent halo */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-[var(--accent)]/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] text-black shadow-inner">
          <Icon size={22} strokeWidth={2.2} />
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          0{index + 1}
        </span>
      </motion.div>

      <motion.h3
        variants={itemVariants}
        className="mt-6 text-2xl font-semibold tracking-tight"
      >
        {brew.name}
      </motion.h3>
      <motion.p
        variants={itemVariants}
        className="mt-2 text-sm leading-relaxed text-white/65"
      >
        {brew.blurb}
      </motion.p>

      <motion.ul variants={itemVariants} className="mt-6 flex flex-wrap gap-2">
        {brew.notes.map((n, i) => (
          <motion.li
            key={n}
            variants={itemVariants}
            transition={{ delay: 0.05 * i }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/75"
          >
            {n}
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export default function SignatureBrews() {
  return (
    <section
      id="brews"
      className="relative z-10 mx-auto w-full max-w-6xl px-6 py-32"
    >
      <div className="mb-14 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
          Signature Brews
        </span>
        <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Three classics,
          <br />
          re-engineered.
        </h2>
        <p className="mt-4 max-w-lg text-white/65">
          Tilted, layered, and balanced — each cup is dialed in by our
          baristas every morning before we open the door.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {brews.map((b, i) => (
          <BrewCard key={b.name} brew={b} index={i} />
        ))}
      </div>
    </section>
  );
}
