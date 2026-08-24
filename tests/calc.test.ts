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
    // delta      = (90 - 30) * 15000            = 900 000 kWh
    // priceBlend = (25*0.09 + 65*0.042) / 90    = 4.98/90  = 0.055333… €/kWh
    // co2Blend   = (25*0.00036 + 65*0.000202)/90 = 0.02213/90
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 25, gasKwhM2: 65 }, config);

    assert.equal(r.isOptimal, false);
    assert.equal(r.currentPneKwhM2, 90);
    assert.equal(r.referencePneKwhM2, 30);
    assert.equal(r.reductionPct, 67); // 1 - 30/90 = 66.67 %
    assert.equal(r.annualSavingsEur, 49_800); // 900 000 * 4.98/90
    assert.equal(r.fiveYearSavingsEur, 249_000);
    assert.equal(r.tenYearSavingsEur, 498_000);
    assert.equal(r.annualSavingsMwh, 900);
    assert.equal(r.annualCo2SavingsT, 221); // 10 000 * 0.02213 = 221.3
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 3.32) < 1e-9);
  });

  test("class D, 15 000 m² (matches the figures shown in the UI)", () => {
    // ELE 50 + gas 110 = 160; delta = 130 * 15000 = 1 950 000 kWh
    // priceBlend = (50*0.09 + 110*0.042)/160 = 9.12/160 = 0.057 €/kWh
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 50, gasKwhM2: 110 }, config);

    assert.equal(r.reductionPct, 81); // 1 - 30/160 = 81.25 %
    assert.equal(r.annualSavingsEur, 111_150); // -> "111,2 tis. €"
    assert.equal(r.fiveYearSavingsEur, 555_750); // -> "555,8 tis. €"
    assert.equal(r.annualSavingsMwh, 1_950);
    assert.equal(r.annualCo2SavingsT, 490);
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 7.41) < 1e-9);
  });

  test("class G, 15 000 m²", () => {
    // ELE 135 + gas 315 = 450; delta = 420 * 15000 = 6 300 000 kWh
    // priceBlend = (135*0.09 + 315*0.042)/450 = 25.38/450 = 0.0564 €/kWh
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 135, gasKwhM2: 315 }, config);

    assert.equal(r.reductionPct, 93);
    assert.equal(r.annualSavingsEur, 355_320);
    assert.equal(r.fiveYearSavingsEur, 1_776_600);
    assert.equal(r.annualSavingsMwh, 6_300);
    assert.equal(r.annualCo2SavingsT, 1_571);
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 23.688) < 1e-9);
  });
});

describe("price and CO2 blending follow the actual ELE:gas ratio", () => {
  // All three cases share delta = (100 - 30) * 10 000 = 700 000 kWh.
  const AREA = 10000;

  test("all-electricity building is charged the electricity rate exactly", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    assert.equal(r.annualSavingsEur, 63_000); // 700 000 * 0.09
    assert.equal(r.annualCo2SavingsT, 252); // 700 000 * 0.00036
  });

  test("all-gas building is charged the gas rate exactly", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    assert.equal(r.annualSavingsEur, 29_400); // 700 000 * 0.042
    assert.equal(r.annualCo2SavingsT, 141); // 700 000 * 0.000202 = 141.4
  });

  test("50/50 building lands exactly midway between the two", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 50, gasKwhM2: 50 }, config);
    assert.equal(r.annualSavingsEur, 46_200); // (63 000 + 29 400) / 2
  });

  test("shifting the mix toward gas lowers the € saved on identical kWh", () => {
    const allEle = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const allGas = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    assert.equal(allEle.annualSavingsMwh, allGas.annualSavingsMwh); // same energy
    assert.ok(allEle.annualSavingsEur > allGas.annualSavingsEur); // different money
  });
});

describe("reference-value boundary", () => {
  test("exactly at the reference (30) reads as optimal, with no savings", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 15, gasKwhM2: 15 }, config);
    assert.equal(r.isOptimal, true);
    assert.equal(r.currentPneKwhM2, 30);
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
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 15, gasKwhM2: 16 }, config);
    assert.equal(r.isOptimal, false);
    assert.equal(r.currentPneKwhM2, 31);
    assert.equal(r.annualSavingsEur, 652); // 10 000 * 2.022/31
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
    assert.ok(Math.abs(small.annualSavingsEurPerM2 - 6.3) < 1e-9); // 70 kWh * 0.09
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
    for (const kwhM2 of [31, 90, 450, 5000]) {
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
