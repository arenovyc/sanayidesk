import test from "node:test";
import assert from "node:assert/strict";
import { isSampleWorkOrder } from "@/lib/work-orders/is-sample";

test("isSampleWorkOrder detects registration demo job", () => {
  assert.equal(
    isSampleWorkOrder({
      complaint: "Örnek İş Emri — İnceleyip silebilirsiniz",
      customerName: "Örnek Müşteri",
      status: "intake",
    }),
    true,
  );
});

test("isSampleWorkOrder is false when already closed", () => {
  assert.equal(
    isSampleWorkOrder({
      complaint: "Örnek İş Emri",
      customerName: "Örnek Müşteri",
      status: "cancelled",
    }),
    false,
  );
});