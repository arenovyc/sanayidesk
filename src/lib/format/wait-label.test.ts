import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { truncateComplaint, waitLabel } from "./wait-label";

describe("waitLabel", () => {
  const now = Date.parse("2026-11-14T12:00:00.000Z");

  it("az önce", () => {
    assert.equal(waitLabel("2026-11-14T11:58:00.000Z", now), "Az önce");
  });

  it("minutes", () => {
    assert.equal(waitLabel("2026-11-14T11:20:00.000Z", now), "40 dk");
  });

  it("hours", () => {
    assert.equal(
      waitLabel("2026-11-14T10:00:00.000Z", now),
      "2 saattir bekliyor",
    );
  });
});

describe("truncateComplaint", () => {
  it("empty", () => {
    assert.equal(truncateComplaint("  "), "");
  });

  it("short", () => {
    assert.equal(truncateComplaint("Fren sesi"), "Fren sesi");
  });
});
