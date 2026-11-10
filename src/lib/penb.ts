/**
 * Reads the numbers the calculator needs out of a Czech energy performance
 * certificate (PENB, vyhláška 264/2020 Sb.).
 *
 * Works on positioned text items rather than a flat text dump, because the
 * protocol's tables don't survive flattening: in section B ("Celková dodaná
 * energie") each energy-carrier label sits vertically *between* its
 * percentage row and its MWh row, so reading line by line pairs labels with
 * the wrong numbers.
 *
 * Pure and framework-free (no pdf.js import) so it can be unit-tested on
 * synthetic input — src/lib/penbPdf.ts turns an actual PDF into `PdfPage[]`.
 */

export interface PdfTextItem {
  str: string;
  x: number;
  /** PDF user-space y — grows upwards, so a higher y is higher on the page. */
  y: number;
}

export type PdfPage = PdfTextItem[];

/**
 * What the visitor actually pays for, and what they don't.
 * `ambient` is heat a heat pump pulls from the air or ground — the PENB counts
 * it as "delivered energy", but nobody is billed for it, so it must never
 * reach the cost calculation.
 */
export type CarrierKind = "electricity" | "gas" | "otherFuel" | "ambient";

export interface PenbCarrier {
  kind: CarrierKind;
  /** Label exactly as printed, for the stored record. */
  label: string;
  mwh: number;
}

export interface PenbExtraction {
  /** Celková energeticky vztažná plocha (conditioned floor area), m². */
  areaM2: number | null;
  carriers: PenbCarrier[];
  electricityMwh: number;
  gasMwh: number;
  /** District heat, LPG, oil, coal, biomass… — priced as gas by the calculator. */
  otherFuelMwh: number;
  ambientMwh: number;
  /** The table's own "MWh/rok" total row, used to cross-check the carriers. */
  totalDeliveredMwh: number | null;
  /** True when the carriers add up to the table's total (±1 %). */
  consistent: boolean;
  certificateNumber: string | null;
  municipality: string | null;
  buildingUse: string | null;
  issuedOn: string | null;
}

export type PenbParseError = "no_text" | "not_penb" | "no_values";

export type PenbParseResult =
  | { ok: true; extraction: PenbExtraction }
  | { ok: false; error: PenbParseError };

/** Row grouping tolerance: items within this many points share a row. */
const ROW_TOLERANCE = 2.5;
/** How far above/below a carrier label its value rows may sit. */
const LABEL_REACH = 14;
/** Below this much text, the PDF is almost certainly a scan. */
const MIN_TEXT_CHARS = 200;

/** Lowercase, strip diacritics, collapse whitespace — for label matching only. */
export function normalizeLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses a number as printed in a PENB: "981.3", "83,9", "30 366,3",
 * "1.234,5". Returns null for anything else — including percentages and the
 * "---" placeholder for an empty cell.
 */
