import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="bg-[var(--color-navy)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-6">
        <a href="https://panattonieurope.com/en" target="_blank" rel="noreferrer" aria-label="Panattoni Europe">
          <Logo height={22} />
        </a>
        <span className="hidden text-xs font-medium tracking-wide text-[#a7adc0] sm:inline">
          Kalkulačka energetické úspory
        </span>
      </div>
    </header>
  );
}
