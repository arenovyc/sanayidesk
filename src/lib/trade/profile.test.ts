import assert from "node:assert/strict";
import { test } from "node:test";
import { TRADE_KINDS } from "./kinds";
import {
  assertProfilesComplete,
  getTradeProfile,
  jobDetailTabsFor,
  statusLabelFor,
} from "./profile";

test("every trade profile is complete", () => {
  assert.doesNotThrow(() => assertProfilesComplete());
  for (const kind of TRADE_KINDS) {
    const p = getTradeProfile(kind);
    assert.equal(p.kind, kind);
    assert.equal(p.nav.length, 5);
  }
});

test("parca nav has stock and credit", () => {
  const hrefs = getTradeProfile("parca").nav.map((n) => n.href);
  assert.ok(hrefs.includes("/inventory"));
  assert.ok(hrefs.includes("/b2b"));
  assert.equal(hrefs.includes("/neighbors"), false);
});

test("lastik board is queue labeled Sıra", () => {
  const p = getTradeProfile("lastik");
  assert.equal(p.boardVariant, "queue");
  assert.equal(p.nav[1]?.label, "Sıra");
});

test("statusLabelFor uses overrides", () => {
  assert.equal(statusLabelFor("torna", "intake"), "Geldi");
  assert.equal(statusLabelFor("parca", "ready"), "Hazır");
  assert.equal(statusLabelFor("tamir", "intake"), "Kabul");
});

test("counter intake needs", () => {
  assert.equal(getTradeProfile("parca").jobDetail.intakeNeeds, "counter");
  assert.equal(getTradeProfile("tamir").jobDetail.intakeNeeds, "workshop");
});

test("job detail tabs hide dış iş on counter trades", () => {
  assert.equal(jobDetailTabsFor("tamir").length, 4);
  assert.deepEqual(
    jobDetailTabsFor("parca").map((t) => t.id),
    ["ozet", "is", "tahsilat"],
  );
  assert.equal(jobDetailTabsFor("parca").find((t) => t.id === "is")?.label, "Satış");
  assert.equal(jobDetailTabsFor("torna").find((t) => t.id === "is")?.label, "İş");
});
