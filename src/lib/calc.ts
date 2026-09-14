import type { CalculatorConfig } from "./types";
import type { Locale } from "./i18n";

export interface CalculatorInputs {
  areaM2: number;
  eleKwhM2: number;
  gasKwhM2: number;
}

export interface CalculatorResult {
  /** Consumption is already at or below the reference — nothing left to sell. */
  isOptimal: boolean;
  /**
   * Consumption is above the reference (so `reductionPct`/`annualSavingsMwh`
   * are real), but switching to the reference building's mix wouldn't lower
   * cost or emissions at today's prices — electricity costs more per kWh
   * than gas, so a building that's already efficient but gas-heavy can lose
   * on money even while it would use less energy. `annualSavingsEur` etc.
   * are floored at 0 in this case; check this flag before implying a
   * financial win the visitor won't actually see.
   */
  hasFinancialSavings: boolean;
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
      hasFinancialSavings: false,
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

  // The current building is priced/emitted at whatever mix the visitor
  // entered. The reference (offered) building is priced/emitted at its own
  // fixed mix — set by business decision (referenceEleSharePct), not by
  // mirroring the visitor's input. A visitor with an all-gas building must
  // not make the *reference* building look gas-heavy too.
  const currentCostPerM2 =
    inputs.eleKwhM2 * config.elePriceEurKwh + inputs.gasKwhM2 * config.gasPriceEurKwh;
  const currentCo2PerM2 =
    inputs.eleKwhM2 * config.eleCo2TPerKwh + inputs.gasKwhM2 * config.gasCo2TPerKwh;

  const referenceEleKwhM2 = referencePneKwhM2 * config.referenceEleSharePct;
  const referenceGasKwhM2 = referencePneKwhM2 * (1 - config.referenceEleSharePct);
  const referenceCostPerM2 =
    referenceEleKwhM2 * config.elePriceEurKwh + referenceGasKwhM2 * config.gasPriceEurKwh;
  const referenceCo2PerM2 =
    referenceEleKwhM2 * config.eleCo2TPerKwh + referenceGasKwhM2 * config.gasCo2TPerKwh;

  const deltaKwh = (currentPneKwhM2 - referencePneKwhM2) * inputs.areaM2;
  const reductionPct = Math.round((1 - referencePneKwhM2 / currentPneKwhM2) * 100);

  // Switching to the reference mix isn't always cheaper or cleaner for a
  // building that's already efficient but gas-heavy — electricity costs
  // more per kWh than gas. Never show the visitor a negative "saving";
  // floor each figure at zero rather than let the sign flip. Record the
  // pre-floor sign separately so the UI can tell "saves €0" (a real
  // financial wash) apart from "would have lost money".
  const rawSavingsEurPerM2 = currentCostPerM2 - referenceCostPerM2;
  const annualSavingsEurPerM2 = Math.max(0, rawSavingsEurPerM2);
  const annualSavingsEur = Math.round(annualSavingsEurPerM2 * inputs.areaM2);
  const annualCo2SavingsT = Math.max(
    0,
    Math.round((currentCo2PerM2 - referenceCo2PerM2) * inputs.areaM2),
  );

  return {
    isOptimal: false,
    hasFinancialSavings: rawSavingsEurPerM2 > 0,
    currentPneKwhM2,
    referencePneKwhM2,
    reductionPct,
    annualSavingsEur,
    annualSavingsEurPerM2,
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
