"use client";

import { useState } from "react";
import type { CalculatorConfig } from "@/lib/types";
import { formatNumber } from "@/lib/calc";

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function Methodology({ config }: { config: CalculatorConfig }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-h-11 items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">Zdroje a metodika výpočtu</span>
        <span className="text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          <p>
            <strong className="text-[var(--color-text)]">Referenční hodnota</strong> (
            {formatNumber(config.referencePneKwhM2)} kWh/(m²·rok)) odpovídá nejúspornější čtvrtině
            (P25) měřené spotřeby ve skladových a logistických halách portfolia Panattoni (interní
            data, N=35 hal, 2023–2024) — reálný, dosažitelný cíl, ne teoretické minimum.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Výchozí odhad spotřeby dle PENB třídy</strong>{" "}
            vychází tam, kde je k dispozici, z mediánu naměřených dat portfolia (třídy B a C, malé
            vzorky N=4 a N=10). Třídy bez dostatku portfoliových dat (A, D–G) jsou dopočítány
            odhadem konzistentním s hranicí pro TOP 15 % nejúspornějších budov kategorie
            &bdquo;Budova pro výrobu a skladování&rdquo; (třída C ≤ 143 kWh/(m²·rok)) dle studie{" "}
            <em>TOP 15 % energeticky nejúspornějších budov v ČR</em> (Česká spořitelna / CEVRE
            Consultants / EnergySim, 2024, finální hybridní metoda, databáze ENEX MPO). Vždy je ale
            lepší nahradit odhad skutečnou naměřenou spotřebou z vyúčtování.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Rok výstavby</strong> záměrně{" "}
            <strong className="text-[var(--color-text)]">není</strong> vstupem do výpočtu. Stejná
            studie (str. 30) na reálných datech ověřila, že rok výstavby nekoreluje spolehlivě s
            energetickou náročností budovy, a EU Taxonomie výslovně nedoporučuje používat jej jako
            náhradní ukazatel. Naše vlastní portfolio to potvrzuje — bez přímé souvislosti mezi
            stářím haly a naměřenou spotřebou.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Ceny energií a emisní faktory:</strong>{" "}
            elektřina {formatPrice(config.elePriceEurKwh)} €/kWh, plyn{" "}
            {formatPrice(config.gasPriceEurKwh)} €/kWh (reálné průměrné sazby portfolia Panattoni,
            2024). Emisní faktory: ELE dle skladby ČR mixu (ERÚ/ČHMÚ, ø 0,36 t/MWh), plyn dle
            spalování zemního plynu (MPO/IPCC, ø 0,202 t/MWh). Podíl ELE/plyn ve výchozím odhadu
            spotřeby ({Math.round(config.eleShareDefault * 100)} % / {Math.round(config.gasShareDefault * 100)} %) odpovídá
            skutečnému mixu naměřenému v portfoliu skladových hal za rok 2024.
          </p>
          <p className="text-[11px]">
            Tato data slouží jako orientační odhad pro účely prvotní kalkulace. Pro přesnou
            nabídku vždy kontaktujte svého Panattoni account manažera.
          </p>
        </div>
      )}
    </div>
  );
}
