"use client";

import { useState } from "react";
import type { Benchmark, CalculatorConfig, PenbClass } from "@/lib/types";
import { calculateSavings, formatNumber, suggestConsumptionSplit } from "@/lib/calc";
import { clampToRange } from "@/lib/numberInput";
import type { PenbValues } from "@/lib/penbUpload";
import { useLocale } from "@/lib/LocaleContext";
import { Hero } from "./Hero";
import { CardHeader } from "./CardHeader";
import { ClassPicker } from "./ClassPicker";
import { PenbUpload } from "./PenbUpload";
import { SliderField } from "./SliderField";
import { ResultsHero } from "./ResultsHero";
import { KpiRow } from "./KpiRow";
import { CtaBanner } from "./CtaBanner";
import { BenchmarkHalls } from "./BenchmarkHalls";
import { Methodology } from "./Methodology";
import { Footer } from "./Footer";

const DEFAULT_CLASS: PenbClass = "C";
const DEFAULT_AREA = 15000;

// 250 000 m² so an uploaded certificate for one of the largest parks (e.g.
// 211 537 m²) isn't silently clipped.
const AREA_RANGE = { min: 500, max: 250000 };
const ELE_RANGE = { min: 0, max: 500 };
const GAS_RANGE = { min: 0, max: 350 };

export function CalculatorPage({
  benchmarks,
  config,
}: {
  benchmarks: Benchmark[];
  config: CalculatorConfig;
}) {
  const { t, locale } = useLocale();
  const [cls, setCls] = useState<PenbClass | null>(DEFAULT_CLASS);
  const [areaM2, setAreaM2] = useState(DEFAULT_AREA);
  const initialSplit = suggestConsumptionSplit(config.classDefaultsKwhM2[DEFAULT_CLASS], config);
  const [eleKwhM2, setEleKwhM2] = useState(initialSplit.eleKwhM2);
  const [gasKwhM2, setGasKwhM2] = useState(initialSplit.gasKwhM2);
  const [fromCertificate, setFromCertificate] = useState(false);

  function handleClassChange(next: PenbClass) {
    setCls(next);
    setFromCertificate(false);
    const split = suggestConsumptionSplit(config.classDefaultsKwhM2[next], config);
    setEleKwhM2(split.eleKwhM2);
    setGasKwhM2(split.gasKwhM2);
  }

  // Intensity comes from the certificate's own floor area — it's a property
  // of the building. The leased-area field then only scales the totals, so a
  // visitor renting part of the hall can still correct it afterwards.
  function handleCertificate(values: PenbValues) {
    setCls(null);
    setFromCertificate(true);
    // Smaller than any hall the calculator covers: the certificate is still
    // stored, but every slider simply drops to its minimum (business
    // decision) rather than showing figures scaled up to 500 m².
    if (values.areaM2 < AREA_RANGE.min) {
      setAreaM2(AREA_RANGE.min);
      setEleKwhM2(ELE_RANGE.min);
      setGasKwhM2(GAS_RANGE.min);
      return;
    }
    setAreaM2(clampToRange(Math.round(values.areaM2), AREA_RANGE.min, AREA_RANGE.max));
    const perM2 = (mwh: number) => (mwh * 1000) / values.areaM2;
    setEleKwhM2(clampToRange(perM2(values.eleMwh), ELE_RANGE.min, ELE_RANGE.max));
    setGasKwhM2(clampToRange(perM2(values.gasMwh), GAS_RANGE.min, GAS_RANGE.max));
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
                  min={AREA_RANGE.min}
                  max={AREA_RANGE.max}
                  step={500}
                  unit="m²"
                  onChange={setAreaM2}
                  locale={locale}
                />
                <SliderField
                  label={t.sliders.ele}
                  value={eleKwhM2}
                  min={ELE_RANGE.min}
                  max={ELE_RANGE.max}
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
                  min={GAS_RANGE.min}
                  max={GAS_RANGE.max}
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
              <PenbUpload active={fromCertificate} onLoaded={handleCertificate} />
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1" style={{ background: "var(--color-border-default)" }} />
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t.penb.orPickClass}
                </span>
                <span className="h-px flex-1" style={{ background: "var(--color-border-default)" }} />
              </div>
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
