import "server-only";
import { parseCsvRecords } from "./csv";
import type { Benchmark, CalculatorConfig, DataSourceStatus, PenbClass } from "./types";
import fallbackBenchmarksJson from "../../data/benchmarks.json";
import fallbackConfigJson from "../../data/config.json";

const REVALIDATE_SECONDS = 300; // 5 min — sheet edits should show up without a redeploy
const PENB_CLASSES: PenbClass[] = ["A", "B", "C", "D", "E", "F", "G"];

const fallbackBenchmarks = fallbackBenchmarksJson as unknown as Benchmark[];
const fallbackConfig = fallbackConfigJson as unknown as CalculatorConfig;

function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function fetchCsv(url: string): Promise<Record<string, string>[] | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const text = await res.text();
    const records = parseCsvRecords(text);
    return records.length > 0 ? records : null;
  } catch {
    return null;
  }
}

function parseBenchmarks(records: Record<string, string>[]): Benchmark[] {
  return records
    .map((r): Benchmark | null => {
      const areaM2 = num(r.area_m2, NaN);
      const pneKwhM2 = num(r.pne_kwh_m2, NaN);
      if (!r.id || !Number.isFinite(areaM2) || !Number.isFinite(pneKwhM2)) {
        return null;
      }
      return {
        id: r.id,
        park: r.park?.trim() || "",
        category: r.category?.trim() || "Sklad & logistika",
        areaM2,
        yearBuilt: num(r.year_built, 0),
        pneKwhM2,
        elecSharePct: num(r.elec_share_pct, 0),
        pneYear: num(r.pne_year, 2025),
      };
    })
    .filter((b): b is Benchmark => b !== null);
}

function parseConfig(records: Record<string, string>[]): CalculatorConfig {
  const map = new Map(records.map((r) => [r.key?.trim(), r.value?.trim()]));
  const get = (key: string, fallback: number) => num(map.get(key), fallback);

  const classDefaultsKwhM2 = {} as Record<PenbClass, number>;
  const classBoundariesKwhM2 = {} as Record<PenbClass, number | null>;
  for (const c of PENB_CLASSES) {
    classDefaultsKwhM2[c] = get(
      `class_default_${c.toLowerCase()}`,
      fallbackConfig.classDefaultsKwhM2[c],
    );
    const boundaryRaw = map.get(`class_boundary_${c.toLowerCase()}`);
    classBoundariesKwhM2[c] =
      boundaryRaw === undefined || boundaryRaw === ""
        ? fallbackConfig.classBoundariesKwhM2[c]
        : num(boundaryRaw, NaN);
  }

  return {
    elePriceEurKwh: get("ele_price_eur_kwh", fallbackConfig.elePriceEurKwh),
    gasPriceEurKwh: get("gas_price_eur_kwh", fallbackConfig.gasPriceEurKwh),
    eleCo2TPerKwh: get("ele_co2_t_per_kwh", fallbackConfig.eleCo2TPerKwh),
    gasCo2TPerKwh: get("gas_co2_t_per_kwh", fallbackConfig.gasCo2TPerKwh),
    eleShareDefault: get("ele_share_default", fallbackConfig.eleShareDefault),
    gasShareDefault: get("gas_share_default", fallbackConfig.gasShareDefault),
    referencePneKwhM2: get("reference_pne_kwh_m2", fallbackConfig.referencePneKwhM2),
    classDefaultsKwhM2,
    classBoundariesKwhM2,
  };
}

export interface CalculatorData {
  benchmarks: Benchmark[];
  config: CalculatorConfig;
  status: DataSourceStatus;
}

export async function getCalculatorData(): Promise<CalculatorData> {
  const benchmarksUrl = process.env.SHEETS_BUILDINGS_CSV_URL;
  const configUrl = process.env.SHEETS_CONFIG_CSV_URL;

  let benchmarks: Benchmark[] | null = null;
  let config: CalculatorConfig | null = null;

  if (benchmarksUrl) {
    const records = await fetchCsv(benchmarksUrl);
    if (records) {
      const parsed = parseBenchmarks(records);
      if (parsed.length > 0) benchmarks = parsed;
    }
  }

  if (configUrl) {
    const records = await fetchCsv(configUrl);
    if (records) config = parseConfig(records);
  }

  const usedSheets = benchmarks !== null || config !== null;

  return {
    benchmarks: benchmarks ?? fallbackBenchmarks,
    config: config ?? fallbackConfig,
    status: {
      source: usedSheets ? "sheets" : "fallback",
      fetchedAt: new Date().toISOString(),
      benchmarkCount: (benchmarks ?? fallbackBenchmarks).length,
    },
  };
}
