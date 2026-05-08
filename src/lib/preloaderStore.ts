"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny store that signals when the Preloader has finished its fade-out.
 * BeanScene listens to this so it can run its hero-entry scale animation
 * only once the loading overlay is fully gone.
 */
let done = false;
const listeners = new Set<() => void>();

export const preloaderStore = {
  isDone: () => done,
  markDone: () => {
    if (done) return;
    done = true;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePreloaderDone(): boolean {
  return useSyncExternalStore(
    preloaderStore.subscribe,
    preloaderStore.isDone,
    () => false,
  );
}
