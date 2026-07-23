import { Logo } from "./Logo";
import { Glow } from "./Glow";

export function Hero() {
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
        <span className="hidden text-xs font-medium tracking-wide text-[#a7adc0] sm:inline">
          Kalkulačka energetické úspory
        </span>
      </div>

      <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6">
        <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-paper)] sm:text-5xl">
          Kolik ušetříte v energeticky úspornější hale?
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[#a7adc0] sm:text-base">
          Zadejte parametry vaší současné budovy a porovnejte roční náklady na energie s
          nejúspornějšími sklady v portfoliu Panattoni.
        </p>
      </div>
    </div>
  );
}
