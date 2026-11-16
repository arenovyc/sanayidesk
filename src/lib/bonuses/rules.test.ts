import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidBonusAmount, totalBonusAmount } from "./rules";

test("isValidBonusAmount requires positive", () => {
  assert.equal(isValidBonusAmount(10), true);
  assert.equal(isValidBonusAmount(0), false);
  assert.equal(isValidBonusAmount(-1), false);
});

test("totalBonusAmount sums", () => {
  assert.equal(totalBonusAmount([{ amount: 10 }, { amount: 2.5 }]), 12.5);
});
