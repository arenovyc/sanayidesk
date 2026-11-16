import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Pure helper mirrored by require*Session redirect gate. */
function shouldBlockSuspended(isSuspended: boolean): boolean {
  return isSuspended;
}

describe("suspended gate", () => {
  it("blocks only when suspended", () => {
    assert.equal(shouldBlockSuspended(true), true);
    assert.equal(shouldBlockSuspended(false), false);
  });
});
