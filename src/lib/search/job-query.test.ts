import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesJobQuery, parseJobQuery } from "./job-query";

test("parseJobQuery display_no", () => {
  const q = parseJobQuery("2026-12");
  assert.equal(q.kind, "display_no");
  assert.equal(q.normalized, "2026-0012");
});

test("parseJobQuery plate", () => {
  const q = parseJobQuery("34 abc 123");
  assert.equal(q.kind, "plate");
  assert.equal(q.normalized, "34ABC123");
});

test("matchesJobQuery", () => {
  const plateQ = parseJobQuery("34ab");
  assert.equal(
    matchesJobQuery(plateQ, { plate: "34ABC123", displayNo: "2026-0001" }),
    true,
  );
  const noQ = parseJobQuery("2026-1");
  assert.equal(
    matchesJobQuery(noQ, { plate: "34ABC123", displayNo: "2026-0001" }),
    true,
  );
});
