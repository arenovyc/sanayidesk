import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAssignedAtLabel,
  formatAssignmentRangeLabel,
  formatIstanbulDate,
  istanbulYear,
} from "./date";

test("formats a date in Istanbul locale", () => {
  const formatted = formatIstanbulDate(new Date("2026-11-11T09:00:00.000Z"));
  assert.match(formatted, /2026/);
  assert.match(formatted, /Kas|11/);
});

test("istanbul year uses Europe/Istanbul", () => {
  assert.equal(istanbulYear(new Date("2026-01-01T00:30:00.000Z")), 2026);
});

test("formatAssignedAtLabel uses Bugün for same Istanbul day", () => {
  const now = new Date("2026-11-16T12:00:00.000+03:00");
  const label = formatAssignedAtLabel("2026-11-16T10:28:32.000+03:00", now);
  assert.match(label, /^Bugün /);
  assert.match(label, /10[.:]28/);
  assert.match(label, /atandı$/);
});

test("formatAssignmentRangeLabel shortens same-day end", () => {
  const now = new Date("2026-11-16T18:00:00.000+03:00");
  const label = formatAssignmentRangeLabel(
    "2026-11-16T10:28:00.000+03:00",
    "2026-11-16T11:05:00.000+03:00",
    now,
  );
  assert.match(label, /→/);
  assert.match(label, /11[.:]05/);
});
