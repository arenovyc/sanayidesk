import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shortDisplayNo,
  truncateComplaint,
  waitBadgeLabel,
  waitLabel,
} from "./wait-label";

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

describe("waitBadgeLabel", () => {
  const now = Date.parse("2026-11-14T12:00:00.000Z");

  it("compacts minutes hours days", () => {
    assert.equal(waitBadgeLabel("2026-11-14T11:58:00.000Z", now), "yeni");
    assert.equal(waitBadgeLabel("2026-11-14T11:20:00.000Z", now), "40dk");
    assert.equal(waitBadgeLabel("2026-11-14T10:00:00.000Z", now), "2s");
    assert.equal(waitBadgeLabel("2026-11-09T12:00:00.000Z", now), "5g");
  });
});

describe("shortDisplayNo", () => {
  it("takes year suffix", () => {
    assert.equal(shortDisplayNo("2026-0031"), "#0031");
    assert.equal(shortDisplayNo(null), null);
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
