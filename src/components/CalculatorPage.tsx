"use client";

import { useState } from "react";
import type { Building, CalculatorConfig, DataSourceStatus, PenbClass } from "@/lib/types";
import { calculateSavings, formatNumber, suggestConsumptionSplit } from "@/lib/calc";
import { Header } from "./Header";
import { CardHeader } from "./CardHeader";
import { ClassPicker } from "./ClassPicker";
import { SliderField } from "./SliderField";
import { ResultsHero } from "./ResultsHero";
import { KpiRow } from "./KpiRow";
import { BuildingsTable } from "./BuildingsTable";
import { Methodology } from "./Methodology";
import { DataStatusBadge } from "./DataStatusBadge";

const DEFAULT_CLASS: PenbClass = "C";
const DEFAULT_AREA = 15000;

export function CalculatorPage({
  buildings,
  config,
  status,
}: {
  buildings: Building[];
  config: CalculatorConfig;
  status: DataSourceStatus;
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
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-6 sm:px-6 sm:py-10">
          <DataStatusBadge status={status} />

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Kolik ušetříte v energeticky úspornější hale?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Zadejte parametry vaší současné budovy a porovnejte roční náklady na energie s
              nejúspornějšími sklady v portfoliu Panattoni.
            </p>
          </div>

          <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
          >
            <CardHeader step={1} label="Třída PENB vaší stávající budovy" />
            <ClassPicker config={config} value={cls} onChange={handleClassChange} />
          </section>

          <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
          >
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
          </section>

          <ResultsHero result={result} />
          <KpiRow result={result} />
          <BuildingsTable buildings={buildings} highlightClass={cls} />
          <Methodology config={config} />
        </div>
      </main>
      <footer
        className="border-t py-6 text-center text-[11px]"
        style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}
      >
        © {new Date().getFullYear()} Panattoni. Kalkulačka slouží pro orientační odhad, nejde o
        závaznou nabídku.
      </footer>
    </>
  );
}
