/**
 * PENB reading and the upload endpoint's guard rails.
 *
 * The certificates here are synthetic — rebuilt item by item from the layout
 * of a real ENERGETIKA protocol (vyhláška 264/2020), with made-up numbers. A
 * real certificate carries the energy specialist's name, phone and e-mail, so
 * it must not be committed. To check against a real file locally:
 *
 *   PENB_SAMPLE_PDF=/path/to/penb.pdf npm test        (one file)
 *   PENB_SAMPLE_PDF=/path/to/folder npm test          (every PDF in it)
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import {
  normalizeLabel,
  parseCzNumber,
  parsePenb,
  type PdfPage,
  type PdfTextItem,
} from "../src/lib/penb.ts";
import {
  MAX_PENB_BYTES,
  createRateLimiter,
  isSameOrigin,
  looksLikePdf,
  toPenbValues,
} from "../src/lib/penbUpload.ts";

/** One printed row: a y position and [x, text] cells. */
function row(y: number, ...cells: [number, string][]): PdfTextItem[] {
  return cells.map(([x, str]) => ({ x, y, str }));
}

/** Eight table cells (7 purposes + "Celkem"), as the protocol prints them. */
function cells(...values: string[]): [number, string][] {
  const xs = [173, 229, 279, 338, 381, 432, 491, 530];
  return values.map((v, i) => [xs[i], v]);
}

const FILLER = row(
  700,
  [46, "Dodaná energie je dle §4 Vyhlášky součtem vypočtené spotřeby energie a pomocné energie"],
  [46, "(čerpadla, regulace apod.) pro daný účel; vychází z potřeby energie pro typické užívání budovy."],
);

const cover: PdfPage = [
  ...row(800, [46, "Průkaz energetické náročnosti budovy"]),
  ...row(780, [46, "vydaný podle zákona č. 406/2000 Sb. a vyhlášky č. 264/2020 Sb."]),
  ...row(500, [46, "Datum vydání"]),
  ...row(490, [46, "20.08.2026"]),
];

const identification: PdfPage = [
  ...row(806, [45, "Průkaz energetické náročnosti budovy"], [428, "Evidenční číslo průkazu: 123456.0"]),
  ...row(700, [46, "Obec: Testov"], [300, "Část obce: Sever"]),
  ...row(680, [46, "Katastrální území: Testov (000000)"], [300, "Převládající typ využití: Budova pro obchodní účely"]),
  ...row(153, [46, "Celková energeticky vztažná plocha budovy"], [400, "m2"], [460, "12 500,0"]),
];

/**
 * Section B as ENERGETIKA lays it out: each carrier label sits *between* its
 * % row (above) and its MWh row (below). Electricity 400, gas 600, ambient
 * 250 → total 1 250 MWh over 12 500 m² = 100 kWh/m².
 */
const sectionB: PdfPage = [
  ...row(771, [64, "B"], [97, "CELKOVÁ DODANÁ ENERGIE"]),
  ...FILLER,
  ...row(623, [52, "PALIVA"]),
  ...row(583, ...cells("20,0%", "0,0%", "1,0%", "---", "0,8%", "0,9%", "---", "32,0%")),
  ...row(576, [46, "elektřina"]),
  ...row(569, ...cells("250.0", "1.0", "50.0", "---", "49.0", "50.0", "---", "400.0")),
  ...row(547, ...cells("44,0%", "0,0%", "0,0%", "---", "4,0%", "0,0%", "---", "48,0%")),
  ...row(540, [46, "zemní plyn"]),
  ...row(533, ...cells("550.0", "0.0", "0.0", "---", "50.0", "0.0", "---", "600.0")),
  ...row(515, [52, "ENERGIE OKOLNÍHO PROSTŘEDÍ"]),
  ...row(507, ...cells("18,0%", "0,4%", "1,0%", "---", "0,6%", "0,0%", "---", "20,0%")),
  ...row(500, [46, "energie okolního prostředí"]),
  ...row(492, ...cells("225.0", "5.0", "12.5", "---", "7.5", "0.0", "---", "250.0")),
  ...row(470, [52, "CELKOVÁ DODANÁ ENERGIE"]),
  ...row(455, [46, "procentuální podíl"], ...cells("82,0%", "0,5%", "5,0%", "---", "8,5%", "4,0%", "---", "100,0%")),
  ...row(440, [46, "kWh/m"], [73, "rok"], ...cells("82,0", "0,5", "5,0", "---", "8,5", "4,0", "---", "100,0")),
  ...row(443, [70, "2"]),
  ...row(425, [46, "MWh/rok"], ...cells("1025.0", "6.0", "62.5", "---", "106.5", "50.0", "---", "1250.0")),
];

