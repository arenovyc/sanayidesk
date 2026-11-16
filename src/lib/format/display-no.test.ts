import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDisplayNo, isValidDisplayNo } from "./display-no";

test("formats display_no as YYYY-####", () => {
  assert.equal(formatDisplayNo(2026, 1), "2026-0001");
  assert.equal(formatDisplayNo(2026, 42), "2026-0042");
  assert.equal(isValidDisplayNo("2026-0001"), true);
  assert.equal(isValidDisplayNo("26-1"), false);
});
