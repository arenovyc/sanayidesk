import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMoney } from "./money";

test("formats TRY in tr-TR", () => {
  const formatted = formatMoney("12000");
  assert.match(formatted, /12\.000/);
  assert.match(formatted, /₺|TRY/);
});
