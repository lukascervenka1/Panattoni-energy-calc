/**
 * Tests for the savings math. Expected values here are computed by hand from
 * the documented formula (see CALCULATION.md), not re-derived from the code —
 * a test that recomputes the implementation proves nothing.
 *
 * The two worked examples (class C and class D at 15 000 m²) were additionally
 * cross-checked against the numbers the running app displays.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSavings,
  suggestConsumptionSplit,
  formatEur,
  formatEurPerM2,
  formatNumber,
} from "../src/lib/calc.ts";
import type { PenbClass } from "../src/lib/types.ts";
import config from "../data/config.json" with { type: "json" };

const CLASSES: PenbClass[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Locale grouping uses NBSP/narrow-NBSP depending on the ICU build. */
function norm(s: string): string {
  return s.replace(/[\s  ]+/g, " ");
}

describe("suggestConsumptionSplit", () => {
  test("class C (90) splits 30/70 into 25 ELE + 65 gas", () => {
    assert.deepEqual(suggestConsumptionSplit(config.classDefaultsKwhM2.C, config), {
      eleKwhM2: 25,
      gasKwhM2: 65,
    });
  });

  test("class G (450) splits into 135 ELE + 315 gas", () => {
    // Pins the 2026-08 change from 550 -> 450.
    assert.equal(config.classDefaultsKwhM2.G, 450);
    assert.deepEqual(suggestConsumptionSplit(450, config), {
      eleKwhM2: 135,
      gasKwhM2: 315,
    });
  });

  test("every shipped class default splits without drifting off its total", () => {
    // Rounding each half to 5 can push the sum off the class total (e.g. a
    // default of 125 yields 40+90=130, so picking class X would show 130).
    // Every value we actually ship must round-trip exactly.
    for (const c of CLASSES) {
      const total = config.classDefaultsKwhM2[c];
      const { eleKwhM2, gasKwhM2 } = suggestConsumptionSplit(total, config);
      assert.equal(
        eleKwhM2 + gasKwhM2,
        total,
        `class ${c}: ${eleKwhM2}+${gasKwhM2} != ${total}`,
      );
    }
  });

  test("splits land on multiples of 5 so the sliders can represent them", () => {
    for (const c of CLASSES) {
      const { eleKwhM2, gasKwhM2 } = suggestConsumptionSplit(config.classDefaultsKwhM2[c], config);
      assert.equal(eleKwhM2 % 5, 0, `class ${c} ELE`);
      assert.equal(gasKwhM2 % 5, 0, `class ${c} gas`);
    }
  });

  test("gas dominates every class, per the 30/70 methodology", () => {
    for (const c of CLASSES) {
      const { eleKwhM2, gasKwhM2 } = suggestConsumptionSplit(config.classDefaultsKwhM2[c], config);
      assert.ok(gasKwhM2 > eleKwhM2, `class ${c}: gas ${gasKwhM2} should exceed ELE ${eleKwhM2}`);
    }
  });
});

