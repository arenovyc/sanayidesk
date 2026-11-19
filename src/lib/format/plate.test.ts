import assert from "node:assert/strict";
import { test } from "node:test";
import { displayPlate, normalizePlate, parseTrPlate } from "./plate";

test("strips spaces and hyphens", () => {
  assert.equal(normalizePlate("06 ABC 123"), "06ABC123");
  assert.equal(normalizePlate("06-abc-123"), "06ABC123");
  assert.equal(normalizePlate("  34 ab 1234 "), "34AB1234");
});

test("does not turn i into Turkish İ", () => {
  assert.equal(normalizePlate("06 abi 123"), "06ABI123");
  assert.equal(normalizePlate("06ıbc123"), "06IBC123");
});

test("keeps digits and latin letters only as uppercase ascii", () => {
  assert.equal(normalizePlate("34.ad.1234"), "34AD1234");
});

test("displayPlate inserts spaces for TR format", () => {
  assert.equal(displayPlate("06KMK7890"), "06 KMK 7890");
  assert.equal(displayPlate("06 ABC 123"), "06 ABC 123");
  assert.equal(displayPlate("34AB1234"), "34 AB 1234");
  assert.equal(displayPlate("06A12"), "06 A 12");
});

test("displayPlate falls back when shape unknown", () => {
  assert.equal(displayPlate("ABC"), "ABC");
  assert.equal(displayPlate("12345"), "12345");
});

test("parseTrPlate splits official plates", () => {
  const parsed = parseTrPlate("06kmk7890");
  assert.equal(parsed.official, true);
  if (parsed.official) {
    assert.equal(parsed.city, "06");
    assert.equal(parsed.letters, "KMK");
    assert.equal(parsed.numbers, "7890");
    assert.equal(parsed.formatted, "06 KMK 7890");
  }
});

test("parseTrPlate marks unknown shapes unofficial", () => {
  const parsed = parseTrPlate("ABC");
  assert.equal(parsed.official, false);
  assert.equal(parsed.formatted, "ABC");
});
