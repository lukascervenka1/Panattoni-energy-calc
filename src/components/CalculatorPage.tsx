"use client";

import { useState } from "react";
import type { Building, CalculatorConfig, PenbClass } from "@/lib/types";
import { calculateSavings, formatNumber, suggestConsumptionSplit } from "@/lib/calc";
import { Hero } from "./Hero";
import { CardHeader } from "./CardHeader";
import { ClassPicker } from "./ClassPicker";
import { SliderField } from "./SliderField";
import { ResultsHero } from "./ResultsHero";
import { KpiRow } from "./KpiRow";
import { CtaBanner } from "./CtaBanner";
import { BuildingsTable } from "./BuildingsTable";
import { Methodology } from "./Methodology";
import { Footer } from "./Footer";

const DEFAULT_CLASS: PenbClass = "C";
const DEFAULT_AREA = 15000;

export function CalculatorPage({
  buildings,
  config,
}: {
  buildings: Building[];
  config: CalculatorConfig;
}) {
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
              <CardHeader step={1} label="Třída PENB vaší stávající budovy" />
              <ClassPicker config={config} value={cls} onChange={handleClassChange} />
            </div>

            <div className="border-t p-5 sm:p-6" style={{ borderColor: "var(--color-border-default)" }}>
              <CardHeader step={2} label="Parametry budovy" />
              <div className="flex flex-col gap-5">
                <SliderField
                  label="Pronajatá plocha"
                  value={areaM2}
                  min={500}
                  max={200000}
                  step={500}
                  unit="m²"
                  onChange={setAreaM2}
                  formatValue={formatNumber}
                />
                <SliderField
                  label="Spotřeba ELE"
                  value={eleKwhM2}
                  min={0}
                  max={600}
                  step={5}
                  unit="kWh/m²"
                  onChange={setEleKwhM2}
                  formatValue={formatNumber}
                />
                <SliderField
                  label="Spotřeba plyn"
                  value={gasKwhM2}
                  min={0}
                  max={400}
                  step={5}
                  unit="kWh/m²"
                  onChange={setGasKwhM2}
                  formatValue={formatNumber}
                />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                Výchozí hodnoty spotřeby jsou odhad na základě zvolené třídy PENB — jakmile znáte
                skutečnou spotřebu budovy z vyúčtování, upravte posuvníky podle ní pro přesnější
                výsledek.
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

          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
          >
            <div className="p-5 sm:p-6">
              <BuildingsTable buildings={buildings} highlightClass={cls} />
            </div>
            <div className="border-t p-5 sm:p-6" style={{ borderColor: "var(--color-border-default)" }}>
              <Methodology config={config} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
