"use client";

import { useState } from "react";
import type { Benchmark, CalculatorConfig, PenbClass } from "@/lib/types";
import { calculateSavings, formatNumber, suggestConsumptionSplit } from "@/lib/calc";
import { useLocale } from "@/lib/LocaleContext";
import { Hero } from "./Hero";
import { CardHeader } from "./CardHeader";
import { ClassPicker } from "./ClassPicker";
import { SliderField } from "./SliderField";
import { ResultsHero } from "./ResultsHero";
import { KpiRow } from "./KpiRow";
import { CtaBanner } from "./CtaBanner";
import { BenchmarkHalls } from "./BenchmarkHalls";
import { Methodology } from "./Methodology";
import { Footer } from "./Footer";

const DEFAULT_CLASS: PenbClass = "C";
const DEFAULT_AREA = 15000;

export function CalculatorPage({
  benchmarks,
  config,
}: {
  benchmarks: Benchmark[];
  config: CalculatorConfig;
}) {
  const { t, locale } = useLocale();
  const [cls, setCls] = useState<PenbClass>(DEFAULT_CLASS);
  const [areaM2, setAreaM2] = useState(DEFAULT_AREA);
  const initialSplit = suggestConsumptionSplit(config.classDefaultsKwhM2[DEFAULT_CLASS], config);
  const [eleKwhM2, setEleKwhM2] = useState(initialSplit.eleKwhM2);
  const [gasKwhM2, setGasKwhM2] = useState(initialSplit.gasKwhM2);

  function handleClassChange(next: PenbClass) {
    setCls(next);
    const split = suggestConsumptionSplit(config.classDefaultsKwhM2[next], config);
    setEleKwhM2(split.eleKwhM2);
    setGasKwhM2(split.gasKwhM2);
  }

  const result = calculateSavings({ areaM2, eleKwhM2, gasKwhM2 }, config);
  const fmt = (n: number) => formatNumber(n, locale);

  // Tenants read totals off an invoice (MWh/year), not intensity, so the editable
  // field speaks MWh while the calculation keeps working in kWh/m².
  const toMwh = (kwhM2: number) => (kwhM2 * areaM2) / 1000;
  const fromMwh = (mwh: number) => (mwh * 1000) / areaM2;

  return (
    <>
      <Hero />
      <main className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:gap-8 sm:px-6 sm:py-10">
          <section
            className="animate-rise-in overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
          >
            <div className="p-5 sm:p-6">
              <CardHeader step={1} label={t.step1Label} />
              <div className="flex flex-col gap-5">
                <SliderField
                  label={t.sliders.area}
                  value={areaM2}
                  min={500}
                  max={200000}
                  step={500}
                  unit="m²"
                  onChange={setAreaM2}
                  locale={locale}
                />
                <SliderField
                  label={t.sliders.ele}
                  value={eleKwhM2}
                  min={0}
                  max={600}
                  step={5}
                  unit={t.sliders.mwhUnit}
                  onChange={setEleKwhM2}
                  locale={locale}
                  decimals={1}
                  toDisplay={toMwh}
                  fromDisplay={fromMwh}
                  hint={`${fmt(eleKwhM2)} kWh/m²`}
                />
                <SliderField
                  label={t.sliders.gas}
                  value={gasKwhM2}
                  min={0}
                  max={400}
                  step={5}
                  unit={t.sliders.mwhUnit}
                  onChange={setGasKwhM2}
                  locale={locale}
                  decimals={1}
                  toDisplay={toMwh}
                  fromDisplay={fromMwh}
                  hint={`${fmt(gasKwhM2)} kWh/m²`}
                />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                {t.sliders.helper}
              </p>
            </div>

            <div className="border-t p-5 sm:p-6" style={{ borderColor: "var(--color-border-default)" }}>
              <CardHeader step={2} label={t.step2Label} />
              <ClassPicker value={cls} onChange={handleClassChange} />
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                {t.classHelper}
              </p>
            </div>
          </section>

          <div className="animate-rise-in [animation-delay:80ms]">
            <ResultsHero result={result} />
          </div>

          <div className="animate-rise-in [animation-delay:140ms]">
            <KpiRow result={result} />
          </div>

          <CtaBanner />

          <BenchmarkHalls benchmarks={benchmarks} />

          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
          >
            <div className="p-5 sm:p-6">
              <Methodology config={config} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
