"use client";

import type { CalculatorResult } from "@/lib/calc";
import { formatEur, formatEurPerM2, formatNumber } from "@/lib/calc";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { Glow } from "./Glow";

function AnimatedValue({ value, format }: { value: number; format: (n: number) => string }) {
  const animated = useAnimatedNumber(value);
  return <>{format(animated)}</>;
}

function AnimatedPct({ value }: { value: number }) {
  const animated = useAnimatedNumber(value);
  return <>{Math.round(animated)}</>;
}

function HeroStat({
  label,
  value,
  format = formatEur,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1 px-6 py-5 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">{label}</p>
      <p className="font-heading text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
        <AnimatedValue value={value} format={format} />
      </p>
    </div>
  );
}

export function ResultsHero({ result }: { result: CalculatorResult }) {
  if (result.isOptimal) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[var(--color-navy)]">
        <Glow />
        <div className="relative p-6 sm:p-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
            Vaše budova je na špičkové úrovni
          </p>
          <p className="font-heading text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
            0 €
          </p>
          <p className="mt-3 text-sm text-white/70">
            Spotřeba {formatNumber(result.currentPneKwhM2)} kWh/(m²·rok) — srovnatelné s
            nejúspornější čtvrtinou portfolia Panattoni.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--color-navy)]">
      <Glow />
      <div className="relative">
        <div className="flex flex-col gap-2 p-6 sm:p-8 sm:pb-7">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">
            Kolik ušetříte na energiích
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-heading text-5xl font-semibold leading-none tracking-[-0.03em] text-white sm:text-6xl">
              −<AnimatedPct value={result.reductionPct} />%
            </span>
            <span className="text-sm text-white/70 sm:text-base">méně energie než dnes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <HeroStat
            label="Úspora na m²"
            value={result.annualSavingsEurPerM2}
            format={formatEurPerM2}
          />
          <HeroStat label="Za 1 rok" value={result.annualSavingsEur} />
          <HeroStat label="Za 5 let" value={result.fiveYearSavingsEur} />
        </div>

        <p className="border-t border-white/10 px-6 py-4 text-sm text-white/60 sm:px-8">
          Spotřeba: {formatNumber(result.currentPneKwhM2)} →{" "}
          {formatNumber(result.referencePneKwhM2)} kWh/(m²·rok) · úspora{" "}
          {formatNumber(result.annualSavingsMwh)} MWh/rok
        </p>
      </div>
    </div>
  );
}
