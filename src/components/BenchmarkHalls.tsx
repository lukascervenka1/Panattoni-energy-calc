"use client";

import type { Benchmark } from "@/lib/types";
import { formatNumber } from "@/lib/calc";
import { useLocale } from "@/lib/LocaleContext";

export function BenchmarkHalls({ benchmarks }: { benchmarks: Benchmark[] }) {
  const { t, locale } = useLocale();

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] sm:text-xl">
        {t.benchmarks.title}
      </h2>
      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{t.benchmarks.subtitle}</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {benchmarks.map((b) => (
          <div
            key={b.id}
            className="flex flex-col rounded-xl border border-[var(--color-border-default)] p-4 sm:p-5"
            style={{ background: "var(--color-surface)" }}
          >
            <p className="text-sm font-medium leading-snug sm:min-h-10">{b.park}</p>

            <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em] sm:mt-4">
              {formatNumber(b.pneKwhM2, locale)}
              <span className="ml-1.5 text-sm font-normal text-[var(--color-text-muted)]">
                {t.benchmarks.unit}
              </span>
            </p>

            <dl className="mt-4 flex flex-col gap-1 border-t border-[var(--color-border-default)] pt-3 text-xs text-[var(--color-text-muted)]">
              <div className="flex justify-between gap-2">
                <dt>{t.benchmarks.area}</dt>
                <dd className="font-medium text-[var(--color-text)]">
                  {formatNumber(b.areaM2, locale)} m²
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t.benchmarks.elecShare}</dt>
                <dd className="font-medium text-[var(--color-text)]">{b.elecSharePct} %</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
