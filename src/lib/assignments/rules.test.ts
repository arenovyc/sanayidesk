import assert from "node:assert/strict";
import { test } from "node:test";
import {
  boardColumnForStatus,
  canAssignRole,
  isActiveAssignment,
  isBoardStatus,
} from "./rules";

test("canAssignRole only mechanic", () => {
  assert.equal(canAssignRole("mechanic"), true);
  assert.equal(canAssignRole("apprentice"), false);
  assert.equal(canAssignRole("advisor"), false);
  assert.equal(canAssignRole("owner"), false);
});

test("board columns are open statuses only", () => {
  assert.equal(isBoardStatus("intake"), true);
  assert.equal(isBoardStatus("waiting_approval"), true);
  assert.equal(isBoardStatus("delivered"), false);
  assert.equal(boardColumnForStatus("waiting_parts"), "waiting_parts");
  assert.equal(boardColumnForStatus("waiting_approval"), "waiting_approval");
  assert.equal(boardColumnForStatus("cancelled"), null);
});

test("isActiveAssignment", () => {
  assert.equal(isActiveAssignment({ unassignedAt: null }), true);
  assert.equal(isActiveAssignment({}), true);
  assert.equal(isActiveAssignment({ unassignedAt: "2026-01-01" }), false);
});
