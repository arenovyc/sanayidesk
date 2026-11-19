import assert from "node:assert/strict";
import { test } from "node:test";
import { jobReturnFrom } from "./job-return";

test("defaults to today", () => {
  assert.deepEqual(jobReturnFrom(null), { href: "/today", label: "Bugün" });
  assert.deepEqual(jobReturnFrom("https://evil"), {
    href: "/today",
    label: "Bugün",
  });
});

test("allows board with query", () => {
  assert.deepEqual(jobReturnFrom("/board?status=ready"), {
    href: "/board?status=ready",
    label: "İşler",
  });
});
