import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  waMaintenanceReminderMessage,
  waPartsVendorMessage,
  waQuoteSummaryMessage,
  waReadyVehicleMessage,
} from "./wa-templates";

describe("wa templates", () => {
  it("ready vehicle includes plate and shop", () => {
    const text = waReadyVehicleMessage({
      shopName: "Demo",
      plate: "34 ABC 123",
      displayNo: "WO-1",
      shopPhone: "05551234567",
    });
    assert.ok(text.includes("Demo"));
    assert.ok(text.includes("34 ABC 123"));
    assert.ok(text.includes("WO-1"));
  });

  it("quote summary", () => {
    const text = waQuoteSummaryMessage({
      shopName: "Demo",
      plate: "06 XYZ 01",
      quoteLabel: "Teklif ₺1.000",
    });
    assert.ok(text.includes("teklif"));
    assert.ok(text.includes("₺1.000"));
  });

  it("ready order without plate", () => {
    const text = waReadyVehicleMessage({
      shopName: "Parça",
      title: "Ahmet Oto balata",
      readyNoun: "order",
    });
    assert.ok(text.includes("siparişiniz hazır"));
    assert.ok(text.includes("Ahmet Oto balata"));
    assert.equal(text.includes("Plaka"), false);
  });

  it("parts vendor", () => {
    const text = waPartsVendorMessage({
      shopName: "Demo",
      plate: "34 ABC 123",
      partsPlain: "Filtre x1",
    });
    assert.ok(text.includes("parça"));
    assert.ok(text.includes("Filtre"));
  });

  it("maintenance reminder", () => {
    const text = waMaintenanceReminderMessage({
      shopName: "Demo",
      plate: "06 KMK 7890",
      shopPhone: "05551234567",
    });
    assert.ok(text.includes("bakım"));
    assert.ok(text.includes("06 KMK 7890"));
  });
});
