"use client";

import type { CalculatorResult } from "@/lib/calc";
import { formatEur, formatEurPerM2, formatNumber } from "@/lib/calc";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { useLocale } from "@/lib/LocaleContext";
import { Glow } from "./Glow";

function AnimatedValue({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
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
  format,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
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
  const { t, locale } = useLocale();
  const eur = (n: number) => formatEur(n, locale);
  const eurPerM2 = (n: number) => formatEurPerM2(n, locale);
  const num = (n: number) => formatNumber(n, locale);

  if (result.isOptimal) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[var(--color-navy)]">
        <Glow />
        <div className="relative p-6 sm:p-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
            {t.results.optimalEyebrow}
          </p>
          <p className="font-heading text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
            {formatEur(0, locale)}
          </p>
          <p className="mt-3 text-sm text-white/70">
            {t.results.optimalConsumptionPrefix} {num(result.currentPneKwhM2)}{" "}
            {t.results.optimalConsumptionSuffix}
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
            {t.results.eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-heading text-5xl font-semibold leading-none tracking-[-0.03em] text-white sm:text-6xl">
              −<AnimatedPct value={result.reductionPct} />%
            </span>
            <span className="text-sm text-white/70 sm:text-base">{t.results.reductionSuffix}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <HeroStat
            label={t.results.perM2Label}
            value={result.annualSavingsEurPerM2}
            format={eurPerM2}
          />
          <HeroStat label={t.results.year1Label} value={result.annualSavingsEur} format={eur} />
          <HeroStat label={t.results.year5Label} value={result.fiveYearSavingsEur} format={eur} />
        </div>

        <p className="border-t border-white/10 px-6 py-4 text-sm text-white/60 sm:px-8">
          {t.results.consumptionPrefix} {num(result.currentPneKwhM2)} → {num(result.referencePneKwhM2)}{" "}
          kWh/(m²·{locale === "en" ? "yr" : "rok"}) {t.results.savingsInfix} {num(result.annualSavingsMwh)}{" "}
          {t.results.perYear}
        </p>
      </div>
    </div>
  );
}
