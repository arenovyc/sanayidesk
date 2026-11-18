import assert from "node:assert/strict";
import { test } from "node:test";
import { workOrderLabel } from "@/lib/work-orders/display";
import {
  bannerCopy,
  isCounterTrade,
  isWorkshopTrade,
  QUICK_PRESETS,
  TRADE_KINDS,
} from "./kinds";

test("counter vs workshop", () => {
  assert.equal(isCounterTrade("parca"), true);
  assert.equal(isCounterTrade("torna"), true);
  assert.equal(isWorkshopTrade("tamir"), true);
  assert.equal(isWorkshopTrade("parca"), false);
});

test("every trade has presets", () => {
  for (const kind of TRADE_KINDS) {
    assert.ok(QUICK_PRESETS[kind].length >= 3);
  }
});

test("banner counter never mentions 34 ORN", () => {
  assert.equal(bannerCopy("parca").body.includes("34 ORN"), false);
  assert.equal(bannerCopy("torna").body.includes("34 ORN"), false);
  assert.ok(bannerCopy("tamir").body.includes("34 ORN"));
});

test("workOrderLabel prefers counter title", () => {
  assert.equal(
    workOrderLabel({ plate: "06ABC123", counterTitle: "Ahmet Oto balata" }),
    "Ahmet Oto balata",
  );
  assert.equal(
    workOrderLabel({ plate: "06ABC123", counterTitle: null }),
    "06ABC123",
  );
});
