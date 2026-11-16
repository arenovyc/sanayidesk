import assert from "node:assert/strict";
import { test } from "node:test";
import { isLowStock, movementDelta } from "./rules";

test("isLowStock when qty at or below min", () => {
  assert.equal(isLowStock(2, 2), true);
  assert.equal(isLowStock(1, 2), true);
  assert.equal(isLowStock(3, 2), false);
});

test("movementDelta for in out adjust", () => {
  assert.equal(movementDelta("in", 5, 10), 5);
  assert.equal(movementDelta("out", 3, 10), -3);
  assert.equal(movementDelta("adjust", 7, 10), -3);
});
