import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { requestNow } from "@/lib/time/request-now";

export type BonusRow = {
  id: string;
  amount: number;
  note: string;
  createdAt: string;
  workOrderId: string;
  membershipId: string;
  mechanicName: string;
  plate: string | null;
  displayNo: string | null;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("mechanic_bonus_entries")
  );
}

function istanbulMonthBounds(now: Date): { start: string; end: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const start = `${year}-${month}-01T00:00:00+03:00`;
  const nextMonth = Number(month) === 12 ? 1 : Number(month) + 1;
  const nextYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+03:00`;
  return { start, end };
}

export async function listBonusesForWorkOrder(
  workspaceId: string,
  workOrderId: string,
): Promise<{ rows: BonusRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("mechanic_bonus_entries")
    .select(
      "id, amount, note, created_at, work_order_id, membership_id, memberships(display_name)",
    )
    .eq("workspace_id", workspaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => mapBonus(row, null, null)),
  };
}

export async function listBonusesThisMonth(
  workspaceId: string,
): Promise<{ rows: BonusRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { start, end } = istanbulMonthBounds(await requestNow());
  const { data, error } = await supabase
    .from("mechanic_bonus_entries")
    .select(
      "id, amount, note, created_at, work_order_id, membership_id, memberships(display_name), work_orders(display_no, vehicles(plate_normalized))",
    )
    .eq("workspace_id", workspaceId)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => {
      const woRaw = row.work_orders as unknown;
      const wo = Array.isArray(woRaw) ? woRaw[0] : woRaw;
      const displayNo =
        wo && typeof wo === "object" && "display_no" in wo
          ? ((wo as { display_no: string | null }).display_no ?? null)
          : null;
      const vehiclesRaw =
        wo && typeof wo === "object" && "vehicles" in wo
          ? (wo as { vehicles: unknown }).vehicles
          : null;
      const vehicle = Array.isArray(vehiclesRaw) ? vehiclesRaw[0] : vehiclesRaw;
      const plate =
        vehicle && typeof vehicle === "object" && "plate_normalized" in vehicle
          ? String((vehicle as { plate_normalized: string }).plate_normalized)
          : null;
      return mapBonus(row, plate, displayNo);
    }),
  };
}

function mapBonus(
  row: {
    id: string;
    amount: number | string;
    note: string;
    created_at: string;
    work_order_id: string;
    membership_id: string;
    memberships?: unknown;
  },
  plate: string | null,
  displayNo: string | null,
): BonusRow {
  const memRaw = row.memberships as unknown;
  const mem = Array.isArray(memRaw) ? memRaw[0] : memRaw;
  const name =
    mem && typeof mem === "object" && "display_name" in mem
      ? String((mem as { display_name: string }).display_name)
      : "—";
  return {
    id: row.id,
    amount: Number(row.amount),
    note: row.note,
    createdAt: row.created_at,
    workOrderId: row.work_order_id,
    membershipId: row.membership_id,
    mechanicName: name || "—",
    plate,
    displayNo,
  };
}
