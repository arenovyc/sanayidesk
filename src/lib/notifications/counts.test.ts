import assert from "node:assert/strict";
import { test } from "node:test";
import { totalNotificationBadge } from "./counts";

test("totalNotificationBadge sums four buckets", () => {
  assert.equal(
    totalNotificationBadge({
      b2bPending: 2,
      unassigned: 1,
      ready: 3,
      lowStock: 4,
    }),
    10,
  );
  assert.equal(
    totalNotificationBadge({
      b2bPending: 0,
      unassigned: 0,
      ready: 0,
      lowStock: 0,
    }),
    0,
  );
});
