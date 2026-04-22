"use client";

import { useState, useEffect } from "react";

/**
 * Drop-in replacement for useState that persists the value
 * in localStorage. Safe for Next.js SSR — reads stored value
 * after hydration so there's never a server/client mismatch.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  // Phase 1: Read from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setState(JSON.parse(stored) as T);
      }
    } catch {
      // Storage unavailable or corrupted — use default
    }
    setLoaded(true);
  }, [key]);

  // Phase 2: Sync every change back to localStorage (skips until loaded)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage full or blocked — fail silently
    }
  }, [key, state, loaded]);

  return [state, setState];
}
