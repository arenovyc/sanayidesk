import assert from "node:assert/strict";
import { test } from "node:test";
import { formatIstanbulDate, istanbulYear } from "./date";

test("formats a date in Istanbul locale", () => {
  const formatted = formatIstanbulDate(new Date("2026-11-11T09:00:00.000Z"));
  assert.match(formatted, /2026/);
  assert.match(formatted, /Kas|11/);
});

test("istanbul year uses Europe/Istanbul", () => {
  assert.equal(istanbulYear(new Date("2026-01-01T00:30:00.000Z")), 2026);
});
