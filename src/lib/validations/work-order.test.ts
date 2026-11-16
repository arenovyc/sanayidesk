import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptWorkOrderSchema } from "./work-order";

test("normalizes plate and allows walk-in", () => {
  const parsed = acceptWorkOrderSchema.parse({
    plate: "06 abc 123",
    fullName: "",
    phone: "",
    complaint: "",
  });
  assert.equal(parsed.plate, "06ABC123");
  assert.equal(parsed.fullName, "");
  assert.equal(parsed.phone, "");
});

test("rejects short plate", () => {
  const result = acceptWorkOrderSchema.safeParse({ plate: "06" });
  assert.equal(result.success, false);
});

test("normalizes phone digits", () => {
  const parsed = acceptWorkOrderSchema.parse({
    plate: "34ABC123",
    phone: "0532 111 22 33",
  });
  assert.equal(parsed.phone, "05321112233");
});
