import assert from "node:assert/strict";
import { test } from "node:test";
import { netBalance, netBalanceLabel } from "./balance";

test("netBalance we_owe minus they_owe", () => {
  assert.equal(netBalance(100, 40), 60);
  assert.equal(netBalance(40, 100), -60);
  assert.equal(netBalance(50, 50), 0);
});

test("netBalanceLabel matches sign", () => {
  assert.equal(netBalanceLabel(10), "Biz borçluyuz (net)");
  assert.equal(netBalanceLabel(-10), "Onlar borçlu (net)");
  assert.equal(netBalanceLabel(0), "Bakiye sıfır");
});