export function parseCzNumber(raw: string): number | null {
  const s = raw.replace(/[\s  ]/g, "");
  if (s === "" || s.includes("%")) return null;

  let normalized: string;
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+,\d+$/.test(s)) {
    normalized = s.replace(",", ".");
  } else if (/^-?\d+(\.\d+)?$/.test(s)) {
    normalized = s;
  } else {
    return null;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

interface Row {
  page: number;
  y: number;
  items: PdfTextItem[];
  text: string;
  norm: string;
}

function buildRows(pages: PdfPage[]): Row[] {
  const rows: Row[] = [];
  pages.forEach((items, page) => {
    const sorted = items
      .filter((i) => i.str.trim() !== "")
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const pageRows: { y: number; items: PdfTextItem[] }[] = [];
    for (const item of sorted) {
      // Items arrive top-down, so rows are created top-down too and only the
      // last few can be within reach. Walk back to the first of them — the
      // row a scan from the top would pick — without rescanning the page.
      let row: (typeof pageRows)[number] | undefined;
      for (let k = pageRows.length - 1; k >= 0 && pageRows[k].y - item.y <= ROW_TOLERANCE; k--) {
        row = pageRows[k];
      }
      if (row) row.items.push(item);
      else pageRows.push({ y: item.y, items: [item] });
    }

    for (const r of pageRows) {
      r.items.sort((a, b) => a.x - b.x);
      const text = r.items.map((i) => i.str.trim()).join(" ");
      rows.push({ page, y: r.y, items: r.items, text, norm: normalizeLabel(text) });
    }
  });
  return rows;
}

function numbersIn(row: Row, rightOf = -Infinity): number[] {
  return row.items
    .filter((i) => i.x > rightOf)
    .map((i) => parseCzNumber(i.str))
    .filter((n): n is number => n !== null);
}

/** Rightmost number in a row — the "Celkem" column in every PENB table. */
function rowTotal(row: Row, rightOf = -Infinity): number | null {
  const nums = numbersIn(row, rightOf);
  return nums.length > 0 ? nums[nums.length - 1] : null;
}

function classifyCarrier(label: string): CarrierKind | null {
  const n = normalizeLabel(label);
  // Section C lists exported PV electricity as its own row; never a purchase.
  if (/mimo budovu|export/.test(n)) return null;
  if (/^energie okolniho prostredi/.test(n)) return "ambient";
  if (/^elektr(ina|icka energie)/.test(n)) return "electricity";
  if (/^(zemni )?plyn/.test(n)) return "gas";
  if (
    /^(szte|soustava zasobovani|teplo|dalkov|lto|topny olej|lehky topny|propan|lpg|uhli|hnede uhli|cerne uhli|koks|biomasa|drevo|pelet|stiepk|briket|mazut|nafta)/.test(
      n,
    )
  ) {
    return "otherFuel";
  }
  return null;
}

/**
 * The label is the leading run of non-numeric items in a row (e.g.
 * "energie okolního prostředí" can arrive as one item or several).
 */
function leadingLabel(row: Row): { label: string; endX: number } | null {
  const parts: PdfTextItem[] = [];
  for (const item of row.items) {
    if (parseCzNumber(item.str) !== null || item.str.includes("%") || item.str.trim() === "---") break;
    parts.push(item);
  }
  if (parts.length === 0) return null;
  return { label: parts.map((p) => p.str.trim()).join(" "), endX: parts[parts.length - 1].x };
}

type FoundCarrier = PenbCarrier & { index: number; valueRow: Row; distance: number };

/**
 * The rows within LABEL_REACH of rows[i], itself included, in page order.
 * Rows of a page are contiguous and run top-down, and no two are closer than
 * ROW_TOLERANCE, so this is a handful of rows — never a scan of the document.
 */
function rowsNear(rows: Row[], i: number): Row[] {
  const { page, y } = rows[i];
  let lo = i;
  while (lo > 0 && rows[lo - 1].page === page && rows[lo - 1].y - y <= LABEL_REACH) lo--;
  let hi = i;
  while (hi < rows.length - 1 && rows[hi + 1].page === page && y - rows[hi + 1].y <= LABEL_REACH) hi++;
  return rows.slice(lo, hi + 1);
}

function readCarriers(rows: Row[]): FoundCarrier[] {
  const carriers: FoundCarrier[] = [];

  rows.forEach((row, index) => {
    const lead = leadingLabel(row);
    if (!lead) return;
    const kind = classifyCarrier(lead.label);
    if (!kind) return;

    // Value rows near the label: numeric (the percentage row has no plain
    // numbers, so it drops out here) and not another labelled row — a
    // heading, the next carrier, the totals. Same row first, then nearest.
    const candidates = rowsNear(rows, index)
      .filter((r) => r === row || leadingLabel(r) === null)
      .filter((r) => numbersIn(r, r === row ? lead.endX : -Infinity).length >= 2)
      .sort((a, b) => {
        const da = a === row ? -1 : Math.abs(a.y - row.y);
        const db = b === row ? -1 : Math.abs(b.y - row.y);
        return da - db;
      });

    const valueRow = candidates[0];
    if (!valueRow) return;
    const mwh = rowTotal(valueRow, valueRow === row ? lead.endX : -Infinity);
    if (mwh === null || mwh < 0) return;

    const distance = valueRow === row ? -1 : Math.abs(valueRow.y - row.y);
    carriers.push({ kind, label: lead.label, mwh, index, valueRow, distance });
  });

  // A value row belongs to one carrier only — its nearest label. Otherwise a
  // section heading that happens to read like a carrier ("ENERGIE OKOLNÍHO
  // PROSTŘEDÍ" right above the real "energie okolního prostředí" row) would
  // claim the same numbers and count them twice.
  const claims = new Map<Row, FoundCarrier[]>();
  for (const c of carriers) claims.set(c.valueRow, [...(claims.get(c.valueRow) ?? []), c]);
  return carriers.filter((c) =>
    claims.get(c.valueRow)!.every((o) => o === c || o.distance > c.distance),
  );
}

/**
 * Section B runs from a "celková dodaná energie" heading to the next
 * "primární energie" heading. The phrase also appears elsewhere — a cover
 * graphic, the section's own totals row, the requirements table — so every
 * occurrence is tried, and the first window that contains carrier rows is
 * then tightened to start at the *last* heading before those rows. Without
 * that, a cover-page mention would open the window early and its stray
 * "MWh/rok" figures could be taken for the section's totals.
 */
function findDeliveredEnergySection(rows: Row[]): Row[] | null {
  const starts = rows.flatMap((r, i) => (r.norm.includes("celkova dodana energie") ? [i] : []));

  // Where the window opened at each row ends: the next "primární energie"
  // heading after it, or the end of the document.
  const endAfter = new Array<number>(rows.length + 1).fill(rows.length);
  for (let j = rows.length - 1; j > 0; j--) {
    endAfter[j - 1] = rows[j].norm.includes("primarni energie") ? j : endAfter[j];
  }

  let emptyEnd = -1;
  for (const start of starts) {
    const end = endAfter[start];
    // A later start with the same end only sees part of a window that has
    // already come up empty — skipping it keeps a file stuffed with headings
    // from re-reading the document once per heading.
    if (end === emptyEnd) continue;

    const carriers = readCarriers(rows.slice(start, end));
    if (carriers.length === 0) {
      emptyEnd = end;
      continue;
    }

    const firstCarrier = start + carriers.reduce((min, c) => Math.min(min, c.index), Infinity);
    const tightStart = starts.findLast((s) => s <= firstCarrier)!;
    return rows.slice(tightStart, end);
  }
  return null;
}

function readArea(rows: Row[]): number | null {
  for (const row of rows) {
    if (!row.norm.includes("energeticky vztazna plocha")) continue;
    const area = rowTotal(row);
    if (area !== null && area > 0) return area;
  }
  return null;
}

/** The number a cell starts with: "488,776 MWh" → 488.776, "2706,5 m2" → 2706.5. */
function leadingNumber(raw: string): number | null {
  const m = raw.trim().match(/^-?\d[\d\s  ]*(?:[.,]\d+)?/);
  return m ? parseCzNumber(m[0]) : null;
}

/** First number printed after a row's label cell. */
function valueAfterLabel(row: Row): number | null {
  for (const item of row.items.slice(1)) {
    const n = leadingNumber(item.str);
    if (n !== null) return n;
  }
  return null;
}

interface DeliveredEnergy {
  carriers: PenbCarrier[];
  totalDeliveredMwh: number | null;
  /** Area if this source states it; otherwise the caller looks elsewhere. */
  areaM2: number | null;
  /** Extra cross-check the source offers beyond carriers-vs-total. */
  areaConsistent: boolean;
}

/** Protocol section B, as every vyhláška 264/2020 certificate prints it. */
function readProtocol(rows: Row[]): DeliveredEnergy | null {
  const section = findDeliveredEnergySection(rows);
  if (!section) return null;

  const carriers = readCarriers(section).map(({ kind, label, mwh }) => ({ kind, label, mwh }));
  const totalRow = section.find((r) => /^mwh\/rok\b/.test(r.norm) && numbersIn(r).length > 0);
  const totalDeliveredMwh = totalRow ? rowTotal(totalRow) : null;
  const intensityRow = section.find((r) => /^kwh\/m/.test(r.norm) && numbersIn(r).length > 0);
  const totalKwhM2 = intensityRow ? rowTotal(intensityRow) : null;

  // Prefer the printed area; fall back to deriving it from the table's own
  // totals (MWh ÷ kWh/m²) when the area row is laid out unrecognisably.
  let areaM2 = readArea(rows);
  if (areaM2 === null && totalDeliveredMwh && totalKwhM2) {
    areaM2 = Math.round((totalDeliveredMwh * 1000) / totalKwhM2);
  }
  return { carriers, totalDeliveredMwh, areaM2, areaConsistent: true };
}

/**
 * Older certificates (vyhláška 78/2013) often print the protocol tables in a
 * font with no text mapping, so they extract as gibberish — but many append
 * the full calculation printout from Svoboda Software's "Energie" program,
 * which is plain text and ends with a per-carrier summary:
 *
 *   Součty pro jednotlivé energonositele:   Q,f [MWh/a]   Q,pN [MWh/a] …
 *   elektřina ze sítě                        88,855        266,564      …
 *   zemní plyn                               399,921       439,913      …
 *
 * Only the first run counts: a second one is the "DOPORUČENÍ" variant (the
 * building after the recommended measures), not the building as it is.
 */
function readEnergieReport(rows: Row[]): DeliveredEnergy | null {
  const runStarts = rows.flatMap((r, i) =>
    r.norm.startsWith("vypocet energeticke narocnosti budov") ? [i] : [],
  );
  if (runStarts.length === 0) return null;
  const run = rows.slice(runStarts[0], runStarts[1] ?? rows.length);

  const header = run.findIndex((r) => r.norm.startsWith("soucty pro jednotlive energonositele"));
  if (header < 0) return null;

  const carriers: PenbCarrier[] = [];
  for (const row of run.slice(header + 1)) {
    const lead = leadingLabel(row);
    const kind = lead ? classifyCarrier(lead.label) : null;
    if (!lead || !kind) break; // past the end of the summary table
    const qf = numbersIn(row, lead.endX)[0]; // Q,f — energy delivered — is the first column
    if (qf !== undefined && qf >= 0) carriers.push({ kind, label: lead.label, mwh: qf });
  }
  if (carriers.length === 0) return null;

  // "Celková roční dodaná energie: 488,776 MWh" — not the per-zone
  // "… Q,fuel:" rows, which are in GJ.
  const totalRow = run.findLast((r) => r.norm.startsWith("celkova rocni dodana energie:"));
  const totalDeliveredMwh = totalRow ? valueAfterLabel(totalRow) : null;

  // The report lists area per zone; the building's is their sum.
  const zoneAreas = run
    .filter((r) => r.norm.startsWith("celk. energet. vztazna plocha"))
    .map(valueAfterLabel)
    .filter((n): n is number => n !== null && n > 0);
  const areaM2 =
    zoneAreas.length > 0 ? Math.round(zoneAreas.reduce((a, b) => a + b, 0) * 10) / 10 : null;

  // EP,A (printed rounded to whole kWh/m²) must agree with MWh ÷ area —
  // catches a zone missed or double-counted in the sum above.
  const epaRow = run.find((r) => r.norm.startsWith("merna dodana energie budovy ep,a"));
  const epa = epaRow ? valueAfterLabel(epaRow) : null;
  const areaConsistent =
    epa === null ||
    areaM2 === null ||
    totalDeliveredMwh === null ||
    Math.abs((totalDeliveredMwh * 1000) / areaM2 - epa) <= Math.max(1, epa * 0.02);

  return { carriers, totalDeliveredMwh, areaM2, areaConsistent };
}

function match(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

/**
 * A form field's value, read by position: the cells to the right of the
 * label, including lines the value wraps onto just above or below it — e.g.
 * "Převládající typ využití:" next to "Jiný druh budovy (Výrobní hala s" /
 * "administrativou)".
 */
function fieldValue(rows: Row[], label: string): string | null {
  for (const row of rows) {
    const item = row.items.find((i) => normalizeLabel(i.str).startsWith(label));
    if (!item) continue;

    const inline = item.str.slice(item.str.indexOf(":") + 1).trim();
    if (inline) return inline;

    const parts = rows
      .filter((r) => r.page === row.page && Math.abs(r.y - row.y) <= 8)
      .sort((a, b) => b.y - a.y)
      .flatMap((r) => r.items.filter((i) => i.x >= item.x + 40 && !i.str.includes(":")))
      .map((i) => i.str.trim());
    return parts.length > 0 ? parts.join(" ") : null;
  }
  return null;
}

export function parsePenb(pages: PdfPage[]): PenbParseResult {
  const rows = buildRows(pages);
  const fullText = rows.map((r) => r.text).join("\n");

  if (fullText.replace(/\s/g, "").length < MIN_TEXT_CHARS) return { ok: false, error: "no_text" };
  if (!normalizeLabel(fullText).includes("energeticke narocnosti budov")) {
    return { ok: false, error: "not_penb" };
  }

  const source = readProtocol(rows) ?? readEnergieReport(rows);
  if (!source || source.areaM2 === null) return { ok: false, error: "no_values" };

  const { carriers, totalDeliveredMwh, areaM2 } = source;
  const sum = (kind: CarrierKind) =>
    carriers.filter((c) => c.kind === kind).reduce((acc, c) => acc + c.mwh, 0);

  const carriersSum = carriers.reduce((acc, c) => acc + c.mwh, 0);
  const consistent =
    source.areaConsistent &&
    totalDeliveredMwh !== null &&
    totalDeliveredMwh > 0 &&
    Math.abs(carriersSum - totalDeliveredMwh) / totalDeliveredMwh <= 0.01;

  return {
    ok: true,
    extraction: {
      areaM2,
      carriers,
      electricityMwh: sum("electricity"),
      gasMwh: sum("gas"),
      otherFuelMwh: sum("otherFuel"),
      ambientMwh: sum("ambient"),
      totalDeliveredMwh,
      consistent,
      certificateNumber: match(
        fullText,
        /Evidenční (?:číslo průkazu|číslo PENB|č\. databáze ENEX|číslo ENEX):?\s*([\d.\-/]+)/i,
      ),
      municipality: match(fullText, /Obec:\s*(.+?)(?:\s+Část obce|\n|$)/),
      buildingUse: fieldValue(rows, "prevladajici typ vyuziti"),
      // The label is often split across lines ("Datum vyhotovení / průkazu:"),
      // so allow a little of anything between it and the date.
      issuedOn: match(
        fullText,
        /Datum (?:vyhotovení|vydání)[\s\S]{0,30}?(\d{1,2}\.\s?\d{1,2}\.\s?\d{4})/,
      ),
    },
  };
}
