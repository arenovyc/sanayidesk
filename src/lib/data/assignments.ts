import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type ActiveAssignment = {
  workOrderId: string;
  membershipId: string;
  displayName: string;
};

export type AssignmentHistoryRow = {
  id: string;
  membershipId: string;
  displayName: string;
  assignedAt: string;
  unassignedAt: string | null;
};

export type MechanicLoadRow = {
  membershipId: string;
  displayName: string;
  openCount: number;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("work_order_assignments") ||
    msg.includes("mechanic_open_job_counts") ||
    msg.includes("work_order_money_open")
  );
}

export async function listActiveAssignments(
  workspaceId: string,
): Promise<{ rows: ActiveAssignment[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("work_order_assignments")
    .select("work_order_id, membership_id, memberships(display_name)")
    .eq("workspace_id", workspaceId)
    .is("unassigned_at", null);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => {
      const memRaw = row.memberships as unknown;
      const mem = Array.isArray(memRaw) ? memRaw[0] : memRaw;
      const name =
        mem && typeof mem === "object" && "display_name" in mem
          ? String((mem as { display_name: string }).display_name)
          : "—";
      return {
        workOrderId: row.work_order_id,
        membershipId: row.membership_id,
        displayName: name || "—",
      };
    }),
  };
}

export async function listAssignmentHistory(
  workspaceId: string,
  workOrderId: string,
): Promise<{ rows: AssignmentHistoryRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("work_order_assignments")
    .select(
      "id, membership_id, assigned_at, unassigned_at, memberships(display_name)",
    )
    .eq("workspace_id", workspaceId)
    .eq("work_order_id", workOrderId)
    .order("assigned_at", { ascending: false })
    .limit(5);

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => {
      const memRaw = row.memberships as unknown;
      const mem = Array.isArray(memRaw) ? memRaw[0] : memRaw;
      const name =
        mem && typeof mem === "object" && "display_name" in mem
          ? String((mem as { display_name: string }).display_name)
          : "—";
      return {
        id: row.id,
        membershipId: row.membership_id,
        displayName: name || "—",
        assignedAt: row.assigned_at,
        unassignedAt: row.unassigned_at,
      };
    }),
  };
}

export async function listMechanicLoad(
  workspaceId: string,
): Promise<{ rows: MechanicLoadRow[]; schemaMissing: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { rows: [], schemaMissing: false };

  const { data, error } = await supabase
    .from("mechanic_open_job_counts")
    .select("membership_id, display_name, open_count")
    .eq("workspace_id", workspaceId)
    .order("display_name", { ascending: true });

  if (error) {
    if (isMissingRelation(error)) return { rows: [], schemaMissing: true };
    throw error;
  }

  return {
    schemaMissing: false,
    rows: (data ?? []).map((row) => ({
      membershipId: row.membership_id,
      displayName: row.display_name || "Usta",
      openCount: Number(row.open_count) || 0,
    })),
  };
}

export async function listMoneyOpen(
  workspaceId: string,
): Promise<{
  byId: Map<string, { due: number; paid: number; remaining: number }>;
  schemaMissing: boolean;
}> {
  const supabase = await createServerSupabase();
  if (!supabase) return { byId: new Map(), schemaMissing: false };

  const { data, error } = await supabase
    .from("work_order_money_open")
    .select("work_order_id, due, paid, remaining")
    .eq("workspace_id", workspaceId);

  if (error) {
    if (isMissingRelation(error)) {
      return { byId: new Map(), schemaMissing: true };
    }
    throw error;
  }

  const byId = new Map<string, { due: number; paid: number; remaining: number }>();
  for (const row of data ?? []) {
    byId.set(row.work_order_id, {
      due: Number(row.due),
      paid: Number(row.paid),
      remaining: Number(row.remaining),
    });
  }
  return { byId, schemaMissing: false };
}
