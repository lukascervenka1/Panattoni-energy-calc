/**
 * Pure parsing/validation for data arriving from the published Google Sheet.
 *
 * Everything here treats its input as untrusted: the sheet is edited by hand,
 * published to the open web, and fetched at runtime, so a typo (or a
 * compromised account) must never be able to crash the page or put nonsense
 * numbers in front of a client. Rows that fail validation are dropped and
 * config values that fail are replaced by the bundled fallback, rather than
 * being rendered as NaN, Infinity, or a negative consumption.
 *
 * Kept free of I/O and of `server-only` so it can be unit-tested directly.
 */
import type { Benchmark, CalculatorConfig, PenbClass } from "./types";

export const PENB_CLASSES: PenbClass[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Parses a sheet cell, falling back when it is missing or not a real number. */
export function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** As `num`, but also rejects values outside `[min, max]`. */
function boundedNum(
  value: string | undefined,
  fallback: number,
  min: number,
  max = Number.POSITIVE_INFINITY,
): number {
  const parsed = num(value, fallback);
  return parsed >= min && parsed <= max ? parsed : fallback;
}

export function parseBenchmarks(records: Record<string, string>[]): Benchmark[] {
  return records
    .map((r): Benchmark | null => {
      const areaM2 = num(r.area_m2, NaN);
      const pneKwhM2 = num(r.pne_kwh_m2, NaN);

      // A hall with no id, or with an impossible area/consumption, is a data
      // error — drop it rather than publishing a broken card.
      if (!r.id || !(areaM2 > 0) || !(pneKwhM2 > 0)) return null;

      return {
        id: r.id,
        park: r.park?.trim() || "",
        category: r.category?.trim() || "Sklad & logistika",
        areaM2,
        yearBuilt: num(r.year_built, 0),
        pneKwhM2,
        elecSharePct: boundedNum(r.elec_share_pct, 0, 0, 100),
        pneYear: num(r.pne_year, 2025),
      };
    })
    .filter((b): b is Benchmark => b !== null);
}

export function parseConfig(
  records: Record<string, string>[],
  fallback: CalculatorConfig,
): CalculatorConfig {
  const map = new Map(records.map((r) => [r.key?.trim(), r.value?.trim()]));

  /** Prices and emission factors: any finite, non-negative number is allowed. */
  const rate = (key: string, fb: number) => boundedNum(map.get(key), fb, 0);
  /** Shares are fractions of total consumption. */
  const share = (key: string, fb: number) => boundedNum(map.get(key), fb, 0, 1);

  const classDefaultsKwhM2 = {} as Record<PenbClass, number>;
  const classBoundariesKwhM2 = {} as Record<PenbClass, number | null>;
  for (const c of PENB_CLASSES) {
    const key = c.toLowerCase();
    // A class default of 0 would make the estimate meaningless and can divide
    // by zero downstream, so require a positive number.
    classDefaultsKwhM2[c] = boundedNum(
      map.get(`class_default_${key}`),
      fallback.classDefaultsKwhM2[c],
      Number.MIN_VALUE,
    );

    const boundaryRaw = map.get(`class_boundary_${key}`);
    classBoundariesKwhM2[c] =
      boundaryRaw === undefined || boundaryRaw === ""
        ? fallback.classBoundariesKwhM2[c]
        : boundedNum(boundaryRaw, fallback.classBoundariesKwhM2[c] ?? 0, 0);
  }

  return {
    elePriceEurKwh: rate("ele_price_eur_kwh", fallback.elePriceEurKwh),
    gasPriceEurKwh: rate("gas_price_eur_kwh", fallback.gasPriceEurKwh),
    eleCo2TPerKwh: rate("ele_co2_t_per_kwh", fallback.eleCo2TPerKwh),
    gasCo2TPerKwh: rate("gas_co2_t_per_kwh", fallback.gasCo2TPerKwh),
    eleShareDefault: share("ele_share_default", fallback.eleShareDefault),
    gasShareDefault: share("gas_share_default", fallback.gasShareDefault),
    // The reference target divides into the reduction percentage.
    referencePneKwhM2: boundedNum(
      map.get("reference_pne_kwh_m2"),
      fallback.referencePneKwhM2,
      Number.MIN_VALUE,
    ),
    classDefaultsKwhM2,
    classBoundariesKwhM2,
  };
}
