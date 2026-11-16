import assert from "node:assert/strict";
import { test } from "node:test";
import { statusForBoardDrop } from "./board-drop";

test("statusForBoardDrop allows open to open", () => {
  assert.equal(statusForBoardDrop("intake", "in_progress"), "in_progress");
  assert.equal(statusForBoardDrop("ready", "waiting_parts"), "waiting_parts");
});

test("statusForBoardDrop rejects same or invalid", () => {
  assert.equal(statusForBoardDrop("intake", "intake"), null);
  assert.equal(statusForBoardDrop("delivered", "ready"), null);
  assert.equal(statusForBoardDrop("intake", "delivered"), null);
});
