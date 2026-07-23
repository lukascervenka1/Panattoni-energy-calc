import type { CalculatorResult } from "@/lib/calc";
import { formatEur, formatNumber } from "@/lib/calc";

export function ResultsHero({ result }: { result: CalculatorResult }) {
  if (result.isOptimal) {
    return (
      <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-6 sm:p-7">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
          Vaše budova je na špičkové úrovni
        </p>
        <p className="text-4xl font-light tracking-tight text-[var(--color-accent)] sm:text-5xl">
          0 €
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Spotřeba {formatNumber(result.currentPneKwhM2)} kWh/(m²·rok) — srovnatelné s
          nejúspornější čtvrtinou portfolia Panattoni.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-50 p-6 dark:bg-emerald-500/10 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Roční úspora nákladů na energie
        </p>
        <p className="text-4xl font-light tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-5xl">
          {formatEur(result.annualSavingsEur)}
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Spotřeba: {formatNumber(result.currentPneKwhM2)} →{" "}
          {formatNumber(result.referencePneKwhM2)} kWh/(m²·rok) · úspora{" "}
          {formatNumber(result.annualSavingsMwh)} MWh/rok
        </p>
      </div>
      <div className="flex-shrink-0 self-start rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white sm:self-center">
        −{result.reductionPct}% energie
      </div>
    </div>
  );
}
