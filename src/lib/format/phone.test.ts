import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePhone } from "./phone";

test("keeps digits only", () => {
  assert.equal(normalizePhone("0532 111 22 33"), "05321112233");
  assert.equal(normalizePhone("+90 (532) 111-22-33"), "905321112233");
});

test("empty when no digits", () => {
  assert.equal(normalizePhone("abc"), "");
  assert.equal(normalizePhone(""), "");
});
