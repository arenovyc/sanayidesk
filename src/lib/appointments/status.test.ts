import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canConvertAppointment,
  canUpdateAppointmentStatus,
} from "@/lib/appointments/status";

describe("appointment status", () => {
  it("allows convert from scheduled/arrived", () => {
    assert.equal(canConvertAppointment("scheduled"), true);
    assert.equal(canConvertAppointment("arrived"), true);
    assert.equal(canConvertAppointment("cancelled"), false);
    assert.equal(canConvertAppointment("converted"), false);
  });

  it("blocks leaving converted", () => {
    assert.equal(canUpdateAppointmentStatus("converted", "scheduled"), false);
    assert.equal(canUpdateAppointmentStatus("scheduled", "cancelled"), true);
  });
});
