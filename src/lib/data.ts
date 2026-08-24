import "server-only";
import { parseCsvRecords } from "./csv";
import { parseBenchmarks, parseConfig } from "./parse";
import type { Benchmark, CalculatorConfig, DataSourceStatus } from "./types";
import fallbackBenchmarksJson from "../../data/benchmarks.json";
import fallbackConfigJson from "../../data/config.json";

const REVALIDATE_SECONDS = 300; // 5 min — sheet edits should show up without a redeploy

const fallbackBenchmarks = fallbackBenchmarksJson as unknown as Benchmark[];
const fallbackConfig = fallbackConfigJson as unknown as CalculatorConfig;

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
    if (records) config = parseConfig(records, fallbackConfig);
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
