import "server-only";
import type { AppointmentStatus } from "@/lib/appointments/status";
import { createServerSupabase } from "@/lib/supabase/server";

export type AppointmentRow = {
  id: string;
  plate: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string;
  workOrderId: string | null;
  customerId: string | null;
  createdAt: string;
};

function isMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("appointments")
  );
}

function mapRow(row: {
  id: string;
  plate: string;
  scheduled_at: string;
  status: string;
  notes: string;
  work_order_id: string | null;
  customer_id: string | null;
  created_at: string;
}): AppointmentRow {
  return {
    id: row.id,
    plate: row.plate,
    scheduledAt: row.scheduled_at,
    status: row.status as AppointmentStatus,
    notes: row.notes ?? "",
    workOrderId: row.work_order_id,
    customerId: row.customer_id,
    createdAt: row.created_at,
  };
}

export async function listAppointments(
  workspaceId: string,
  opts?: { from?: string; to?: string; limit?: number },
): Promise<{ rows: AppointmentRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  let query = supabase
    .from("appointments")
    .select(
      "id, plate, scheduled_at, status, notes, work_order_id, customer_id, created_at",
    )
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true })
    .limit(opts?.limit ?? 80);

  if (opts?.from) query = query.gte("scheduled_at", opts.from);
  if (opts?.to) query = query.lte("scheduled_at", opts.to);

  const { data, error } = await query;
  if (error) {
    if (isMissing(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapRow),
  };
}

export async function listTodayScheduledAppointments(
  workspaceId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<{ rows: AppointmentRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, plate, scheduled_at, status, notes, work_order_id, customer_id, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "scheduled")
    .gte("scheduled_at", dayStartIso)
    .lt("scheduled_at", dayEndIso)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) {
    if (isMissing(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map(mapRow),
  };
}
