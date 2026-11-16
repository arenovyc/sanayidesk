import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/appointments/status";

export const createAppointmentSchema = z.object({
  plate: z.string().trim().min(3, "Plaka gerekli").max(20),
  scheduledAt: z.string().trim().min(1, "Saat gerekli"),
  notes: z.string().trim().max(500).optional().default(""),
  customerId: z.uuid().optional().nullable(),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.uuid(),
  status: z.enum(APPOINTMENT_STATUSES),
});

export const convertAppointmentSchema = z.object({
  appointmentId: z.uuid(),
});

export function firstAppointmentZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Geçersiz form";
}