/** Section C repeats "elektřina" with a primary-energy factor — must be ignored. */
const sectionC: PdfPage = [
  ...row(771, [64, "C"], [97, "PRIMÁRNÍ ENERGIE Z NEOBNOVITELNÝCH ZDROJŮ ENERGIE"]),
  ...row(583, ...cells("90,0%", "0,1%", "3,0%", "---", "2,0%", "2,4%", "---", "100,0%")),
  ...row(576, [46, "elektřina 2,1"]),
  ...row(569, ...cells("800.0", "2.0", "60.0", "---", "40.0", "48.0", "---", "950.0")),
  ...row(540, [46, "Elektřina dodávka mimo budovu -2,1"]),
  ...row(533, ...cells("---", "---", "---", "---", "---", "---", "-50.0", "-50.0")),
];

const enerGetikaLike: PdfPage[] = [cover, identification, sectionB, sectionC];

/**
 * Parses and asserts success *inside* a test. (An assertion that fails in a
 * describe() body is reported as "not ok" but node --test still exits 0 —
 * CI would stay green.)
 */
function extract(pages: PdfPage[]) {
  const r = parsePenb(pages);
  assert.ok(r.ok, `should parse, got ${JSON.stringify(r)}`);
  return r.extraction;
}

describe("parseCzNumber", () => {
  test("reads the formats PENB tables actually print", () => {
    assert.equal(parseCzNumber("981.3"), 981.3);
    assert.equal(parseCzNumber("83,9"), 83.9);
    assert.equal(parseCzNumber("30 366,3"), 30366.3);
    assert.equal(parseCzNumber("30 366,3"), 30366.3);
    assert.equal(parseCzNumber("1.234,5"), 1234.5);
    assert.equal(parseCzNumber("-120.92"), -120.92);
    assert.equal(parseCzNumber("2"), 2);
  });

  test("rejects percentages, placeholders and anything that isn't a plain number", () => {
    for (const s of ["35,5%", "100,0 %", "---", "", "MWh/rok", "0x1f", "1e9", "Infinity", "12a"]) {
      assert.equal(parseCzNumber(s), null, s);
    }
  });
});

describe("normalizeLabel", () => {
  test("ignores case and diacritics so 'ELEKTŘINA' matches 'elektřina'", () => {
    assert.equal(normalizeLabel("  ELEKTŘINA "), "elektrina");
    assert.equal(normalizeLabel("Energie okolního\nprostředí"), "energie okolniho prostredi");
  });
});

describe("parsePenb — ENERGETIKA layout (label between % and MWh rows)", () => {
  test("reads the conditioned floor area", () => {
    const e = extract(enerGetikaLike);
    assert.equal(e.areaM2, 12500);
  });

  test("takes each carrier's MWh total, not its percentage", () => {
    const e = extract(enerGetikaLike);
    assert.equal(e.electricityMwh, 400);
    assert.equal(e.gasMwh, 600);
    assert.equal(e.otherFuelMwh, 0);
  });

  test("keeps ambient heat separate — it is never billed", () => {
    const e = extract(enerGetikaLike);
    assert.equal(e.ambientMwh, 250);
    assert.ok(!e.carriers.some((c) => c.kind !== "ambient" && c.mwh === 250));
  });

  test("ignores section C (primary-energy factors, exported PV)", () => {
    const e = extract(enerGetikaLike);
    // 950 and -50 only exist in section C.
    assert.ok(!e.carriers.some((c) => c.mwh === 950 || c.mwh === -50));
    assert.equal(e.carriers.length, 3);
  });

  test("cross-checks the carriers against the table's own total", () => {
    const e = extract(enerGetikaLike);
    assert.equal(e.totalDeliveredMwh, 1250);
    assert.equal(e.consistent, true);
  });

  test("picks up the identifying details for the stored record", () => {
    const e = extract(enerGetikaLike);
    assert.equal(e.certificateNumber, "123456.0");
    assert.equal(e.municipality, "Testov");
    assert.equal(e.buildingUse, "Budova pro obchodní účely");
    assert.equal(e.issuedOn, "20.08.2026");
  });
});

