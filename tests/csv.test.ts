/**
 * Tests for the CSV parser that reads the published Google Sheet. Malformed
 * parsing here would silently feed wrong numbers into the calculator, so the
 * awkward cases (quoted commas, escaped quotes, CRLF, short rows) matter.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseCsvRecords } from "../src/lib/csv.ts";

describe("parseCsv", () => {
  test("splits a plain grid", () => {
    assert.deepEqual(parseCsv("a,b\n1,2"), [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("keeps commas that sit inside quoted fields", () => {
    assert.deepEqual(parseCsv('key,note\nx,"Emisní faktor, t CO2 / kWh"'), [
      ["key", "note"],
      ["x", "Emisní faktor, t CO2 / kWh"],
    ]);
  });

  test("unescapes doubled quotes", () => {
    assert.deepEqual(parseCsv('a\n"say ""hi"""'), [["a"], ['say "hi"']]);
  });

  test("handles CRLF line endings", () => {
    assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("drops blank lines rather than emitting empty rows", () => {
    assert.deepEqual(parseCsv("a,b\n\n1,2\n\n"), [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("returns nothing for empty input", () => {
    assert.deepEqual(parseCsv(""), []);
    assert.deepEqual(parseCsv("\n\n"), []);
  });
});

describe("parseCsvRecords", () => {
  test("keys rows by trimmed header names", () => {
    assert.deepEqual(parseCsvRecords("id, park \nN01, Cheb East "), [
      { id: "N01", park: "Cheb East" },
    ]);
  });

  test("fills missing trailing columns with empty strings", () => {
    // The Config sheet leaves class_boundary_g blank; a short row must not
    // become undefined, because the loader distinguishes "" from missing.
    assert.deepEqual(parseCsvRecords("key,value,note\nclass_boundary_g,,no upper bound"), [
      { key: "class_boundary_g", value: "", note: "no upper bound" },
    ]);
    assert.deepEqual(parseCsvRecords("a,b,c\n1"), [{ a: "1", b: "", c: "" }]);
  });

  test("returns an empty list for a header-only sheet", () => {
    assert.deepEqual(parseCsvRecords("id,park"), []);
    assert.deepEqual(parseCsvRecords(""), []);
  });
});
