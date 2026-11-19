import assert from "node:assert/strict";
import { test } from "node:test";
import { WORK_ORDER_STATUSES } from "./status";
import { STATUS_TONE, statusTone } from "./status-tone";

test("every work order status has a tone", () => {
  for (const status of WORK_ORDER_STATUSES) {
    const tone = statusTone(status);
    assert.ok(tone.badge.includes("bg-"));
    assert.ok(tone.bar.startsWith("bg-"));
    assert.equal(tone, STATUS_TONE[status]);
  }
});

test("pipeline colors stay distinct", () => {
  assert.match(statusTone("waiting_approval").badge, /amber/);
  assert.match(statusTone("waiting_parts").badge, /orange/);
  assert.match(statusTone("ready").badge, /emerald/);
  assert.match(statusTone("cancelled").badge, /red/);
});