describe("parsePenb — other layouts", () => {
  /**
   * Label and values on one row, comma decimals, thousands spaces, district
   * heat, no area row (area must come from MWh ÷ kWh/m²), and a cover page
   * that mentions "celková dodaná energie" with numbers of its own.
   */
  const coverWithGraphic: PdfPage = [
    ...cover,
    ...row(300, [46, "Celková dodaná energie"]),
    ...row(290, [46, "MWh/rok"], [300, "9999,0"], [400, "9999,0"]),
  ];
  const sameRow: PdfPage = [
    ...row(800, [46, "Průkaz energetické náročnosti budovy"], [300, "Evidenční číslo průkazu: 77/2025"]),
    ...row(760, [46, "B CELKOVÁ DODANÁ ENERGIE"]),
    ...FILLER,
    ...row(600, [40, "Elektřina"], [200, "120,0"], [260, "30,0"], [500, "150,0"]),
    ...row(588, [200, "8,0 %"], [260, "2,1 %"], [500, "10,7 %"]),
    ...row(560, [40, "Zemní plyn"], [200, "1 150,5"], [260, "50,0"], [500, "1 200,5"]),
    ...row(520, [40, "Teplo ze SZTE"], [200, "45,0"], [260, "4,5"], [500, "49,5"]),
    ...row(480, [40, "kWh/m2rok"], [200, "100,0"], [260, "12,0"], [500, "112,0"]),
    ...row(460, [40, "MWh/rok"], [200, "1 250,0"], [260, "150,0"], [500, "1 400,0"]),
    ...row(400, [40, "C PRIMÁRNÍ ENERGIE"]),
  ];
  const pages = [coverWithGraphic, sameRow];

  test("reads carriers whose values share the label's row", () => {
    const e = extract(pages);
    assert.equal(e.electricityMwh, 150);
    assert.equal(e.gasMwh, 1200.5);
  });

  test("classifies district heat as another purchased fuel", () => {
    const e = extract(pages);
    assert.equal(e.otherFuelMwh, 49.5);
    assert.equal(e.ambientMwh, 0);
  });

  test("ignores a cover-page mention and uses the section's own totals", () => {
    const e = extract(pages);
    assert.equal(e.totalDeliveredMwh, 1400);
    assert.equal(e.consistent, true);
  });

  test("derives the area from the totals when no area row is found", () => {
    const e = extract(pages);
    assert.equal(e.areaM2, 12500);
  });

  test("flags a table whose carriers don't add up", () => {
    const tampered = sameRow.map((i) => (i.str === "1 400,0" ? { ...i, str: "2 000,0" } : i));
    const r = parsePenb([tampered]);
    assert.ok(r.ok);
    assert.equal(r.extraction.consistent, false);
  });
});

describe("parsePenb — tight layouts", () => {
  const header = [
    ...row(800, [46, "Průkaz energetické náročnosti budovy"]),
    ...row(780, [46, "B CELKOVÁ DODANÁ ENERGIE"]),
    ...FILLER,
    ...row(153, [46, "Celková energeticky vztažná plocha budovy"], [460, "10 000"]),
  ];

  test("a heading that reads like a carrier doesn't count the same row twice", () => {
    const e = extract([
      [
        ...header,
        ...row(600, [40, "zemní plyn"], ...cells("500.0", "0.0", "0.0", "---", "100.0", "0.0", "---", "600.0")),
        // Heading 11 pt above the MWh row, the real label 7 pt above it.
        ...row(507, ...cells("18,0%", "0,4%", "1,0%", "---", "0,6%", "0,0%", "---", "20,0%")),
        ...row(504, [52, "ENERGIE OKOLNÍHO PROSTŘEDÍ"]),
        ...row(500, [46, "energie okolního prostředí"]),
        ...row(493, ...cells("225.0", "5.0", "12.5", "---", "7.5", "0.0", "---", "250.0")),
        ...row(425, [46, "MWh/rok"], ...cells("725.0", "5.0", "12.5", "---", "107.5", "0.0", "---", "850.0")),
      ],
    ]);
    assert.equal(e.ambientMwh, 250);
    assert.equal(e.consistent, true);
  });

  test("a carrier with no value row of its own never borrows the totals row", () => {
    const e = extract([
      [
        ...header,
        ...row(600, [40, "zemní plyn"], ...cells("500.0", "0.0", "0.0", "---", "100.0", "0.0", "---", "600.0")),
        // Printed without numbers (e.g. "---" only) right above the totals.
        ...row(440, [46, "elektřina"]),
        ...row(430, [46, "MWh/rok"], ...cells("500.0", "0.0", "0.0", "---", "100.0", "0.0", "---", "600.0")),
      ],
    ]);
    assert.equal(e.electricityMwh, 0);
    assert.equal(e.gasMwh, 600);
    assert.equal(e.consistent, true);
  });
});

