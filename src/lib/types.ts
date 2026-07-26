export type PenbClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface Building {
  id: string;
  park: string | null;
  category: string;
  areaM2: number;
  yearBuilt: number;
  penbClass: PenbClass | null;
  pneKwhM2: number;
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
  buildingCount: number;
}
