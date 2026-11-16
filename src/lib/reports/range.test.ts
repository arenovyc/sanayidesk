import assert from "node:assert/strict";
import { test } from "node:test";
import { istanbulMonthStartYmd, rangeFromStartIso, rangeToInclusiveEndIso } from "./range";

test("istanbulMonthStartYmd uses first day of month", () => {
  assert.equal(istanbulMonthStartYmd("2026-11-13"), "2026-11-01");
});

test("range ISO helpers include Istanbul offsets", () => {
  assert.equal(rangeFromStartIso("2026-11-01").startsWith("2026-11-01T00:00:00"), true);
  assert.equal(rangeToInclusiveEndIso("2026-11-13").includes("23:59:59"), true);
});
