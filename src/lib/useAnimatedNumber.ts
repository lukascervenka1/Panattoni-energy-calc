"use client";

import { useEffect, useRef, useState } from "react";

const EASE = (t: number) => 1 - Math.pow(1 - t, 3);
const DURATION_MS = 450;

/** Eases a displayed number toward `target` whenever it changes. Snaps instantly if the user prefers reduced motion. */
export function useAnimatedNumber(target: number): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 0 : DURATION_MS;
    const start = performance.now();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, duration === 0 ? 1 : elapsed / duration);
      const value = from + delta * EASE(t);
      setDisplay(value);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return display;
}
