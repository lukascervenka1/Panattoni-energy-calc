import { Glow } from "./Glow";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[var(--color-navy)]">
      <Glow />
      <div className="relative mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <div className="flex flex-col gap-1 text-sm text-white/80">
          <p>V Celnici 1034/6, 110 00 Praha 1</p>
          <p>
            <a href="tel:+420226220550" className="hover:text-white">
              +420 226 220 550
            </a>
          </p>
          <p>
            <a href="mailto:czinfo@panattoni.com" className="hover:text-white">
              czinfo@panattoni.com
            </a>
          </p>
        </div>
        <p className="mt-5 border-t border-white/10 pt-5 text-[11px] text-white/50">
          © {new Date().getFullYear()} Panattoni. Kalkulačka slouží pro orientační odhad, nejde o
          závaznou nabídku.
        </p>
      </div>
    </footer>
  );
}
