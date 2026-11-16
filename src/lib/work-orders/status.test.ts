import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bucketForStatus,
  canTransition,
  isOpenStatus,
  staffCanTransition,
} from "./status";

test("today buckets are mutually exclusive", () => {
  assert.equal(bucketForStatus("intake"), "inside");
  assert.equal(bucketForStatus("waiting_approval"), "inside");
  assert.equal(bucketForStatus("in_progress"), "inside");
  assert.equal(bucketForStatus("waiting_parts"), "parts");
  assert.equal(bucketForStatus("ready"), "ready");
  assert.equal(bucketForStatus("delivered"), null);
  assert.equal(bucketForStatus("cancelled"), null);
});

test("open statuses exclude terminal", () => {
  assert.equal(isOpenStatus("intake"), true);
  assert.equal(isOpenStatus("waiting_approval"), true);
  assert.equal(isOpenStatus("ready"), true);
  assert.equal(isOpenStatus("delivered"), false);
  assert.equal(isOpenStatus("cancelled"), false);
});

test("desk can move freely among open statuses", () => {
  assert.equal(canTransition("intake", "ready"), true);
  assert.equal(canTransition("intake", "waiting_approval"), true);
  assert.equal(canTransition("waiting_approval", "in_progress"), true);
  assert.equal(canTransition("waiting_parts", "in_progress"), true);
  assert.equal(canTransition("ready", "intake"), true);
});

test("ready can be delivered; delivered and cancelled are terminal", () => {
  assert.equal(canTransition("ready", "delivered"), true);
  assert.equal(canTransition("in_progress", "delivered"), false);
  assert.equal(canTransition("delivered", "intake"), false);
  assert.equal(canTransition("cancelled", "intake"), false);
});

test("any open status can be cancelled", () => {
  assert.equal(canTransition("intake", "cancelled"), true);
  assert.equal(canTransition("ready", "cancelled"), true);
  assert.equal(canTransition("delivered", "cancelled"), false);
});

test("same status is not a transition", () => {
  assert.equal(canTransition("intake", "intake"), false);
});

test("staff cannot deliver or cancel", () => {
  assert.equal(staffCanTransition("ready", "delivered"), false);
  assert.equal(staffCanTransition("intake", "cancelled"), false);
  assert.equal(staffCanTransition("intake", "waiting_parts"), true);
  assert.equal(staffCanTransition("waiting_parts", "ready"), true);
});
