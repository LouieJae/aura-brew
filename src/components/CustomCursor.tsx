"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Coffee-tinted custom cursor with two layers:
 *   - a small inner dot (snappy, near-1:1 with the mouse)
 *   - a larger outer ring (lagged via spring)
 *
 * Hovering any element marked with `data-cursor="grow"` makes the ring expand
 * and glow. Hidden on touch / coarse pointers.
 */
export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const ringX = useSpring(x, { stiffness: 280, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 280, damping: 26, mass: 0.6 });
  const dotX = useSpring(x, { stiffness: 900, damping: 40, mass: 0.3 });
  const dotY = useSpring(y, { stiffness: 900, damping: 40, mass: 0.3 });

  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only enable on devices with a fine pointer (mouse / trackpad).
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('[data-cursor="grow"]')) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('[data-cursor="grow"]')) setHovering(false);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    // Hide native cursor while ours is active.
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled, visible, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border border-[var(--accent-strong)]/70 mix-blend-screen"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: hovering ? 56 : 28,
          height: hovering ? 56 : 28,
          opacity: visible ? (hovering ? 1 : 0.85) : 0,
          backgroundColor: hovering
            ? "rgba(231,178,126,0.16)"
            : "rgba(231,178,126,0)",
          boxShadow: hovering
            ? "0 0 28px 6px rgba(231,178,126,0.35)"
            : "0 0 0 0 rgba(231,178,126,0)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
      {/* Inner dot */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[var(--accent-strong)]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0,
        }}
      />
    </>
  );
}
