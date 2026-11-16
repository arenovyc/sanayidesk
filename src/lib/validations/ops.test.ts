import assert from "node:assert/strict";
import { test } from "node:test";
import { addPaymentSchema, pinSchema } from "./ops";

test("pin must be 4 digits", () => {
  assert.equal(pinSchema.safeParse("1234").success, true);
  assert.equal(pinSchema.safeParse("12").success, false);
  assert.equal(pinSchema.safeParse("abcd").success, false);
});

test("payment amount must be positive", () => {
  const ok = addPaymentSchema.safeParse({
    workOrderId: "00000000-0000-4000-8000-000000000001",
    amount: 10,
    method: "cash",
    invoiceMode: "uninvoiced",
  });
  assert.equal(ok.success, true);
  const bad = addPaymentSchema.safeParse({
    workOrderId: "00000000-0000-4000-8000-000000000001",
    amount: 0,
    method: "cash",
    invoiceMode: "uninvoiced",
  });
  assert.equal(bad.success, false);
});
