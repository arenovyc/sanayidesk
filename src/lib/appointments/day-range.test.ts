import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { istanbulDayBoundsIso } from "@/lib/appointments/day-range";

describe("istanbulDayBoundsIso", () => {
  it("returns ordered start/end ISO", () => {
    const { startIso, endIso } = istanbulDayBoundsIso(
      new Date("2026-06-15T12:00:00+03:00"),
    );
    assert.ok(startIso < endIso);
    assert.match(startIso, /Z$/);
  });
});
