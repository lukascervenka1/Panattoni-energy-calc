import type { Metadata } from "next";
import { Bai_Jamjuree, Rubik } from "next/font/google";
import { LocaleProvider } from "@/lib/LocaleContext";
import "./globals.css";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const TITLE = "Kalkulačka energetické úspory | Panattoni";
const DESCRIPTION =
  "Spočítejte si možnou úsporu nákladů na energie při přechodu do energeticky úspornější haly Panattoni.";

/**
 * Absolute URLs for the share card. Set SITE_URL to the production domain;
 * on Vercel we fall back to the deployment's own URL, and locally to
 * localhost so `next build` doesn't warn.
 */
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Panattoni Energy Calculator",
  // The link gets pasted into email, Teams and LinkedIn — without these it
  // renders as a bare URL with no title, description or image.
  openGraph: {
    type: "website",
    siteName: "Panattoni",
    title: TITLE,
    description: DESCRIPTION,
    locale: "cs_CZ",
    alternateLocale: ["en_GB"],
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${baiJamjuree.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
