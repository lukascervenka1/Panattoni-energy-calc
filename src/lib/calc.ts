import type { CalculatorConfig } from "./types";
import type { Locale } from "./i18n";

export interface CalculatorInputs {
  areaM2: number;
  eleKwhM2: number;
  gasKwhM2: number;
}

export interface CalculatorResult {
  isOptimal: boolean;
  currentPneKwhM2: number;
  referencePneKwhM2: number;
  reductionPct: number;
  annualSavingsEur: number;
  annualSavingsEurPerM2: number;
  annualSavingsMwh: number;
  annualCo2SavingsT: number;
  fiveYearSavingsEur: number;
  tenYearSavingsEur: number;
}

export function suggestConsumptionSplit(
  totalKwhM2: number,
  config: CalculatorConfig,
): { eleKwhM2: number; gasKwhM2: number } {
  const ele = Math.round((totalKwhM2 * config.eleShareDefault) / 5) * 5;
  const gas = Math.round((totalKwhM2 * config.gasShareDefault) / 5) * 5;
  return { eleKwhM2: ele, gasKwhM2: gas };
}

export function calculateSavings(
  inputs: CalculatorInputs,
  config: CalculatorConfig,
): CalculatorResult {
  const currentPneKwhM2 = inputs.eleKwhM2 + inputs.gasKwhM2;
  const referencePneKwhM2 = config.referencePneKwhM2;

  if (currentPneKwhM2 <= referencePneKwhM2 || currentPneKwhM2 === 0) {
    return {
      isOptimal: true,
      currentPneKwhM2,
      referencePneKwhM2,
      reductionPct: 0,
      annualSavingsEur: 0,
      annualSavingsEurPerM2: 0,
      annualSavingsMwh: 0,
      annualCo2SavingsT: 0,
      fiveYearSavingsEur: 0,
      tenYearSavingsEur: 0,
    };
  }

  const priceBlend =
    (inputs.eleKwhM2 * config.elePriceEurKwh + inputs.gasKwhM2 * config.gasPriceEurKwh) /
    currentPneKwhM2;
  const co2Blend =
    (inputs.eleKwhM2 * config.eleCo2TPerKwh + inputs.gasKwhM2 * config.gasCo2TPerKwh) /
    currentPneKwhM2;

  const deltaKwh = (currentPneKwhM2 - referencePneKwhM2) * inputs.areaM2;
  const annualSavingsEur = Math.round(deltaKwh * priceBlend);
  const annualCo2SavingsT = Math.round(deltaKwh * co2Blend);
  const reductionPct = Math.round((1 - referencePneKwhM2 / currentPneKwhM2) * 100);

  return {
    isOptimal: false,
    currentPneKwhM2,
    referencePneKwhM2,
    reductionPct,
    annualSavingsEur,
    annualSavingsEurPerM2: (deltaKwh * priceBlend) / inputs.areaM2,
    annualSavingsMwh: Math.round(deltaKwh / 1000),
    annualCo2SavingsT,
    fiveYearSavingsEur: annualSavingsEur * 5,
    tenYearSavingsEur: annualSavingsEur * 10,
  };
}

function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : "cs-CZ";
}

export function formatNumber(n: number, locale: Locale = "cs"): string {
  return Math.round(n).toLocaleString(intlLocale(locale));
}

export function formatEur(n: number, locale: Locale = "cs"): string {
  const rounded = Math.round(n);
  const abs = Math.abs(rounded);
  const loc = intlLocale(locale);
  if (abs >= 1_000_000) {
    const value = (rounded / 1_000_000).toLocaleString(loc, { maximumFractionDigits: 2 });
    return locale === "en" ? `${value} M €` : `${value} mil. €`;
  }
  if (abs >= 1_000) {
    const value = (rounded / 1_000).toLocaleString(loc, { maximumFractionDigits: 1 });
    return locale === "en" ? `${value} k €` : `${value} tis. €`;
  }
  return formatNumber(rounded, locale) + " €";
}

export function formatEurPerM2(n: number, locale: Locale = "cs"): string {
  return (
    n.toLocaleString(intlLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
    " €/m²"
  );
}
