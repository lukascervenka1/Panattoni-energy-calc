import type { CalculatorResult } from "@/lib/calc";
import { formatNumber } from "@/lib/calc";
import { BoltIcon, LeafIcon } from "./icons";

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-5 py-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        <span style={{ color: "var(--color-accent)" }}>{icon}</span>
        {label}
      </div>
      <p className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
        {value} <span className="text-sm font-normal text-[var(--color-text-muted)]">{unit}</span>
      </p>
    </div>
  );
}

export function KpiRow({ result }: { result: CalculatorResult }) {
  return (
    <div
      className="flex flex-col divide-y divide-[var(--color-border-default)] rounded-xl border border-[var(--color-border-default)] sm:flex-row sm:divide-x sm:divide-y-0"
      style={{ background: "var(--color-surface)" }}
    >
      <Stat
        icon={<BoltIcon className="h-3.5 w-3.5" />}
        label="Úspora energie"
        value={formatNumber(result.annualSavingsMwh)}
        unit="MWh / rok"
      />
      <Stat
        icon={<LeafIcon className="h-3.5 w-3.5" />}
        label="Snížení CO₂"
        value={formatNumber(result.annualCo2SavingsT)}
        unit="t CO₂ / rok"
      />
    </div>
  );
}
