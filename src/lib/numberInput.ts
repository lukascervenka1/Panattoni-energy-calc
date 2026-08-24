/**
 * Parsing/formatting for the editable number fields. Split out of
 * `SliderField` so the parser — which sees whatever a visitor types — can be
 * tested directly.
 */
import type { Locale } from "./i18n";

/**
 * Accepts what people actually type: "1 200", "1 200,5", "1200.5".
 * Returns `null` for anything else, so the caller leaves the current value
 * alone instead of writing NaN/Infinity into the calculation.
 */
export function parseTyped(raw: string): number | null {
  const cleaned = raw.replace(/[\s  ]/g, "").replace(",", ".");
  if (cleaned === "") return null;

  // Plain decimal notation only. `Number()` alone would also accept "0x1f",
  // "1e999", "Infinity" and "" — none of which a consumption field should take.
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatForLocale(n: number, locale: Locale, decimals: number): string {
  return n.toLocaleString(locale === "en" ? "en-GB" : "cs-CZ", {
    maximumFractionDigits: decimals,
  });
}

/** Keeps a value inside the field's range, and never returns a non-finite number. */
export function clampToRange(value: number, min: number, max: number): number {
  // NaN has no ordering, so fall back to the low end. The infinities do order
  // correctly and clamp to the matching bound on their own.
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
