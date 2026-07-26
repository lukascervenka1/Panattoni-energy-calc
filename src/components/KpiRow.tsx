import type { CalculatorResult } from "@/lib/calc";
import { formatNumber } from "@/lib/calc";
import { LeafIcon } from "./icons";

export function KpiRow({ result }: { result: CalculatorResult }) {
  return (
    <div
      className="rounded-xl border border-[var(--color-border-default)] px-5 py-4 sm:p-5"
      style={{ background: "var(--color-surface)" }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        <span style={{ color: "var(--color-accent)" }}>
          <LeafIcon className="h-3.5 w-3.5" />
        </span>
        Snížení CO₂
      </div>
      <p className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
        {formatNumber(result.annualCo2SavingsT)}{" "}
        <span className="text-sm font-normal text-[var(--color-text-muted)]">t CO₂ / rok</span>
      </p>
    </div>
  );
}
