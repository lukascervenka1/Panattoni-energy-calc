"use client";

import { useLocale } from "@/lib/LocaleContext";
import { Logo } from "./Logo";
import { Glow } from "./Glow";
import { GlobeIcon, MailIcon, PhoneIcon, PinIcon } from "./icons";

function ContactRow({
  icon,
  href,
  children,
}: {
  icon: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
        {icon}
      </span>
      <span>{children}</span>
    </>
  );
  const className = "flex items-center gap-2.5 text-xs text-white/80";
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`${className} transition-colors hover:text-white`}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="relative overflow-hidden bg-[var(--color-navy)]">
      <Glow />
      <div className="relative mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo height={16} />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/50">
              {t.footer.credibility}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <ContactRow icon={<PinIcon className="h-3.5 w-3.5" />}>{t.footer.address}</ContactRow>
            <ContactRow icon={<PhoneIcon className="h-3.5 w-3.5" />} href="tel:+420226220550">
              +420 226 220 550
            </ContactRow>
            <ContactRow icon={<MailIcon className="h-3.5 w-3.5" />} href="mailto:czinfo@panattoni.com">
              czinfo@panattoni.com
            </ContactRow>
            <ContactRow icon={<GlobeIcon className="h-3.5 w-3.5" />} href={t.footer.websiteUrl}>
              {t.footer.website}
            </ContactRow>
          </div>
        </div>

        <p className="mt-5 border-t border-white/10 pt-4 text-[11px] text-white/50">
          © {new Date().getFullYear()} Panattoni. {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
