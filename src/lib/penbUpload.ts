/**
 * Shared contract and guard rails for the PENB upload endpoint
 * (src/app/api/penb/route.ts). Pure and framework-free so every check can be
 * unit-tested — the route itself only wires these together.
 */
import type { PenbExtraction } from "./penb";

/**
 * Vercel functions reject request bodies over 4.5 MB before our code runs;
 * staying under that keeps the error ours (and localized) instead of a bare 413.
 */
export const MAX_PENB_BYTES = 4 * 1024 * 1024;

/**
 * Identifies the consent wording shown next to the upload. Stored with every
 * certificate, so it's provable later what a visitor agreed to. Bump it
 * whenever `penb.consent` changes in src/lib/i18n.ts.
 */
export const PENB_CONSENT_VERSION = "penb-consent-2026-10";

export type PenbUploadError =
  | "forbidden"
  | "rate_limited"
  | "consent_required"
  | "missing_file"
  | "too_large"
  | "not_pdf"
  | "unreadable"
  | "no_text"
  | "not_penb"
  | "no_values"
  | "server";

export type PenbWarning =
  /** Heat-pump ambient heat was in the PENB total but isn't billed — left out. */
  | "ambient_excluded"
  /** District heat / LPG / oil / coal / biomass was folded into the gas field. */
  | "other_fuel_as_gas"
  /** Carriers didn't add up to the table's own total — ask the visitor to check. */
  | "unverified";

export interface PenbValues {
  areaM2: number;
  eleMwh: number;
  /** Natural gas plus any other purchased fuel — the calculator prices both as gas. */
  gasMwh: number;
  ambientMwh: number;
  otherFuelMwh: number;
}

export type PenbUploadResponse =
  | { ok: true; values: PenbValues; warnings: PenbWarning[] }
  | { ok: false; error: PenbUploadError };

/** The PDF header may sit anywhere in the first 1024 bytes (ISO 32000-1, 7.5.2). */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

/**
 * Only our own page may post here. This doesn't stop a scripted client (it
 * can forge Origin), but it does stop another website from using a visitor's
 * browser to push files at us.
 */
export function isSameOrigin(origin: string | null, requestUrl: string): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}

/**
 * Best-effort fixed-window limiter. On serverless it's per instance, so it
 * only blunts a burst from one client — real protection belongs in the
 * Vercel Firewall (see README). `now` is injectable for tests.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string): boolean {
    const t = now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      // Don't let a flood of distinct keys grow the map without bound.
      if (hits.size >= maxKeys) {
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
        if (hits.size >= maxKeys) hits.clear();
      }
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}

export function toPenbValues(e: PenbExtraction & { areaM2: number }): {
  values: PenbValues;
  warnings: PenbWarning[];
} {
  const warnings: PenbWarning[] = [];
  if (e.ambientMwh > 0) warnings.push("ambient_excluded");
  if (e.otherFuelMwh > 0) warnings.push("other_fuel_as_gas");
  if (!e.consistent) warnings.push("unverified");

  return {
    values: {
      areaM2: e.areaM2,
      eleMwh: e.electricityMwh,
      gasMwh: e.gasMwh + e.otherFuelMwh,
      ambientMwh: e.ambientMwh,
      otherFuelMwh: e.otherFuelMwh,
    },
    warnings,
  };
}
