import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLeadSchema } from "@/lib/validations/leads";

describe("createLeadSchema", () => {
  it("accepts valid lead", () => {
    const parsed = createLeadSchema.safeParse({
      name: "Aren",
      shopName: "Motorcu",
      email: "a@b.com",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects short name", () => {
    const parsed = createLeadSchema.safeParse({
      name: "A",
      shopName: "Motorcu",
      email: "a@b.com",
    });
    assert.equal(parsed.success, false);
  });
});
