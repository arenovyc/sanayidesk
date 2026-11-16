"use server";

import { redirect } from "next/navigation";
import { requireDeskSession } from "@/lib/auth/get-membership";
import { MISSING_SUPABASE_ENV } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  convertAppointmentSchema,
  createAppointmentSchema,
  firstAppointmentZodError,
  updateAppointmentStatusSchema,
} from "@/lib/validations/appointments";

export type AppointmentActionState = {
  error: string | null;
};

function mapError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid_plate")) return "Plaka geçersiz";
  if (text.includes("invalid_time")) return "Saat geçersiz";
  if (text.includes("invalid_status")) return "Durum güncellenemez";
  if (text.includes("forbidden")) return "Bu işlem için yetkin yok";
  if (text.includes("not_found")) return "Randevu bulunamadı";
  return message;
}

export async function createAppointmentAction(
  _prev: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  await requireDeskSession();
  const customerRaw = String(formData.get("customerId") ?? "").trim();
  const parsed = createAppointmentSchema.safeParse({
    plate: String(formData.get("plate") ?? ""),
    scheduledAt: String(formData.get("scheduledAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    customerId: customerRaw ? customerRaw : null,
  });
  if (!parsed.success) return { error: firstAppointmentZodError(parsed.error) };

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) return { error: "Saat geçersiz" };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_create_appointment", {
    _plate: parsed.data.plate,
    _scheduled_at: when.toISOString(),
    _notes: parsed.data.notes,
    _customer_id: parsed.data.customerId,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/appointments");
}

export async function updateAppointmentStatusAction(
  _prev: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  await requireDeskSession();
  const parsed = updateAppointmentStatusSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { error: firstAppointmentZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { error } = await supabase.rpc("desk_update_appointment_status", {
    _appointment_id: parsed.data.appointmentId,
    _status: parsed.data.status,
  });
  if (error) return { error: mapError(error.message) };
  redirect("/appointments");
}

export async function convertAppointmentAction(
  _prev: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  await requireDeskSession();
  const parsed = convertAppointmentSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
  });
  if (!parsed.success) return { error: firstAppointmentZodError(parsed.error) };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: MISSING_SUPABASE_ENV };

  const { data, error } = await supabase.rpc("desk_convert_appointment_to_job", {
    _appointment_id: parsed.data.appointmentId,
  });
  if (error) return { error: mapError(error.message) };
  if (typeof data === "string" && data.length > 0) {
    redirect(`/jobs/${data}`);
  }
  redirect("/appointments");
}
