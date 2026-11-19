import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSeedDemoWorkspace,
  workspaceAudience,
} from "./demo-workspace";

describe("workspaceAudience", () => {
  it("marks Ostim seed and smoke shops as demo", () => {
    assert.equal(workspaceAudience("baskent-oto"), "demo");
    assert.equal(workspaceAudience("ostim-yildiz-oto"), "demo");
    assert.equal(workspaceAudience("smoke-a"), "demo");
    assert.equal(isSeedDemoWorkspace("smoke-xyz"), true);
  });

  it("treats self-serve registrations as customers", () => {
    assert.equal(workspaceAudience("ahmet-oto-mekanik-482"), "customer");
    assert.equal(isSeedDemoWorkspace("yeni-kaporta-ankara"), false);
  });
});
