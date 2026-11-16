import assert from "node:assert/strict";
import { test } from "node:test";
import { waPhoneDigits, waShareHref } from "./wa-phone";

test("waPhoneDigits normalizes TR mobiles", () => {
  assert.equal(waPhoneDigits("0532 111 22 33"), "905321112233");
  assert.equal(waPhoneDigits("5321112233"), "905321112233");
  assert.equal(waPhoneDigits("+90 532 111 22 33"), "905321112233");
  assert.equal(waPhoneDigits(""), null);
  assert.equal(waPhoneDigits("123"), null);
});

test("waShareHref uses phone path when present", () => {
  assert.equal(
    waShareHref("merhaba", "05321112233"),
    `https://wa.me/905321112233?text=${encodeURIComponent("merhaba")}`,
  );
  assert.equal(
    waShareHref("merhaba"),
    `https://wa.me/?text=${encodeURIComponent("merhaba")}`,
  );
});
