import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAcceptPayment,
  isActivePayment,
  paidAfterVoid,
  remainingDue,
  sumPaidAmount,
} from "./money";

test("remaining due never negative", () => {
  assert.equal(remainingDue(100, 40), 60);
  assert.equal(remainingDue(100, 100), 0);
  assert.equal(remainingDue(100, 120), 0);
});

test("rejects overpay and empty due", () => {
  assert.equal(canAcceptPayment(100, 80, 20), true);
  assert.equal(canAcceptPayment(100, 80, 30), false);
  assert.equal(canAcceptPayment(0, 0, 10), false);
  assert.equal(canAcceptPayment(100, 0, 0), false);
});

test("sumPaidAmount ignores credit and voided", () => {
  assert.equal(
    sumPaidAmount([
      { amount: 40, method: "cash" },
      { amount: 20, method: "credit" },
      { amount: 10, method: "card", voidedAt: "2026-01-01" },
    ]),
    40,
  );
});

test("isActivePayment filters voided from list", () => {
  const rows = [
    { id: "a", voidedAt: null },
    { id: "b", voidedAt: "2026-01-01" },
    { id: "c" },
  ];
  assert.deepEqual(
    rows.filter(isActivePayment).map((row) => row.id),
    ["a", "c"],
  );
});

test("paidAfterVoid restores remaining for cash", () => {
  const result = paidAfterVoid(100, 60, 20, "cash");
  assert.equal(result.paid, 40);
  assert.equal(result.remaining, 60);
});