describe("calculateSavings — worked examples", () => {
  test("app default state: class C, 15 000 m²", () => {
    // delta      = (90 - 35) * 15000            = 825 000 kWh
    // priceBlend = (25*0.09 + 65*0.042) / 90    = 4.98/90  = 0.055333… €/kWh
    // co2Blend   = (25*0.00036 + 65*0.000202)/90 = 0.02213/90
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 25, gasKwhM2: 65 }, config);

    assert.equal(r.isOptimal, false);
    assert.equal(r.currentPneKwhM2, 90);
    assert.equal(r.referencePneKwhM2, 35);
    assert.equal(r.reductionPct, 61); // 1 - 35/90 = 61.11 %
    assert.equal(r.annualSavingsEur, 45_650); // 825 000 * 4.98/90
    assert.equal(r.fiveYearSavingsEur, 228_250);
    assert.equal(r.tenYearSavingsEur, 456_500);
    assert.equal(r.annualSavingsMwh, 825);
    assert.equal(r.annualCo2SavingsT, 203); // 825 000 * 0.02213/90 = 202.86
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 3.0433333) < 1e-6);
  });

  test("class D, 15 000 m² (matches the figures shown in the UI)", () => {
    // ELE 50 + gas 110 = 160; delta = 125 * 15000 = 1 875 000 kWh
    // priceBlend = (50*0.09 + 110*0.042)/160 = 9.12/160 = 0.057 €/kWh
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 50, gasKwhM2: 110 }, config);

    assert.equal(r.reductionPct, 78); // 1 - 35/160 = 78.125 %
    assert.equal(r.annualSavingsEur, 106_875); // -> "106,9 tis. €"
    assert.equal(r.fiveYearSavingsEur, 534_375);
    assert.equal(r.annualSavingsMwh, 1_875);
    assert.equal(r.annualCo2SavingsT, 471);
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 7.125) < 1e-9);
  });

  test("class G, 15 000 m²", () => {
    // ELE 135 + gas 315 = 450; delta = 415 * 15000 = 6 225 000 kWh
    // priceBlend = (135*0.09 + 315*0.042)/450 = 25.38/450 = 0.0564 €/kWh
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 135, gasKwhM2: 315 }, config);

    assert.equal(r.reductionPct, 92);
    assert.equal(r.annualSavingsEur, 351_090);
    assert.equal(r.fiveYearSavingsEur, 1_755_450);
    assert.equal(r.annualSavingsMwh, 6_225);
    assert.equal(r.annualCo2SavingsT, 1_553);
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 23.406) < 1e-9);
  });
});

describe("price and CO2 blending follow the actual ELE:gas ratio", () => {
  // All three cases share delta = (100 - 35) * 10 000 = 650 000 kWh.
  const AREA = 10000;

  test("all-electricity building is charged the electricity rate exactly", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    assert.equal(r.annualSavingsEur, 58_500); // 650 000 * 0.09
    assert.equal(r.annualCo2SavingsT, 234); // 650 000 * 0.00036
  });

  test("all-gas building is charged the gas rate exactly", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    assert.equal(r.annualSavingsEur, 27_300); // 650 000 * 0.042
    assert.equal(r.annualCo2SavingsT, 131); // 650 000 * 0.000202 = 131.3
  });

  test("50/50 building lands exactly midway between the two", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 50, gasKwhM2: 50 }, config);
    assert.equal(r.annualSavingsEur, 42_900); // (58 500 + 27 300) / 2
  });

  test("shifting the mix toward gas lowers the € saved on identical kWh", () => {
    const allEle = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const allGas = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    assert.equal(allEle.annualSavingsMwh, allGas.annualSavingsMwh); // same energy
    assert.ok(allEle.annualSavingsEur > allGas.annualSavingsEur); // different money
  });
});

describe("reference-value boundary", () => {
  test("exactly at the reference (35) reads as optimal, with no savings", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 15, gasKwhM2: 20 }, config);
    assert.equal(r.isOptimal, true);
    assert.equal(r.currentPneKwhM2, 35);
    assert.equal(r.annualSavingsEur, 0);
    assert.equal(r.annualSavingsEurPerM2, 0);
    assert.equal(r.annualCo2SavingsT, 0);
    assert.equal(r.reductionPct, 0);
    assert.equal(r.fiveYearSavingsEur, 0);
  });

  test("below the reference reads as optimal", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 14, gasKwhM2: 15 }, config);
    assert.equal(r.isOptimal, true);
    assert.equal(r.annualSavingsEur, 0);
  });

  test("one kWh/m² above the reference produces a small real saving", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 15, gasKwhM2: 21 }, config);
    assert.equal(r.isOptimal, false);
    assert.equal(r.currentPneKwhM2, 36);
    assert.equal(r.annualSavingsEur, 620); // 10 000 * 2.232/36
    assert.equal(r.reductionPct, 3);
    assert.equal(r.annualSavingsMwh, 10);
  });

  test("zero consumption does not divide by zero", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 0, gasKwhM2: 0 }, config);
    assert.equal(r.isOptimal, true);
    for (const v of [
      r.annualSavingsEur,
      r.annualSavingsEurPerM2,
      r.annualCo2SavingsT,
      r.reductionPct,
      r.annualSavingsMwh,
    ]) {
      assert.ok(Number.isFinite(v), "every output must be finite");
    }
  });
});

