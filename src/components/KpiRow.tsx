import type { CalculatorResult } from "@/lib/calc";
import { formatEur, formatNumber } from "@/lib/calc";

function KpiCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
    >
      <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="text-xl font-medium sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{unit}</p>
    </div>
  );
}

export function KpiRow({ result }: { result: CalculatorResult }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      <KpiCard label="Úspora energie" value={formatNumber(result.annualSavingsMwh)} unit="MWh / rok" />
      <KpiCard label="Snížení CO₂" value={formatNumber(result.annualCo2SavingsT)} unit="t CO₂ / rok" />
      <KpiCard label="Úspora 10 let" value={formatEur(result.tenYearSavingsEur)} unit="kumulativně" />
    </div>
  );
}
