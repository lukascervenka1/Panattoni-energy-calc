/**
 * Guards the shipped data. `data/*.json` (the bundled fallback) and
 * `reference/google-sheet-template/*.csv` (what gets pasted into the live
 * Google Sheet) are maintained by hand in parallel — if they drift, the site
 * shows different numbers depending on whether the sheet is reachable.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsvRecords } from "../src/lib/csv.ts";
import type { PenbClass } from "../src/lib/types.ts";
import benchmarks from "../data/benchmarks.json" with { type: "json" };
import config from "../data/config.json" with { type: "json" };

const CLASSES: PenbClass[] = ["A", "B", "C", "D", "E", "F", "G"];

function readTemplate(name: string): Record<string, string>[] {
  const url = new URL(`../reference/google-sheet-template/${name}`, import.meta.url);
  return parseCsvRecords(readFileSync(url, "utf8"));
}

describe("benchmarks.json", () => {
  test("every hall has sane, publishable values", () => {
    assert.ok(benchmarks.length > 0);
    for (const b of benchmarks) {
      assert.ok(b.id, "id is required");
      assert.ok(b.park.length > 0, `${b.id}: park name`);
      assert.ok(b.areaM2 > 0, `${b.id}: area`);
      assert.ok(b.pneKwhM2 > 0, `${b.id}: consumption`);
      assert.ok(
        b.elecSharePct >= 0 && b.elecSharePct <= 100,
        `${b.id}: electricity share out of range`,
      );
      assert.ok(b.pneYear >= 2020 && b.pneYear <= 2030, `${b.id}: billing year`);
    }
  });

  test("ids are unique", () => {
    const ids = benchmarks.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test("halls are ordered from most to least efficient", () => {
    // The cards are rendered in file order; an unsorted file would read oddly.
    const values = benchmarks.map((b) => b.pneKwhM2);
    assert.deepEqual(values, [...values].sort((a, b) => a - b));
  });

  test("no tenant or SPV names leak into the public payload", () => {
    // Only park-level names may ship; see the privacy rule in README/AGENTS.
    const fields = Object.keys(benchmarks[0]);
    for (const forbidden of ["tenant", "client", "klient", "spv", "costEur", "rent"]) {
      assert.ok(!fields.includes(forbidden), `benchmark exposes "${forbidden}"`);
    }
  });

  test("matches the Google Sheet template row for row", () => {
    const rows = readTemplate("buildings.csv");
    assert.equal(rows.length, benchmarks.length, "row count differs");

    benchmarks.forEach((b, i) => {
      const row = rows[i];
      assert.equal(row.id, b.id, `row ${i}: id`);
      assert.equal(row.park, b.park, `row ${i}: park`);
      assert.equal(row.category, b.category, `row ${i}: category`);
      assert.equal(Number(row.area_m2), b.areaM2, `row ${i}: area`);
      assert.equal(Number(row.year_built), b.yearBuilt, `row ${i}: year built`);
      assert.equal(Number(row.pne_kwh_m2), b.pneKwhM2, `row ${i}: consumption`);
      assert.equal(Number(row.elec_share_pct), b.elecSharePct, `row ${i}: electricity share`);
      assert.equal(Number(row.pne_year), b.pneYear, `row ${i}: billing year`);
    });
  });
});

describe("config.json", () => {
  test("the ELE/gas split is a complete 30/70 share", () => {
    assert.equal(config.eleShareDefault, 0.3);
    assert.equal(config.gasShareDefault, 0.7);
    assert.equal(config.eleShareDefault + config.gasShareDefault, 1);
  });

  test("prices and emission factors are positive, with electricity the dearer/dirtier one", () => {
    assert.ok(config.elePriceEurKwh > 0 && config.gasPriceEurKwh > 0);
    assert.ok(config.elePriceEurKwh > config.gasPriceEurKwh);
    assert.ok(config.eleCo2TPerKwh > 0 && config.gasCo2TPerKwh > 0);
    assert.ok(config.eleCo2TPerKwh > config.gasCo2TPerKwh);
  });

  test("class defaults rise strictly from A to G", () => {
    const values = CLASSES.map((c) => config.classDefaultsKwhM2[c]);
    for (let i = 1; i < values.length; i++) {
      assert.ok(values[i] > values[i - 1], `class ${CLASSES[i]} must exceed ${CLASSES[i - 1]}`);
    }
  });

  test("the reference target sits below even the best class", () => {
    assert.equal(config.referencePneKwhM2, 35);
    assert.ok(config.referencePneKwhM2 < config.classDefaultsKwhM2.A);
  });

  test("matches the Google Sheet template key for key", () => {
    const values = new Map(readTemplate("config.csv").map((r) => [r.key, r.value]));
    const expect = (key: string, value: number) =>
      assert.equal(Number(values.get(key)), value, `${key} differs from config.json`);

    expect("ele_price_eur_kwh", config.elePriceEurKwh);
    expect("gas_price_eur_kwh", config.gasPriceEurKwh);
    expect("ele_co2_t_per_kwh", config.eleCo2TPerKwh);
    expect("gas_co2_t_per_kwh", config.gasCo2TPerKwh);
    expect("ele_share_default", config.eleShareDefault);
    expect("gas_share_default", config.gasShareDefault);
    expect("reference_pne_kwh_m2", config.referencePneKwhM2);

    for (const c of CLASSES) {
      expect(`class_default_${c.toLowerCase()}`, config.classDefaultsKwhM2[c]);

      const boundary = config.classBoundariesKwhM2[c];
      const raw = values.get(`class_boundary_${c.toLowerCase()}`);
      if (boundary === null) {
        assert.equal(raw, "", `class_boundary_${c.toLowerCase()} should be blank`);
      } else {
        assert.equal(Number(raw), boundary, `class_boundary_${c.toLowerCase()} differs`);
      }
    }
  });

  test("every template key the loader reads actually exists", () => {
    const keys = new Set(readTemplate("config.csv").map((r) => r.key));
    for (const c of CLASSES) {
      assert.ok(keys.has(`class_default_${c.toLowerCase()}`));
      assert.ok(keys.has(`class_boundary_${c.toLowerCase()}`));
    }
  });
});
