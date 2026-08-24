export type PenbClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

/**
 * A recent Panattoni hall shown publicly as the benchmark. `pneKwhM2` is real
 * billed consumption (electricity + gas) for `pneYear`, never the PENB
 * certificate's declared design value. Only halls with a full year of billing
 * qualify — a hall's first calendar year after completion is partial and reads
 * far too low.
 *
 * The PENB class is deliberately absent: the letter is graded against each
 * building's own reference building (vyhláška 264/2020), so it does not rank
 * halls against each other — our own data has a hall at EP 33 rated B and one
 * at EP 46 rated A. Showing the letters side by side would read as a ranking
 * that the data does not support.
 */
export interface Benchmark {
  id: string;
  park: string;
  category: string;
  areaM2: number;
  yearBuilt: number;
  pneKwhM2: number;
  /** Share of total consumption covered by electricity rather than gas. */
  elecSharePct: number;
  pneYear: number;
}

export interface CalculatorConfig {
  elePriceEurKwh: number;
  gasPriceEurKwh: number;
  eleCo2TPerKwh: number;
  gasCo2TPerKwh: number;
  eleShareDefault: number;
  gasShareDefault: number;
  referencePneKwhM2: number;
  classDefaultsKwhM2: Record<PenbClass, number>;
  classBoundariesKwhM2: Record<PenbClass, number | null>;
}

export interface DataSourceStatus {
  source: "sheets" | "fallback";
  fetchedAt: string;
  benchmarkCount: number;
}
