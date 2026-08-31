"use client";

import { useState } from "react";
import type { CalculatorConfig } from "@/lib/types";
import { useLocale } from "@/lib/LocaleContext";

function formatPrice(n: number, locale: string): string {
  return n.toLocaleString(locale === "en" ? "en-GB" : "cs-CZ", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function Methodology({ config }: { config: CalculatorConfig }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const unit = locale === "en" ? "kWh/(m²·yr)" : "kWh/(m²·rok)";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-h-11 items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{t.methodology.toggle}</span>
        <span className="text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          <p>
            <strong className="text-[var(--color-text)]">{t.methodology.referenceLabel}</strong> (
            {config.referencePneKwhM2.toLocaleString(locale === "en" ? "en-GB" : "cs-CZ")} {unit}){" "}
            {t.methodology.referenceText}
          </p>
          <p>
            <strong className="text-[var(--color-text)]">{t.methodology.classEstimateLabel}</strong>{" "}
            {t.methodology.classEstimateText}
          </p>
          <p>
            <strong className="text-[var(--color-text)]">{t.methodology.pricesLabel}</strong>{" "}
            {locale === "en" ? "electricity" : "elektřina"} {formatPrice(config.elePriceEurKwh, locale)}{" "}
            €/kWh, {locale === "en" ? "gas" : "plyn"} {formatPrice(config.gasPriceEurKwh, locale)} €/kWh.{" "}
            {t.methodology.pricesMidText}
            {Math.round(config.eleShareDefault * 100)} % / {Math.round(config.gasShareDefault * 100)} %
            {t.methodology.pricesTailText}
          </p>
          <p className="text-[11px]">{t.methodology.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
