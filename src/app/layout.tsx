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

export const metadata: Metadata = {
  title: "Kalkulačka energetické úspory | Panattoni",
  description:
    "Spočítejte si možnou úsporu nákladů na energie při přechodu do energeticky úspornější haly Panattoni.",
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