describe("parsePenb — older certificates (vyhláška 78/2013) via the Energie printout", () => {
  /** Protocol pages whose font has no text mapping — they extract as noise. */
  const garbledProtocol: PdfPage = [
    ...row(703, [69, "Průkaz energetické náročnosti budovy"]),
    ...row(662, [113, "(dle vyhlášky MPO 78/2013 a ČSN 73 0540)"]),
    ...row(127, [71, "Evidenční č. databáze ENEX"], [254, "277572.0"]),
    ...row(600, [60, "!\"#$%&'('!)'*+,#-&(.!/0(/1*+&234/56"]),
    ...row(580, [60, "Sokl sklad"], [182, ").1./.1"], [253, "1/01"]),
    ...FILLER,
  ];

  /** One "Energie" run: zone areas, building totals, per-carrier summary. */
  function energieRun(title: string, zones: string[], ele: string, gas: string, total: string, epa: string): PdfPage[] {
    return [
      [
        ...row(752, [101, "VÝPOČET ENERGETICKÉ NÁROČNOSTI BUDOV"]),
        ...row(674, [86, "Energie 2019"]),
        ...row(641, [86, "Název úlohy:"], [151, title]),
        ...zones.flatMap((a, i) => row(600 - i * 40, [86, "Celk. energet. vztažná plocha:"], [246, `${a} m2`])),
      ],
      [
        // Per-zone totals are in GJ and must not be taken for the building's.
        ...row(509, [86, "Celková roční dodaná energie Q,fuel:"], [311, "1587,025 GJ"]),
        ...row(347, [86, "Celková roční dodaná energie:"], [316, `${total} MWh`]),
        ...row(297, [86, "Měrná dodaná energie budovy EP,A:"], [316, `${epa} kWh/(m2.a)`]),
        ...row(604, [86, "Součty pro jednotlivé energonositele:"], [273, "Q,f"], [291, "[MWh/a]"], [333, "Q,pN"], [360, "[MWh/a]"]),
        ...row(592, [86, "elektřina ze sítě"], [273, ele], [333, "266,564"], [403, "284,335"], [468, "89,921"]),
        ...row(581, [86, "zemní plyn"], [273, gas], [333, "439,913"], [403, "439,913"], [468, "79,584"]),
        ...row(570, [86, "elektřina (nevytáp. prostory)"], [273, "---"], [333, "---"]),
        ...row(540, [86, "Vysvětlivky:"], [146, "Q,f je energie dodaná do budovy příslušným energonositelem v MWh/rok"]),
        // Below the summary: a factor table with carrier labels, and another
        // per-zone GJ total — neither may be read as building figures.
        ...row(500, [86, "zemní plyn"], [196, "1,1"], [221, "1,1"], [246, "0,1990"]),
        ...row(330, [86, "Celková roční dodaná energie Q,fuel:"], [311, "24,976 GJ"]),
      ],
    ];
  }

  const pages = [
    garbledProtocol,
    ...energieRun("Hala Žebrák", ["2706,5", "4313,4", "380,4", "18,9"], "88,855", "399,921", "488,776", "66"),
    // Second run = the building after recommended measures; must be ignored.
    ...energieRun("Hala Žebrák - DOPORUČENÍ", ["2706,5", "4313,4", "380,4", "18,9"], "50,000", "200,000", "250,000", "34"),
  ];

  test("reads Q,f per carrier from the first run's summary table", () => {
    const e = extract(pages);
    assert.equal(e.electricityMwh, 88.855);
    assert.equal(e.gasMwh, 399.921);
    assert.equal(e.carriers.length, 2, "the '---' row and the explanation are skipped");
  });

  test("sums the zone areas into the building's area", () => {
    assert.equal(extract(pages).areaM2, 7419.2);
  });

  test("reconciles against the building total and EP,A, not the GJ per-zone rows", () => {
    const e = extract(pages);
    assert.equal(e.totalDeliveredMwh, 488.776);
    assert.equal(e.consistent, true);
  });

  test("flags a zone sum that disagrees with EP,A", () => {
    const missingZone = [
      garbledProtocol,
      ...energieRun("Hala", ["2706,5", "380,4", "18,9"], "88,855", "399,921", "488,776", "66"),
    ];
    assert.equal(extract(missingZone).consistent, false);
  });

  test("picks up the ENEX registration number", () => {
    assert.equal(extract(pages).certificateNumber, "277572.0");
  });
});

