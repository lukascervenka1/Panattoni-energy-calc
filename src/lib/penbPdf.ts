import { getResolvedPDFJS } from "unpdf";
import type { PdfPage } from "./penb";

/**
 * A PENB protocol is ~5–25 pages, but older certificates often append the
 * full calculation printout (up to ~110 pages seen) — which is exactly where
 * their readable numbers are. Beyond this it is not a certificate.
 */
export const MAX_PDF_PAGES = 150;
/**
 * The 110-page certificate above has ~33k text items. Far beyond that is a
 * file built to make the parser do needless work.
 */
export const MAX_TEXT_ITEMS = 200_000;

export type PdfExtractionCode = "unreadable" | "too_many_pages" | "too_much_text";

export class PdfExtractionError extends Error {
  readonly code: PdfExtractionCode;
  constructor(code: PdfExtractionCode) {
    super(code);
    this.code = code;
  }
}

/**
 * Turns an uploaded PDF into positioned text items. pdf.js only parses here —
 * nothing is rendered, no fonts are loaded and no embedded scripts run.
 *
 * Time and memory are not bounded here: pdf.js decodes a stream in one
 * synchronous go, so nothing on this thread could interrupt it. That's why
 * this only ever runs in a worker (see penbReader.ts), which can be killed.
 */
export async function extractPdfPages(bytes: Uint8Array): Promise<PdfPage[]> {
  const { getDocument } = await getResolvedPDFJS();
  // pdf.js 6 no longer has an eval-based font path at all (the source of
  // CVE-2024-4367), so there's no `isEvalSupported` to turn off.
  const loadingTask = getDocument({
    data: bytes,
    disableFontFace: true,
    useSystemFonts: false,
    enableXfa: false,
    // Errors only. Otherwise every certificate set in a standard font logs
    // a warning about font data we deliberately don't ship (text positions
    // don't need it).
    verbosity: 0,
  });

  try {
    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch {
      throw new PdfExtractionError("unreadable");
    }
    if (pdf.numPages > MAX_PDF_PAGES) throw new PdfExtractionError("too_many_pages");

    const pages: PdfPage[] = [];
    let itemCount = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      itemCount += content.items.length;
      if (itemCount > MAX_TEXT_ITEMS) throw new PdfExtractionError("too_much_text");
      pages.push(
        content.items.flatMap((item) =>
          "str" in item ? [{ str: item.str, x: item.transform[4], y: item.transform[5] }] : [],
        ),
      );
      page.cleanup();
    }
    return pages;
  } catch (err) {
    // A broken page tree or content stream surfaces from pdf.js as a plain
    // Error — that's still just an unreadable upload, not a server fault.
    throw err instanceof PdfExtractionError ? err : new PdfExtractionError("unreadable");
  } finally {
    await loadingTask.destroy();
  }
}