describe("invariants", () => {
  test("€/m² is independent of floor area", () => {
    const small = calculateSavings({ areaM2: 500, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const large = calculateSavings({ areaM2: 200000, eleKwhM2: 100, gasKwhM2: 0 }, config);
    assert.ok(Math.abs(small.annualSavingsEurPerM2 - large.annualSavingsEurPerM2) < 1e-9);
    assert.ok(Math.abs(small.annualSavingsEurPerM2 - 5.85) < 1e-9); // 65 kWh * 0.09
  });

  test("doubling the area doubles the annual saving", () => {
    const base = calculateSavings({ areaM2: 10000, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const twice = calculateSavings({ areaM2: 20000, eleKwhM2: 100, gasKwhM2: 0 }, config);
    assert.equal(twice.annualSavingsEur, base.annualSavingsEur * 2);
    assert.equal(twice.annualSavingsMwh, base.annualSavingsMwh * 2);
  });

  test("higher consumption always saves more", () => {
    let previous = 0;
    for (const kwhM2 of [40, 60, 90, 160, 250, 380, 450]) {
      const r = calculateSavings(
        { areaM2: 15000, eleKwhM2: kwhM2 * 0.3, gasKwhM2: kwhM2 * 0.7 },
        config,
      );
      assert.ok(r.annualSavingsEur > previous, `${kwhM2} kWh/m² should beat the previous step`);
      previous = r.annualSavingsEur;
    }
  });

  test("reduction stays a strict percentage below 100", () => {
    for (const kwhM2 of [36, 90, 450, 5000]) {
      const r = calculateSavings(
        { areaM2: 15000, eleKwhM2: kwhM2 * 0.3, gasKwhM2: kwhM2 * 0.7 },
        config,
      );
      assert.ok(r.reductionPct > 0 && r.reductionPct < 100, `${kwhM2} -> ${r.reductionPct}%`);
    }
  });

  test("multi-year figures are plain multiples of the annual one", () => {
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 25, gasKwhM2: 65 }, config);
    assert.equal(r.fiveYearSavingsEur, r.annualSavingsEur * 5);
    assert.equal(r.tenYearSavingsEur, r.annualSavingsEur * 10);
  });
});

describe("real portfolio figures", () => {
  test("our efficient benchmark halls sit at or below the reference", () => {
    // Týniště 12.8 kWh/m² at 91 % electricity; Prague Airport II 24.1 at 99 %.
    for (const [total, elecShare] of [
      [12.8, 0.91],
      [24.1, 0.99],
    ]) {
      const r = calculateSavings(
        { areaM2: 16644, eleKwhM2: total * elecShare, gasKwhM2: total * (1 - elecShare) },
        config,
      );
      assert.equal(r.isOptimal, true, `${total} kWh/m² should read as best-in-class`);
    }
  });
});

describe("formatting", () => {
  test("formatEur switches units at the thousand and million marks", () => {
    assert.equal(norm(formatEur(999, "cs")), "999 €");
    assert.equal(norm(formatEur(1_000, "cs")), "1 tis. €");
    assert.equal(norm(formatEur(49_800, "cs")), "49,8 tis. €");
    assert.equal(norm(formatEur(1_776_600, "cs")), "1,78 mil. €");
  });

  test("formatEur uses English units and separators for en", () => {
    assert.equal(norm(formatEur(49_800, "en")), "49.8 k €");
    assert.equal(norm(formatEur(1_776_600, "en")), "1.78 M €");
    assert.equal(norm(formatEur(999, "en")), "999 €");
  });

  test("formatEurPerM2 always shows exactly one decimal", () => {
    assert.equal(norm(formatEurPerM2(3.32, "cs")), "3,3 €/m²");
    assert.equal(norm(formatEurPerM2(23.688, "cs")), "23,7 €/m²");
    assert.equal(norm(formatEurPerM2(7, "cs")), "7,0 €/m²");
    assert.equal(norm(formatEurPerM2(3.32, "en")), "3.3 €/m²");
  });

  test("formatNumber groups thousands per locale and rounds", () => {
    assert.equal(norm(formatNumber(16_644, "cs")), "16 644");
    assert.equal(norm(formatNumber(16_644, "en")), "16,644");
    assert.equal(norm(formatNumber(12.8, "cs")), "13");
  });
});
