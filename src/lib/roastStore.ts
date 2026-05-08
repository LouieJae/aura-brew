"use client";

import { useSyncExternalStore } from "react";

export type Roast = "light" | "medium" | "dark";

/**
 * Material targets per roast. `color` is a CSS hex string; `roughness` is a
 * 0–1 PBR value. GSAP interpolates between these in BeanScene.
 */
export const ROAST_PRESETS: Record<
  Roast,
  { color: string; roughness: number; label: string }
> = {
  light: { color: "#a5734a", roughness: 0.88, label: "Light" },
  medium: { color: "#4a2a1a", roughness: 0.78, label: "Medium" },
  dark: { color: "#1b0e08", roughness: 0.52, label: "Dark" },
};

// Tiny module-scoped store so both RoastSelector and BeanScene can sync
// without threading a Context through the Server Component in page.tsx.
let current: Roast = "medium";
let tick = 0; // monotonically increases on any change (pulse trigger)
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const roastStore = {
  get: () => current,
  getTick: () => tick,
  /**
   * Sets the roast. Bumps `tick` even when the roast didn't change so the
   * pulse animation still fires on repeat clicks.
   */
  set: (r: Roast) => {
    current = r;
    tick += 1;
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useRoast(): Roast {
  return useSyncExternalStore(
    roastStore.subscribe,
    roastStore.get,
    () => "medium" as Roast,
  );
}

/** Subscribes to any roast-set event (including repeats). Used for pulse. */
export function useRoastTick(): number {
  return useSyncExternalStore(
    roastStore.subscribe,
    roastStore.getTick,
    () => 0,
  );
}
