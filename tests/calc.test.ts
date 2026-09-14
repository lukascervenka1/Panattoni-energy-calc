/**
 * Tests for the savings math. Expected values here are computed by hand from
 * the documented formula (see CALCULATION.md), not re-derived from the code —
 * a test that recomputes the implementation proves nothing.
 *
 * The current building is always priced/emitted at whatever mix the visitor
 * enters. The reference (offered) building is priced/emitted at its own
 * fixed mix (referencePneKwhM2 @ referenceEleSharePct) — a business decision,
 * not a mirror of the visitor's input. Because electricity costs more per
 * kWh than gas, a building that's already efficient but gas-heavy can save
 * real energy while saving zero money; those figures are floored at 0
 * independently rather than shown negative (see the "cost-neutral floor"
 * suite below).
 *
 * The class C and D worked examples were additionally cross-checked against
 * the numbers the running app displays.
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
  return s.replace(/[\s  ]+/g, " ");
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
  // Reference building's own cost/emissions, fixed regardless of input:
  // 35 kWh/m² entirely on electricity (referenceEleSharePct = 1.0).
  //   refCostPerM2 = 35 * 0.09     = 3.15   €/m²
  //   refCo2PerM2  = 35 * 0.00036  = 0.0126 t/m²

  test("app default state: class C, 15 000 m²", () => {
    // currentCostPerM2 = 25*0.09 + 65*0.042 = 2.25 + 2.73 = 4.98 €/m²
    // savings/m²        = 4.98 - 3.15 = 1.83 €/m²
    // currentCo2PerM2   = 25*0.00036 + 65*0.000202 = 0.02213 t/m²
    // co2 saved/m²       = 0.02213 - 0.0126 = 0.00953 t/m²
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 25, gasKwhM2: 65 }, config);

    assert.equal(r.isOptimal, false);
    assert.equal(r.hasFinancialSavings, true);
    assert.equal(r.currentPneKwhM2, 90);
    assert.equal(r.referencePneKwhM2, 35);
    assert.equal(r.reductionPct, 61); // 1 - 35/90 = 61.11 %
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 1.83) < 1e-9);
    assert.equal(r.annualSavingsEur, 27_450); // 1.83 * 15000
    assert.equal(r.fiveYearSavingsEur, 137_250);
    assert.equal(r.tenYearSavingsEur, 274_500);
    assert.equal(r.annualSavingsMwh, 825);
    assert.equal(r.annualCo2SavingsT, 143); // 0.00953 * 15000 = 142.95
  });

  test("class D, 15 000 m² (matches the figures shown in the UI)", () => {
    // currentCostPerM2 = 50*0.09 + 110*0.042 = 4.5 + 4.62 = 9.12 €/m²
    // savings/m²        = 9.12 - 3.15 = 5.97 €/m²
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 50, gasKwhM2: 110 }, config);

    assert.equal(r.hasFinancialSavings, true);
    assert.equal(r.reductionPct, 78); // 1 - 35/160 = 78.125 %
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 5.97) < 1e-9);
    assert.equal(r.annualSavingsEur, 89_550);
    assert.equal(r.fiveYearSavingsEur, 447_750);
    assert.equal(r.annualSavingsMwh, 1_875);
    assert.equal(r.annualCo2SavingsT, 414);
  });

  test("class G, 15 000 m²", () => {
    // currentCostPerM2 = 135*0.09 + 315*0.042 = 12.15 + 13.23 = 25.38 €/m²
    // savings/m²        = 25.38 - 3.15 = 22.23 €/m²
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 135, gasKwhM2: 315 }, config);

    assert.equal(r.reductionPct, 92);
    assert.ok(Math.abs(r.annualSavingsEurPerM2 - 22.23) < 1e-9);
    assert.equal(r.annualSavingsEur, 333_450);
    assert.equal(r.fiveYearSavingsEur, 1_667_250);
    assert.equal(r.annualSavingsMwh, 6_225);
    assert.equal(r.annualCo2SavingsT, 1_494);
  });
});

describe("current vs. reference mix are priced independently", () => {
  // The reference building's cost/CO2 never move in this suite — only the
  // visitor's input mix changes. Reference stays 35 kWh/m² @ 100 % electric:
  // 3.15 €/m², 0.0126 t/m².
  const AREA = 10000;

  test("all-electric input: same rate on both sides, so it's a plain 65 kWh/m² delta", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    // cost: 100*0.09=9.00 vs ref 3.15 -> 5.85 €/m² * 10 000
    assert.equal(r.annualSavingsEur, 58_500);
    assert.equal(r.annualCo2SavingsT, 234); // (0.036 - 0.0126) * 10 000
    assert.equal(r.hasFinancialSavings, true);
  });

  test("all-gas input pays today's gas price but is compared to an all-electric reference", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    // cost: 100*0.042=4.20 vs ref 3.15 -> 1.05 €/m² * 10 000
    assert.equal(r.annualSavingsEur, 10_500);
    assert.equal(r.annualCo2SavingsT, 76); // (0.0202 - 0.0126) * 10 000 = 76
    assert.equal(r.hasFinancialSavings, true);
  });

  test("50/50 input lands exactly midway between the two", () => {
    const r = calculateSavings({ areaM2: AREA, eleKwhM2: 50, gasKwhM2: 50 }, config);
    assert.equal(r.annualSavingsEur, 34_500); // (58 500 + 10 500) / 2
  });

  test("more gas in the mix still lowers € saved, even though energy saved is identical", () => {
    const allEle = calculateSavings({ areaM2: AREA, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const allGas = calculateSavings({ areaM2: AREA, eleKwhM2: 0, gasKwhM2: 100 }, config);
    assert.equal(allEle.annualSavingsMwh, allGas.annualSavingsMwh); // same energy
    assert.ok(allEle.annualSavingsEur > allGas.annualSavingsEur); // different money
  });
});

describe("cost-neutral floor — efficient but gas-heavy buildings", () => {
  // Electricity costs 2.14x gas per kWh here. A building that's already
  // efficient but runs mostly on (cheap) gas can use meaningfully less
  // energy than the all-electric reference and still not save money
  // switching to it. The UI must never show a negative "saving" — see
  // ResultsHero's hasFinancialSavings branch.

  test("class A and B floor annual savings at 0 despite a real energy reduction", () => {
    for (const [ele, gas] of [
      [10, 30], // class A: 40 kWh/m², 25 % electricity
      [15, 40], // class B: 55 kWh/m², 27 % electricity
    ]) {
      const r = calculateSavings({ areaM2: 15000, eleKwhM2: ele, gasKwhM2: gas }, config);
      assert.equal(r.isOptimal, false, `${ele}+${gas}: still above the reference in raw kWh`);
      assert.equal(r.hasFinancialSavings, false, `${ele}+${gas}`);
      assert.equal(r.annualSavingsEur, 0, `${ele}+${gas}`);
      assert.equal(r.annualSavingsEurPerM2, 0, `${ele}+${gas}`);
      assert.equal(r.fiveYearSavingsEur, 0, `${ele}+${gas}`);
      assert.ok(r.reductionPct > 0, `${ele}+${gas}: energy reduction stays real and positive`);
      assert.ok(r.annualSavingsMwh > 0, `${ele}+${gas}: MWh saved stays real and positive`);
    }
  });

  test("class A: the floor extends to CO2 too — 25 % electricity beats the reference's 100 %", () => {
    // currentCo2PerM2 = 10*0.00036 + 30*0.000202 = 0.00966 t/m² < ref 0.0126 t/m²
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 10, gasKwhM2: 30 }, config);
    assert.equal(r.annualCo2SavingsT, 0);
  });

  test("class B: money floors to 0 but CO2 does not — the two floors are independent", () => {
    // currentCo2PerM2 = 15*0.00036 + 40*0.000202 = 0.01348 t/m² > ref 0.0126 t/m²
    const r = calculateSavings({ areaM2: 15000, eleKwhM2: 15, gasKwhM2: 40 }, config);
    assert.equal(r.annualSavingsEur, 0);
    assert.equal(r.annualCo2SavingsT, 13); // (0.01348 - 0.0126) * 15000 = 13.2
  });

  test("breakeven for a 30:70 mix sits just under 56 kWh/m²", () => {
    // cost(x) = x * (0.3*0.09 + 0.7*0.042) = 0.0564x; ref cost = 3.15
    // breakeven x = 3.15 / 0.0564 ≈ 55.85 kWh/m²
    const below = calculateSavings({ areaM2: 10000, eleKwhM2: 55 * 0.3, gasKwhM2: 55 * 0.7 }, config);
    const above = calculateSavings({ areaM2: 10000, eleKwhM2: 60 * 0.3, gasKwhM2: 60 * 0.7 }, config);
    assert.equal(below.hasFinancialSavings, false);
    assert.equal(above.hasFinancialSavings, true);
  });
});

describe("reference-value boundary", () => {
  test("exactly at the reference (35) reads as optimal, with no savings", () => {
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 15, gasKwhM2: 20 }, config);
    assert.equal(r.isOptimal, true);
    assert.equal(r.hasFinancialSavings, false);
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

  test("just above the reference, on a mostly-electric mix, produces a small real saving", () => {
    // 35 kWh/m² electricity + 1 kWh/m² gas: cost 35*0.09+1*0.042=3.192 vs ref 3.15
    const r = calculateSavings({ areaM2: 10000, eleKwhM2: 35, gasKwhM2: 1 }, config);
    assert.equal(r.isOptimal, false);
    assert.equal(r.hasFinancialSavings, true);
    assert.equal(r.currentPneKwhM2, 36);
    assert.equal(r.annualSavingsEur, 420); // 0.042 €/m² * 10 000
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
    assert.ok(Math.abs(small.annualSavingsEurPerM2 - 5.85) < 1e-9); // 65 kWh/m² * 0.09
  });

  test("doubling the area doubles the annual saving", () => {
    const base = calculateSavings({ areaM2: 10000, eleKwhM2: 100, gasKwhM2: 0 }, config);
    const twice = calculateSavings({ areaM2: 20000, eleKwhM2: 100, gasKwhM2: 0 }, config);
    assert.equal(twice.annualSavingsEur, base.annualSavingsEur * 2);
    assert.equal(twice.annualSavingsMwh, base.annualSavingsMwh * 2);
  });

  test("above the cost-neutral floor, higher consumption always saves more", () => {
    // Starts at 60, not 40: on a 30:70 mix the floor sits at ~55.85 kWh/m²
    // (see "cost-neutral floor" above) — below it every value floors to the
    // same 0, which isn't a "beats the previous step" comparison.
    let previous = 0;
    for (const kwhM2 of [60, 90, 160, 250, 380, 450]) {
      const r = calculateSavings(
        { areaM2: 15000, eleKwhM2: kwhM2 * 0.3, gasKwhM2: kwhM2 * 0.7 },
        config,
      );
      assert.ok(r.annualSavingsEur > previous, `${kwhM2} kWh/m² should beat the previous step`);
      previous = r.annualSavingsEur;
    }
  });

  test("reduction stays a strict percentage below 100 (energy, independent of mix or cost)", () => {
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
