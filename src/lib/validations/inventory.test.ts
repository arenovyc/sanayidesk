import assert from "node:assert/strict";
import { test } from "node:test";
import { inventoryMoveSchema, quoteAmountSchema } from "./inventory";

test("inventoryMoveSchema requires positive qty", () => {
  assert.equal(
    inventoryMoveSchema.safeParse({
      itemId: "00000000-0000-4000-8000-000000000001",
      kind: "out",
      qty: 1,
    }).success,
    true,
  );
  assert.equal(
    inventoryMoveSchema.safeParse({
      itemId: "00000000-0000-4000-8000-000000000001",
      kind: "out",
      qty: 0,
    }).success,
    false,
  );
});

test("quoteAmountSchema allows null or non-negative", () => {
  assert.equal(
    quoteAmountSchema.safeParse({
      workOrderId: "00000000-0000-4000-8000-000000000001",
      quoteAmount: null,
    }).success,
    true,
  );
  assert.equal(
    quoteAmountSchema.safeParse({
      workOrderId: "00000000-0000-4000-8000-000000000001",
      quoteAmount: 100,
    }).success,
    true,
  );
  assert.equal(
    quoteAmountSchema.safeParse({
      workOrderId: "00000000-0000-4000-8000-000000000001",
      quoteAmount: -1,
    }).success,
    false,
  );
});
