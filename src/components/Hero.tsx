"use client";

import { Logo } from "./Logo";
import { Glow } from "./Glow";
import { LanguageToggle } from "./LanguageToggle";
import { useLocale } from "@/lib/LocaleContext";

export function Hero() {
  const { t } = useLocale();

  return (
    <div className="relative overflow-hidden bg-[var(--color-navy)]">
      <Glow />
      <div className="relative mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-6">
        <a
          href="https://panattonieurope.com/en"
          target="_blank"
          rel="noreferrer"
          aria-label="Panattoni Europe"
        >
          <Logo height={20} />
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium tracking-wide text-[#a7adc0] sm:inline">
            {t.hero.navLabel}
          </span>
          <LanguageToggle />
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6">
        <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-paper)] sm:text-5xl">
          {t.hero.title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[#a7adc0] sm:text-base">
          {t.hero.subtitle}
        </p>
        <p className="mt-5 inline-block rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80">
          {t.hero.scope}
        </p>
      </div>
    </div>
  );
}
