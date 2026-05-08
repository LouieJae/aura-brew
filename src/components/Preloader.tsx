"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { Coffee } from "lucide-react";
import { preloaderStore } from "@/lib/preloaderStore";

/**
 * Full-screen preloader overlay.
 *
 * - Tracks asset load via drei's `useProgress` (taps the global THREE
 *   DefaultLoadingManager — works without being mounted inside a Canvas).
 * - Locks `body` scroll while visible.
 * - Once `progress === 100`, waits 500ms then fades out via Framer Motion.
 * - On exit complete, flips `preloaderStore` so the BeanScene can run its
 *   hero entry animation.
 *
 * Note: when the page has no 3D assets queued (or they finish before this
 * component mounts), `active` from `useProgress` reports `false` and progress
 * is `0`. We treat that case as "ready" too, so the loader never gets stuck.
 */
export default function Preloader() {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);
  const [shownProgress, setShownProgress] = useState(0);

  // Smooth, monotonic display value so the bar never jumps backwards if
  // additional assets register mid-flight.
  useEffect(() => {
    setShownProgress((prev) => Math.max(prev, Math.round(progress)));
  }, [progress]);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Hide after we hit 100% (or after a safety timeout if no assets queued).
  useEffect(() => {
    let t: number | undefined;
    if (progress >= 100 || (!active && shownProgress >= 0)) {
      // 500ms hold so the "100%" reads, then fade.
      t = window.setTimeout(() => setVisible(false), 500);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [progress, active, shownProgress]);

  // Hard safety net: in case useProgress never fires (e.g. zero assets), kill
  // the overlay after 4s no matter what so the page is never blocked.
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={() => preloaderStore.markDone()}>
      {visible && (
        <motion.div
          key="preloader"
          aria-hidden
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          {/* Faint warm halo behind the wordmark */}
          <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[var(--accent)]/15 blur-3xl" />

          {/* Logo / wordmark */}
          <motion.div
            className="relative flex items-center gap-3"
            animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] text-black shadow-[0_10px_30px_-8px_rgba(231,178,126,0.55)]">
              <Coffee size={20} strokeWidth={2.2} />
            </span>
            <span
              className="text-3xl font-semibold tracking-tight text-white"
              style={{ fontFamily: "var(--font-serif), ui-serif, Georgia, serif" }}
            >
              Aura<span className="text-[var(--accent-strong)]">Brew</span>
            </span>
          </motion.div>

          {/* Progress */}
          <div className="relative mt-10 flex w-56 flex-col items-center gap-3">
            <div className="h-px w-full overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent)]"
                animate={{ width: `${shownProgress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/45 tabular-nums">
              {shownProgress.toString().padStart(2, "0")}%
            </span>
          </div>

          <span className="absolute bottom-8 text-[10px] uppercase tracking-[0.4em] text-white/30">
            Slow roasted, served warm
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