describe("parsePenb — form fields", () => {
  test("reads a value that wraps around its label", () => {
    const e = extract([
      [
        ...identification.filter((i) => !i.str.startsWith("Katastrální") && !i.str.startsWith("Převládající")),
        ...row(637, [402, "Jiný druh budovy (Výrobní hala s"]),
        ...row(632, [46, "Katastrální území:"], [147, "Testov (000000)"], [300, "Převládající typ využití:"]),
        ...row(628, [402, "administrativou)"]),
        ...row(613, [300, "Památková ochrana"]),
      ],
      sectionB,
    ]);
    assert.equal(e.buildingUse, "Jiný druh budovy (Výrobní hala s administrativou)");
  });
});

describe("parsePenb — refusals", () => {
  test("a scan with no text layer", () => {
    assert.deepEqual(parsePenb([[], [{ x: 0, y: 0, str: "  " }]]), { ok: false, error: "no_text" });
  });

  test("a PDF that isn't an energy certificate", () => {
    const invoice: PdfPage = row(
      700,
      [46, "Faktura — daňový doklad č. 2026001. Dodavatel elektřiny, odběrné místo, zálohy za období"],
      [46, "leden až prosinec, celkem k úhradě 125 000 Kč, splatnost 14 dní, variabilní symbol 2026001."],
      [46, "Spotřeba elektřiny 400 MWh, spotřeba plynu 600 MWh, distribuce, silová elektřina, daň z elektřiny."],
    );
    assert.deepEqual(parsePenb([invoice]), { ok: false, error: "not_penb" });
  });

  test("a certificate whose table we can't find", () => {
    assert.deepEqual(parsePenb([cover, identification]), { ok: false, error: "no_values" });
  });
});

/**
 * Crafted files that used to pin the CPU: the parser compared every row with
 * every other row, and re-read the document once per section heading — a
 * 50 kB PDF took 40 s. Pages hold ~315 rows at most (pdf.js drops text
 * outside the page), so these are the realistic worst case.
 */
describe("parsePenb — hostile layouts stay fast", () => {
  const page = (label: (i: number) => string, withValues: boolean): PdfPage => [
    ...row(835, [20, "Průkaz energetické náročnosti budovy"]),
    ...Array.from({ length: 315 }, (_, i) =>
      row(830 - i * 2.6, [20, label(i)], ...(withValues ? ([[300, "1"], [400, "2"]] as [number, string][]) : [])),
    ).flat(),
  ];

  function timed(pages: PdfPage[]) {
    const t = performance.now();
    const result = parsePenb(pages);
    return { result, ms: performance.now() - t };
  }

  test("a document made of nothing but section headings", () => {
    const pages = Array.from({ length: 40 }, () => page(() => "CELKOVÁ DODANÁ ENERGIE", false));
    const { result, ms } = timed(pages);
    assert.deepEqual(result, { ok: false, error: "no_values" });
    assert.ok(ms < 2000, `took ${Math.round(ms)} ms`);
  });

  test("a document made of nothing but carrier rows", () => {
    const pages = Array.from({ length: 150 }, () =>
      page((i) => (i === 0 ? "CELKOVÁ DODANÁ ENERGIE" : "elektřina"), true),
    );
    const { result, ms } = timed(pages);
    // Every row is read as a carrier; there's just no floor area to go with them.
    assert.deepEqual(result, { ok: false, error: "no_values" });
    assert.ok(ms < 2000, `took ${Math.round(ms)} ms`);
  });
});

