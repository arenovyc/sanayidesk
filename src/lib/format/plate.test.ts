import assert from "node:assert/strict";
import { test } from "node:test";
import { displayPlate, normalizePlate } from "./plate";

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
