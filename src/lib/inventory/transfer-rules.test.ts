import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canRequestTransfer,
  transferStatusLabel,
} from "@/lib/inventory/transfer-rules";

describe("inventory transfer rules", () => {
  it("rejects same workspace and oversell", () => {
    assert.equal(
      canRequestTransfer(1, 5, "a", "a").ok,
      false,
    );
    assert.equal(
      canRequestTransfer(6, 5, "a", "b").ok,
      false,
    );
    assert.equal(canRequestTransfer(2, 5, "a", "b").ok, true);
  });

  it("labels statuses", () => {
    assert.equal(transferStatusLabel("pending"), "Bekliyor");
    assert.equal(transferStatusLabel("approved"), "Onaylı");
  });
});
