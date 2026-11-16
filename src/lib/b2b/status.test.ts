import assert from "node:assert/strict";
import { test } from "node:test";
import { canConfirmB2b, canRejectB2b, nextB2bStatus } from "./status";

test("b2b pending can confirm or reject", () => {
  assert.equal(canConfirmB2b("pending"), true);
  assert.equal(canRejectB2b("pending"), true);
  assert.equal(nextB2bStatus("pending", "confirm"), "confirmed");
  assert.equal(nextB2bStatus("pending", "reject"), "rejected");
});

test("b2b confirmed/rejected are terminal", () => {
  assert.equal(canConfirmB2b("confirmed"), false);
  assert.equal(canRejectB2b("rejected"), false);
  assert.equal(nextB2bStatus("confirmed", "confirm"), null);
});