describe("upload guard rails", () => {
  test("recognises a PDF by its header, not by its name", () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    assert.equal(looksLikePdf(enc("%PDF-1.4\n...")), true);
    assert.equal(looksLikePdf(enc("\n\n%PDF-1.7")), true, "header may follow a little junk");
    assert.equal(looksLikePdf(enc("<html><script>alert(1)</script>")), false);
    assert.equal(looksLikePdf(enc("PK\u0003\u0004 docx")), false);
    assert.equal(looksLikePdf(new Uint8Array(2000).fill(32)), false);
  });

  test("the size limit stays under Vercel's 4.5 MB request cap", () => {
    assert.ok(MAX_PENB_BYTES < 4.5 * 1024 * 1024);
  });

  test("only accepts posts from our own origin", () => {
    const url = "https://kalkulacka.example.cz/api/penb";
    assert.equal(isSameOrigin("https://kalkulacka.example.cz", url), true);
    assert.equal(isSameOrigin("https://evil.example.com", url), false);
    assert.equal(isSameOrigin("https://kalkulacka.example.cz.evil.com", url), false);
    assert.equal(isSameOrigin(null, url), false, "a missing Origin is refused");
    assert.equal(isSameOrigin("null", url), false, "sandboxed iframes send 'null'");
  });

  test("the rate limiter allows a burst, then blocks until the window resets", () => {
    let t = 0;
    const allow = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    assert.deepEqual([allow("a"), allow("a"), allow("a"), allow("a")], [true, true, true, false]);
    assert.equal(allow("b"), true, "other clients are unaffected");
    t = 1000;
    assert.equal(allow("a"), true, "a new window starts fresh");
  });

  test("the rate limiter's memory is bounded", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 100, now: () => 0 });
    for (let i = 0; i < 10_000; i++) allow(`ip-${i}`);
    // Survives without growing unboundedly — and still answers.
    assert.equal(typeof allow("ip-final"), "boolean");
  });
});

describe("toPenbValues", () => {
  const extraction = () => ({ ...extract(enerGetikaLike), areaM2: 12500 });

  test("passes billed carriers through and leaves ambient heat out of gas", () => {
    const { values, warnings } = toPenbValues(extraction());
    assert.deepEqual(values, {
      areaM2: 12500,
      eleMwh: 400,
      gasMwh: 600,
      ambientMwh: 250,
      otherFuelMwh: 0,
    });
    assert.deepEqual(warnings, ["ambient_excluded"]);
  });

  test("folds other fuels into gas and says so", () => {
    const { values, warnings } = toPenbValues({ ...extraction(), ambientMwh: 0, otherFuelMwh: 50 });
    assert.equal(values.gasMwh, 650);
    assert.deepEqual(warnings, ["other_fuel_as_gas"]);
  });

  test("asks the visitor to check values that didn't reconcile", () => {
    const { warnings } = toPenbValues({ ...extraction(), consistent: false });
    assert.ok(warnings.includes("unverified"));
  });
});

/**
 * Real certificates, opt-in: PENB_SAMPLE_PDF may be one file or a folder of
 * them. Anything we *do* read must reconcile; a certificate we can't read
 * (scan, image-only or font-garbled tables) must say so cleanly, not throw.
 */
const sample = process.env.PENB_SAMPLE_PDF;
const samples =
  sample && existsSync(sample)
    ? statSync(sample).isDirectory()
      ? readdirSync(sample)
          .filter((f) => f.toLowerCase().endsWith(".pdf"))
          .map((f) => join(sample, f))
      : [sample]
    : [];
describe("real certificates (opt-in)", { skip: samples.length === 0 }, () => {
  for (const file of samples) {
    test(basename(file), async () => {
      const { extractPdfPages } = await import("../src/lib/penbPdf.ts");
      const pages = await extractPdfPages(new Uint8Array(readFileSync(file)));
      const r = parsePenb(pages);
      if (!r.ok) {
        assert.ok(["no_text", "no_values", "not_penb"].includes(r.error));
        console.log(`  ${basename(file)}: ${r.error}`);
        return;
      }
      assert.ok(r.extraction.consistent, "carriers should add up to the table total");
      const { areaM2, electricityMwh, gasMwh, otherFuelMwh, ambientMwh } = r.extraction;
      console.log(`  ${basename(file)}: ${JSON.stringify({ areaM2, electricityMwh, gasMwh, otherFuelMwh, ambientMwh })}`);
    });
  }
});
