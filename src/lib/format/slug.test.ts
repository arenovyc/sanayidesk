import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidShopSlug, slugifyShopName } from "./slug";

test("folds Turkish letters", () => {
  assert.equal(slugifyShopName("Şaşmaz Oto"), "sasmaz-oto");
  assert.equal(slugifyShopName("İstanbul Motor"), "istanbul-motor");
});

test("empty name falls back", () => {
  assert.equal(slugifyShopName("   "), "dukkan");
});

test("validates slug format", () => {
  assert.equal(isValidShopSlug("sasmaz-oto"), true);
  assert.equal(isValidShopSlug("ABC"), false);
  assert.equal(isValidShopSlug("-x"), false);
});
